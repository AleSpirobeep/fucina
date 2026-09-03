# Checklist di qualità della specifica: L'analista

**Scopo**: validare completezza e qualità della specifica prima del piano
**Creata**: 2026-09-03
**Specifica**: [spec.md](../spec.md)

## Qualità del contenuto

- [x] Nessun dettaglio implementativo nei requisiti — la forma del ruolo (skill locale) è
      una decisione registrata nell'ADR e nei chiarimenti, non un requisito
- [x] Centrata sul valore: l'agente si ferma a chiedere, e niente parte prima del tempo
- [x] Leggibile da chi non sviluppa
- [x] Tutte le sezioni obbligatorie compilate

## Completezza dei requisiti

- [x] Nessun marcatore [NEEDS CLARIFICATION] rimasto: le quattro domande sono state poste
      ad Alessio il 3/9/2026 e le risposte sono nella sezione «Chiarimenti»
- [x] Requisiti testabili e non ambigui: ognuno dei 31 ha la sua riga *Verifica*
- [x] Criteri di successo misurabili (SC-301..SC-306)
- [x] Criteri di successo indipendenti dalla tecnologia
- [x] Scenari di accettazione definiti per ognuno dei cinque scenari d'uso
- [x] Casi limite identificati (12)
- [x] Ambito delimitato: repo già preparato, fino alle issue in coda, niente creazione di
      repository o gestione di secret
- [x] Dipendenze e assunzioni identificate

## Prontezza

- [x] Ogni requisito funzionale ha un criterio di accettazione
- [x] Gli scenari coprono i flussi principali (analisi, buchi, cancello, ripresa, tracce)
- [x] Ogni requisito è coperto da almeno un task in `tasks.md`
- [x] Nessun dettaglio implementativo trapela nei requisiti

## Note

- Un analista che dialoga via commenti su una issue, utilizzabile dal telefono, è
  esplicitamente rinviato a una spec successiva: è il punto rinviato di questa spec.
- La spec 003 ha ancora il collaudo (T008) aperto: la 004 non va messa in coda prima che
  quello chiuda.
