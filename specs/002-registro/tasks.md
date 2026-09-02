# Task della spec 002 — in ordine di dipendenza

Ogni task diventa una issue. Si etichetta `ready-for-dev` **una alla volta**, nell'ordine:
ognuna presuppone che la precedente sia fusa. Il ruolo di PM in v1 è questo.

| # | Task | Requisiti | Dipende da |
|---|---|---|---|
| T1 | Impalcatura: `ui/index.html`, `ui/lib.js`, `ui/lib.test.js` con una funzione banale testata; CI `node --test ui/` verde | 140, 141 | — |
| T2 | Configurazione: modulo iniziale, `localStorage`, pulsanti "Configurazione" e "Dimentica il token" | 101, 102, 103 | T1 |
| T3 | `lib.js`: estrazione delle sezioni **Non fatto**, **Fatto in più**, **Decisioni** dal corpo di una PR — pura, testata sui corpi reali delle PR #6 e #9 di fucina-lab | 110 (parte) | T1 |
| T4 | `lib.js`: classificazione di issue e PR nelle sei colonne a partire da label, stato e data di chiusura — pura, testata | 120 (parte) | T1 |
| T5 | Client GitHub: funzioni che leggono issue, PR, commenti, check e run di un repo, con gestione degli errori HTTP e del token mancante | 122 (parte) | T2 |
| T6 | Sezione "Aspettano te": `needs-human` con l'ultimo commento dell'agente, `needs-review` con le due sezioni e lo stato dei check, link, messaggio a coda vuota | 110, 111, 112, 113 | T3, T5 |
| T7 | Avanzamento: tabella a sei colonne per repo con conteggi e titoli | 120 | T4, T5 |
| T8 | Agenti attivi: run `dev-agent` in corso o in coda, con issue, tempo trascorso e link | 121 | T5 |
| T9 | Aggiornamento automatico ogni 60 s, pulsante manuale, ora dell'ultimo aggiornamento, errori visibili | 122 | T6, T7, T8 |
| T10 | Comando "Rispondi e riavvia": campo, conferma con anteprima, tre chiamate in ordine, errori per chiamata | 130, 131, 132 | T6 |
| T11 | Identità visiva e impaginazione desktop: palette e tipografia della fucina, layout ≥1200 px | 142, OP-203 | T9, T10 |
| T12 | `ui/apri.ps1`: avvia un server locale sulla cartella `ui/` e apre il browser | 143 | T1 |

T3 e T4 non dipendono da T2 e possono andare in parallelo — ma in v1 il loop lavora una
issue per volta, quindi l'ordine resta quello della tabella.
