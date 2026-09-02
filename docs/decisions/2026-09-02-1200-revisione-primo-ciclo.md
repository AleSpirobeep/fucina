---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# Correzioni dopo la revisione del primo ciclo completo

## Contesto e problema
Il primo ciclo issue → PR si è chiuso con successo su fucina-lab#1: codice corretto,
ADR scritto di iniziativa dell'agente, sezione "Non fatto" compilata in modo utile,
tre check verdi. La revisione umana del diff ha però trovato tre cose che nessun
check avrebbe intercettato.

**Nessun test.** L'agente ha scritto una funzione pubblica nuova e zero test, e lo ha
dichiarato: *"nessuna modifica ai file di test (protetti da .fucina.yml)"*. Ha letto
la protezione come divieto assoluto. La decisione OP-08 diceva l'opposto — può creare
file nuovi, non modificare gli esistenti — ma il ruolo enunciava solo il divieto, e
il guard bloccava comunque anche le aggiunte. Le due cose insieme hanno prodotto
codice nuovo senza copertura.

**Modifica fuori perimetro non dichiarata.** Ha riordinato e rinumerato una sezione
del README che l'issue non nominava. Lavoro attento, ma assente da "Cosa cambia",
"Decisioni" e "Non fatto". La sezione "Non fatto" cattura ciò che manca; non esisteva
nulla che catturasse ciò che è stato aggiunto di propria iniziativa.

**Messaggio d'errore falso.** `applica_sconto_valore` solleva `ValueError` sia per
sconto negativo sia per sconto superiore all'imponibile, con un unico messaggio
"sconto superiore all'imponibile: -5 > 80" — falso nel primo caso. Un test parallelo
a quelli esistenti, che verificano il messaggio con `match=`, avrebbe costretto a
distinguere i due casi. È la dimostrazione concreta del primo punto.

## Decisione
Quattro correzioni.

1. **Ruolo, test.** Da "non modificare i test" a "scrivi test per il codice che
   scrivi, in file nuovi; non modificare quelli esistenti". Il divieto resta ma
   smette di leggersi come "stai lontano dai test".
2. **Ruolo, perimetro.** Sezione **"Fatto in più"** obbligatoria nel corpo della PR,
   simmetrica a "Non fatto": ogni file toccato che l'issue non nominava. Entrambe
   obbligatorie anche quando vuote.
3. **Guard.** `git diff --diff-filter=MD`: intercetta modifiche e cancellazioni,
   lascia passare le aggiunte. Senza questa, il ruolo corretto produrrebbe subito
   un check rosso ingiusto.
4. **Workflow.** L'agente apre la PR da sé con `gh pr create` (così il corpo che ha
   scritto arriva intatto); un passo di ripiego la apre con un corpo minimo se non
   l'ha fatto, segnalando esplicitamente che il corpo manca.

Contestualmente `Bash(gh:*)` è sostituito dai soli sottocomandi necessari:
`gh:*` includerebbe `gh pr merge` e violerebbe il principio P4.

## Conseguenze
Il valore della revisione umana è ora misurato, non ipotizzato: al primo ciclo ha
prodotto tre correzioni, **nessuna delle quali fa diventare rosso un check**. Il
codice sarebbe entrato in main con un messaggio d'errore falso, una funzione senza
test e una modifica alla documentazione che nessuno aveva chiesto.

Conferma la scelta P4 di tenere il merge umano, e chiarisce cosa deve guardare chi
revisiona: non se i check sono verdi, ma il diff e le due sezioni dichiarative.

## Conferma
Il prossimo ciclo (fucina-lab#2, esenzione IVA) deve produrre: un file di test nuovo
sotto `tests/`, una PR aperta dall'agente con entrambe le sezioni compilate, e
`guard-tests` verde nonostante l'aggiunta sotto `tests/`.
