# Modello dei dati — spec 003

Tre strutture, tutte JSON, tutte senza stato oltre GitHub.

## 1. Stato del repo (`stato.json`) — input di `pm-coda.js`

Costruito dal workflow con `gh ... --json`. Contiene solo ciò che serve alla decisione.

```json
{
  "rapporto": 26,
  "pr": [
    {
      "numero": 40,
      "titolo": "T003: ...",
      "labels": ["needs-review"],
      "corpo": "## Decisioni\n...\n## Non fatto\nnulla\n## Fatto in più\nnulla\n\nCloses #31",
      "check": "verde",
      "ultimoCommentoPm": false
    }
  ],
  "issue": [
    { "numero": 31, "titolo": "T003: ...", "labels": ["in-progress"], "ultimoCommentoPm": false },
    { "numero": 30, "titolo": "T002: ...", "labels": ["needs-human"], "ultimoCommentoPm": true },
    { "numero": 32, "titolo": "T004: ...", "labels": ["in-coda"], "ultimoCommentoPm": false }
  ]
}
```

- `rapporto`: numero dell'issue con `rapporto-pm`, oppure `null` (il workflow la crea prima
  di chiamare lo script; lo script la esclude comunque da ogni conteggio).
- `pr[].check`: `verde` (tutti i check conclusi con successo o neutri), `rosso` (almeno uno
  concluso in errore), `in-corso` (almeno uno non concluso e nessuno in errore). Il workflow
  lo calcola da `gh pr checks N --json state,bucket`; i valori `bucket` `pass`/`skipping` →
  verde, `fail`/`cancel` → rosso, `pending` → in-corso.
- `ultimoCommentoPm`: `true` se l'ultimo commento (issue o PR) contiene
  `<!-- fucina:pm-umano -->`.
- Le PR e le issue chiuse non compaiono. Le issue del rapporto non compaiono in `issue`.

## 2. Decisione — output di `pm-coda.js`

```json
{ "azione": "revisione", "numero": 40, "motivo": "PR #40 con check verdi e corpo completo", "dettagli": {} }
```

| `azione` | `numero` | `dettagli` | chi la esegue |
|---|---|---|---|
| `niente` | — | `{}` | nessuno: il job termina in silenzio |
| `avvia-task` | issue | `{ "task": "T004" }` | workflow |
| `attendi-check` | PR | `{}` | workflow (`gh pr checks --watch`, poi ridecide) |
| `rimanda-check-rossi` | PR | `{ "issue": 31 }` | workflow |
| `rimanda-corpo-incompleto` | PR | `{ "issue": 31, "manca": ["Fatto in più"] }` | workflow |
| `revisione` | PR | `{ "issue": 31 }` | modello, poi workflow con il verdetto |
| `domanda` | issue | `{}` | modello, poi workflow con il verdetto |

`dettagli.issue` è il numero dopo `Closes #` nel corpo della PR; se assente, `null` (il
workflow allora commenta solo sulla PR e lo segnala nel rapporto).

## 3. Verdetto (`verdetto.json`) — output del ruolo `pm-agent`

Vedi `contracts/verdetto.md` per il contratto completo.

```json
{
  "versione": 1,
  "oggetto": { "tipo": "pr", "numero": 40 },
  "esito": "rimanda",
  "motivo": "REQ-121 non soddisfatto: manca il conteggio della colonna Fatte",
  "commento": "## Revisione\n\n1. Corpo: sì\n2. Criteri: **no** — ...",
  "nuove_issue": [],
  "adr": ["2026-09-04-1030-nome.md"]
}
```

## Transizioni di stato (viste dal PM)

```text
in-coda ──avvia-task──▶ ready-for-dev ──(dev-agent)──▶ in-progress ──▶ PR needs-review
                                                                          │
   ┌──────────────────────────────────────────────────────────────────────┤
   │ check rossi / corpo incompleto → rimanda (deterministico)            │
   │ check verdi + corpo completo   → revisione (modello) → fondi | rimanda | umano
   ▼
 fondi   : PR fusa, issue chiusa da "Closes #", poi avvia-task del successivo
 rimanda : PR chiusa, issue ready-for-dev (conta come tentativo)
 umano   : PR needs-human + commento marcato; ferma la coda finché Alessio non agisce

 issue needs-human (domanda o tentativi esauriti) → domanda (modello) → rispondi | umano | riscrivi
 rispondi : commento, ready-for-dev
 umano    : commento marcato, resta needs-human (Registro → "Rispondi e riavvia")
 riscrivi : nuove issue in-coda (T00Na, T00Nb…), originale chiusa
```
