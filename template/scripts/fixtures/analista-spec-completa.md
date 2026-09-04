# Specifica 009 — Esempio completo per il cancello

**Cartella**: `specs/009-esempio` · **Creata**: 3 settembre 2026 · **Stato**: pronta

**Input**: «Voglio un pulsante che spenga la luce.» — Alessio, 3 settembre 2026.

## Chiarimenti

### Sessione 2026-09-03

- D: Il pulsante spegne anche le luci già spente? → R: Sì, senza errore.

## Scenari d'uso

### Scenario 1 — Spegnere la luce (Priorità: P1)

Alessio preme il pulsante e la luce si spegne.

**Scenari di accettazione**:

1. **Dato** una luce accesa, **quando** Alessio preme il pulsante, **allora** si spegne.

### Casi limite

- La luce è già spenta: il pulsante non fa nulla e non segnala errore.

## Requisiti

- **REQ-901** — Il pulsante spegne la luce accesa.
  *Verifica:* premere il pulsante con la luce accesa: si spegne.

- **REQ-902** — Il pulsante su una luce già spenta non produce errore.
  *Verifica:* premere il pulsante due volte: nessun errore.

- **REQ-903** — Lo stato della luce è leggibile in ogni momento.
  *Verifica:* leggere lo stato prima e dopo la pressione.

## Criteri di successo

- **SC-901** — La luce si spegne in meno di un secondo.

## Assunzioni

- La luce è raggiungibile dalla rete locale.
