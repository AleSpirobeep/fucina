# Contratto — il verdetto del ruolo `pm-agent`

Il ruolo scrive **un solo file**, `$RUNNER_TEMP/fucina/verdetto.json` (il percorso esatto
gli viene passato nel prompt come `CARTELLA_FUCINA`), e facoltativamente uno o più ADR in
`$RUNNER_TEMP/fucina/decisioni/AAAA-MM-GG-HHMM-titolo.md`. Non fa altro.

## Schema

```json
{
  "versione": 1,
  "oggetto": { "tipo": "pr" | "issue", "numero": 40 },
  "esito": "fondi" | "rimanda" | "umano" | "rispondi" | "riscrivi",
  "motivo": "una riga, per il rapporto (max 200 caratteri)",
  "commento": "markdown; obbligatorio per rimanda, umano, rispondi, riscrivi; vuoto per fondi",
  "nuove_issue": [ { "titolo": "T004a: ...", "corpo": "..." } ],
  "adr": [ "2026-09-04-1030-titolo.md" ]
}
```

## Esiti ammessi per tipo di oggetto

| `oggetto.tipo` | esiti | effetto (eseguito dal workflow) |
|---|---|---|
| `pr` | `fondi` | `gh pr merge --squash --delete-branch`; errore → `needs-human` sulla PR con l'errore |
| `pr` | `rimanda` | commento sulla PR; chiusura con cancellazione branch; stesso commento sull'issue collegata; `ready-for-dev` |
| `pr` | `umano` | commento (con marcatore) sulla PR; `+needs-human` sulla PR |
| `issue` | `rispondi` | commento sull'issue; `-needs-human +ready-for-dev` |
| `issue` | `umano` | commento (con marcatore) sull'issue; resta `needs-human` |
| `issue` | `riscrivi` | per ogni `nuove_issue`: `gh issue create --label in-coda`; commento e chiusura dell'originale |

Un esito non ammesso per il tipo, un file assente, un JSON non valido, `versione` diversa da
1, `oggetto.numero` diverso da quello richiesto nel prompt: tutti equivalgono a `umano` con
il commento standard «Il PM non ha concluso: <causa>. Log: <link>».

## Regole sul contenuto

- `commento` per `rimanda`: elenco numerato degli otto punti di revisione con sì/no, e per
  ogni no: criterio, file, riga, cosa serve. Nessun "quasi". È il testo che l'agente
  sviluppatore rileggerà al tentativo successivo: deve bastare da solo.
- `commento` per `umano`: una domanda chiusa, con opzioni (A/B/C) e la conseguenza di
  ciascuna, più lo stato esatto in cui restano le cose. Il workflow vi appende il marcatore
  `<!-- fucina:pm-umano -->`.
- `commento` per `rispondi`: la risposta e la fonte (file e sezione della spec, o nome
  dell'ADR). Se la fonte è un ADR nuovo, deve essere in `adr`.
- `nuove_issue[].titolo` per `riscrivi`: `T<NNN><lettera>: <titolo>` con la stessa `NNN`
  dell'originale e lettere in ordine (`a`, `b`, `c`); `corpo` con la stessa struttura delle
  issue della spec (descrizione, requisiti, criteri di accettazione).
- `adr`: solo nomi di file effettivamente presenti in `decisioni/`; formato MADR del
  template `docs/decisions/0000-template.md`, `decision-makers: [pm-agent]`,
  `status: accepted`.

## Cosa il ruolo non ha e non fa

Nessuno strumento tra `gh pr merge`, `gh pr close`, `gh pr comment`, `gh pr edit`,
`gh issue comment`, `gh issue edit`, `gh issue create`, `git commit`, `git push`.
Strumenti permessi (`pm.strumenti_permessi` di default): `Read`, `Glob`, `Grep`, `Write`,
`Bash(gh pr view:*)`, `Bash(gh pr diff:*)`, `Bash(gh pr checks:*)`, `Bash(gh issue view:*)`,
`Bash(gh run view:*)`, `Bash(gh run list:*)`, `Bash(git log:*)`, `Bash(git show:*)`,
`Bash(node:*)` (per eseguire i test della PR in locale se vuole verificarli).
`Write` è tecnicamente libero: il ruolo lo usa solo in `CARTELLA_FUCINA`, e il workflow non
committa nulla dal workspace — solo dalla cartella `decisioni/`.
