# Contratto — il cancello dell'analista

Lo script `scripts/analista-cancello.js` (sorgente: `template/scripts/analista-cancello.js`)
è la verifica che separa un'analisi da una coda di task. È deterministico, non chiama alcun
modello, e l'analista non può convincerlo (P9, REQ-320).

## Riga di comando

    node scripts/analista-cancello.js <cartella-spec> [percorso-.fucina.yml]

Il secondo argomento vale `.fucina.yml` se omesso.

Codici di uscita:

| codice | significato |
| ------ | ----------- |
| `0`    | cancello verde: nessun problema bloccante |
| `1`    | cancello rosso: almeno un problema, elencato su `stdout` |
| `2`    | errore d'uso: argomento mancante o cartella inesistente (messaggio su `stderr`) |

Uscita `0` **non** autorizza la consegna da sola: serve anche la conferma esplicita di
Alessio (REQ-323). Lo script lo ricorda in coda al proprio riepilogo.

## Funzione pura

`verifica({ documenti, configurazione, fileEsistenti })` restituisce:

```js
{
  esito: "positivo" | "negativo",
  problemi: [ { codice, file, riga, messaggio } ],
  conteggi: { requisiti, task, taskManuali, requisitiCoperti }
}
```

- `documenti` — mappa nome → testo. Nomi attesi: `spec.md`, `plan.md`, `tasks.md`,
  `checklists/requirements.md`, e `contracts/<nome>.md` per ogni contratto.
- `configurazione` — l'esito di `leggiConfigurazione(testo di .fucina.yml)`:
  `{ test_command, percorsi_protetti }`. È una lettura mirata di due chiavi, non un
  parser YAML: nessuna dipendenza (CLAUDE.md).
- `fileEsistenti` — i percorsi citati dai task che esistono già nel repo. Serve a
  distinguere una modifica da un'aggiunta: il guard blocca modifiche e cancellazioni e
  lascia passare le aggiunte (`guard-tests.yml`, `--diff-filter=MD`).
- `riga` vale `0` quando il problema riguarda il documento nel suo insieme.

## I problemi bloccanti (REQ-321)

| codice | quando |
| ------ | ------ |
| `documento-mancante` | uno fra `spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md` manca o è vuoto |
| `punto-aperto` | un marcatore `NEEDS CLARIFICATION` o `DA CHIARIRE` fra parentesi quadre compare in un documento |
| `sezione-mancante` | `spec.md` non ha una delle sezioni obbligatorie |
| `nessun-requisito` | `spec.md` non contiene alcun `REQ-NNN` |
| `requisito-senza-verifica` | un requisito non ha la sua riga `*Verifica:*` (P2) |
| `nessun-task` | `tasks.md` non ha alcun task da lavorare (solo fasi manuali) |
| `task-duplicato` | due task con lo stesso identificativo |
| `task-fuori-ordine` | gli identificativi non crescono |
| `task-senza-requisito` | un task da lavorare non cita alcun `REQ-NNN` |
| `task-senza-criteri` | un task da lavorare non ha la riga `Verifica:` |
| `requisito-inesistente` | un task cita un `REQ-NNN` che in `spec.md` non c'è |
| `requisito-non-coperto` | un requisito che nessun task cita |
| `task-su-workflow` | un task da lavorare tocca `.github/workflows/`: l'agente sviluppatore non può scriverlo |
| `task-su-percorso-protetto` | un task da lavorare modifica un file esistente fra i `percorsi_protetti` senza nominare `allow-test-changes` |
| `test-command-vuoto` | `test_command` assente o vuoto in `.fucina.yml` (P3) |

## Convenzioni di scrittura che il cancello dà per assunte

Sono le stesse dei documenti già in `specs/`; il ruolo `analista` le impone.

- Un requisito è una voce di elenco `- **REQ-NNN** — …`; la sua verifica è una riga del
  blocco che comincia con `*Verifica:*`. Il blocco finisce al requisito o al titolo
  successivo.
- Un task è una voce `- [ ] TNNN …`, seguita dalle righe rientrate che la completano. È
  **manuale** se contiene `[MANUALE]` o se sta sotto un titolo che dice «a cura di Alessio»,
  «non sono issue» o «non è una issue». I task manuali non richiedono requisiti né criteri,
  e non fanno scattare i controlli sui percorsi.
- Un rimando ai requisiti si scrive `REQ-301` oppure in catena, `REQ-301, 302, 303`. Un
  numero isolato non è un rimando.
- I percorsi si scrivono fra apici inversi e contengono almeno una barra.

## Cosa il cancello non guarda

- `checklists/requirements.md` non viene scandagliata per i marcatori: la checklist **parla**
  dei marcatori, non ne contiene.
- La presenza dei `contracts/`: sono obbligatori solo quando la spec introduce un formato o
  un'interfaccia, e questo non si decide meccanicamente. Resta un punto della checklist.
- La qualità del contenuto: che un criterio di accettazione sia *buono* lo giudica il PM
  quando revisiona la PR, non il cancello.
