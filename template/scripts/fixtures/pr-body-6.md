`totale_documento` accetta ora un parametro opzionale `modalita_arrotondamento`
con due valori ammessi:

- `"per_riga"` (default, invariato): arrotonda ogni riga e poi somma.
- `"per_documento"`: somma gli importi esatti delle righe e arrotonda solo il
  totale finale.

Il default resta `"per_riga"` per decisione esplicita di @AleSpirobeep nel
thread dell'issue: nessuna rottura di compatibilità per chi già chiama
`totale_documento(righe)` senza specificare la modalità.

Per calcolare l'importo esatto di riga (necessario alla modalità
`"per_documento"`) `totale_riga` è stato scomposto in una funzione interna
`_totale_riga_esatto`, che condivide sconto e IVA ma non arrotonda il
risultato finale; `totale_riga` ora è un sottile involucro che arrotonda il
suo output.

**Verifica:** `pytest -q` — 30 test, tutti verdi (26 preesistenti + 4 nuovi
in `tests/test_arrotondamento_documento.py`). Il nuovo test
`test_scostamento_fra_le_due_modalita` dimostra lo scostamento richiesto
dai criteri di accettazione: 7 righe da 0,01 € con IVA ridotta (ogni riga
vale esattamente 0,011 €) danno 0,07 € in modalità "per_riga" e 0,08 € in
modalità "per_documento".

## Decisioni

- `docs/decisions/2026-09-02-1650-arrotondamento-documento-configurabile.md`:
  registra la decisione sul default (opzione "per_riga", presa da
  @AleSpirobeep) e la scelta implementativa di non arrotondare lo sconto in
  meno rispetto a prima.

## Non fatto

- Nessuna funzione di conversione o migrazione per chi ha già dati calcolati
  con la modalità "per_riga" e volesse ricalcolarli in "per_documento": non
  richiesto dai criteri di accettazione.

## Fatto in più

Nulla: solo `listino/prezzi.py`, il nuovo file di test e il nuovo ADR sono
stati toccati.

Closes #5
