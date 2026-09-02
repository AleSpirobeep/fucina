---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# Il Registro è una pagina statica con il token nel browser

## Contesto e problema
La spec 002 chiede un'interfaccia che mostri la coda delle cose in attesa di una persona,
l'avanzamento dei progetti e gli agenti attivi, con un solo comando. Va scelta la forma.

## Opzioni considerate
- Applicazione web con backend (Next.js o simili, un server, un database): potente,
  costosa da mantenere, e per un solo utente il backend non ha nulla da fare che il
  browser non possa fare da solo.
- Pagina statica che interroga l'API di GitHub con un token personale conservato nel
  `localStorage` del browser.
- Estensione del browser: stessa logica, più attrito di distribuzione.

## Decisione
Pagina statica. Un file HTML, un modulo JS con la logica pura e i suoi test, nessun
passo di build, nessuna dipendenza. Servita da un server locale avviato con uno script,
perché i moduli ES non si caricano da `file://`.

Il token vive nel browser di Alessio, sul suo desktop, e viaggia solo verso
`api.github.com`. È un compromesso accettato con gli occhi aperti: un'estensione
malevola o un accesso fisico alla macchina potrebbero leggerlo. Mitigazioni: token
fine-grained limitato ai repo mostrati e ai soli permessi necessari, scadenza a 90
giorni, pulsante "Dimentica il token".

## Conseguenze
La fucina può costruire il Registro issue per issue, con `node --test` come oracolo.
Il progetto non ha infrastruttura da tenere accesa. Il giorno in cui la pagina non
basterà più — più utenti, notifiche, telefono — sarà un ADR nuovo con scritto perché,
e si partirà da una logica già testata.

La UI vive in `fucina/ui/`: la fucina che costruisce la propria interfaccia è il
collaudo più onesto che possa fare.
