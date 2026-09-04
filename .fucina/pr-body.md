## Cosa ho fatto

Aggiunta la funzione `Da-Json($testo)` in `template/scripts/pm.ps1`:

```powershell
function Da-Json($testo) {
    return @((($testo -join "") | ConvertFrom-Json) | ForEach-Object { $_ })
}
```

e sostituiti tutti e cinque i punti che chiamavano `ConvertFrom-Json` direttamente
(`Conta-Pr`, `Conta-Issue`, `Conta-DomandeInAttesa`, `Invoca-Ferma`, `Invoca-Stato`) con
chiamate a `Da-Json`. Nessun'altra riga toccata: BOM (`EF BB BF`) preservato, nessun
`&&`, nessun operatore ternario, nessuna occorrenza di `token`.

Su PowerShell 5.1 `ConvertFrom-Json` deposita un array JSON sulla pipeline come un solo
oggetto, non srotolato elemento per elemento: `@(...).Count` vale quindi sempre 1, sia
con zero elementi che con dieci. Su PowerShell 7 la pipeline srotola invece
correttamente ogni elemento dell'array prima che `@()` lo raccolga, per questo il
difetto non si vede sul runner GitHub (che gira su PS7). `ForEach-Object { $_ }` dentro
`Da-Json` forza lo srotolamento anche su 5.1, allineando i due comportamenti.

Chiude #67.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` → 188/188 verdi
(`pm.ps1` è PowerShell, non coperto da questa suite; né T005 né i criteri della issue
chiedono test automatici per questo file).

Controlli manuali sul file: primi tre byte `ef bb bf` (BOM intatto); nessuna occorrenza
di `ConvertFrom-Json` fuori da `Da-Json`; cinque chiamate a `Da-Json` nei punti attesi;
nessuna occorrenza di `&&`, operatori ternari o della stringa `token`.

**Verifica manuale ancora da fare, a cura di Alessio dopo la fusione** (richiede
PowerShell 5.1 reale): `stato` su repo vuoto deve stampare 0 in tutti i conteggi e
"Ultima esecuzione: nessuna."; `ferma` senza esecuzioni deve stampare "Nessuna
esecuzione in corso."

## Decisioni

Nessun ADR: la correzione è vincolata dall'issue allo snippet esatto indicato, non c'è
scelta di implementazione lasciata a questo agente.

## Non fatto

La verifica manuale di `stato`/`ferma` su un repo vuoto in PowerShell 5.1 reale: l'issue
la affida esplicitamente ad Alessio dopo la fusione (non è automatizzabile in questo
ambiente, che non ha PowerShell 5.1).

## Fatto in più

Nessuno: modifica minima, solo `template/scripts/pm.ps1` e questo file, come richiesto
dall'issue.
