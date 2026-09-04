# Task: Esempio completo per il cancello

## Fase 1: fondamenta

- [ ] T001 Funzione `luce/interruttore.js` che spegne la luce, con test
      `luce/interruttore.test.js`. Copre REQ-901, 902.
      Verifica: `node --test` verde; due pressioni consecutive non sollevano errore.

- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).
      Verifica: la funzione restituisce `acceso` o `spento` e nient'altro.

## Fase 2: collaudo (a cura di Alessio — non sono issue)

- [ ] T003 Provare il pulsante sulla luce vera di casa.
