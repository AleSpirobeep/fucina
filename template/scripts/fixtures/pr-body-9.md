## Cosa ho fatto

La docstring di `arrotonda` (in `listino/prezzi.py`) era una sola riga e non
mostrava un esempio del comportamento di arrotondamento "half up". Ho
aggiunto un esempio in formato doctest che mostra `arrotonda(Decimal("2.025"))
== Decimal("2.03")`, chiarendo la differenza rispetto all'arrotondamento
bancario (half even), che in questo caso darebbe 2.02.

## Come l'ho verificato

- `pytest -q`: 30 passed.
- L'esempio nella docstring usa lo stesso caso già coperto da
  `tests/test_prezzi.py::TestArrotonda::test_half_up_non_half_even`, quindi
  il comportamento mostrato è già garantito dalla suite esistente.

Closes #8

## Decisioni

Nessun ADR: si tratta di un ampliamento di documentazione, non di una
decisione di comportamento o di design.

## Non fatto

Nulla: l'unica richiesta dell'issue era ampliare la docstring con un
esempio, ed è stato fatto.

## Fatto in più

Nulla: ho toccato solo `listino/prezzi.py`, il file indicato dall'issue.

Generated with Claude Code https://claude.ai/code

Closes #8
