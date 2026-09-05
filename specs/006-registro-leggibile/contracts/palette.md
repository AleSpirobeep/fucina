# Contratto — la tavolozza Ardesia

I colori del Registro, uno per uno. È un contratto e non una descrizione: i valori qui sotto
sono **il** requisito (REQ-540), e il foglio di stile deve coincidere con questa tabella.

Scelta guardando quattro proposte — Attuale, Ardesia, Carta, Grafite — rese sulla struttura
nuova nei due temi. Ardesia: neutri blu-grigio, accento acciaio riservato all'azione, tre
colori semantici distinti dall'accento.

I **caratteri non cambiano**: `--font-titoli` Archivo, `--font-testo` Newsreader,
`--font-dati` JetBrains Mono, con i ripieghi di sistema già dichiarati. Restano fuori da
questo contratto.

## I sedici token

| token | chiaro | scuro | a cosa serve |
| ----- | ------ | ----- | ------------ |
| `--colore-sfondo` | `#eef1f4` | `#101418` | il fondo della pagina |
| `--colore-sfondo-rialzato` | `#ffffff` | `#181e25` | schede, righe, riquadri sopra il fondo |
| `--colore-testo` | `#141a21` | `#e6ecf2` | il testo normale |
| `--colore-testo-attenuato` | `#57626e` | `#98a5b3` | etichette, metadati, testo secondario |
| `--colore-bordo` | `#c6ced7` | `#2c353f` | separazioni e contorni |
| `--colore-accento` | `#2a5d9f` | `#7fb2f0` | **solo azioni**: pulsanti, link, comandi |
| `--colore-accento-scuro` | `#1e4676` | `#a9cbf7` | l'accento sotto il puntatore o alla pressione |
| `--colore-accento-testo` | `#ffffff` | `#0a1620` | il testo sopra l'accento |
| `--colore-ok` | `#1d6b52` | `#63c39b` | **nuovo**: ciò che è andato bene (check verdi, PM acceso) |
| `--colore-ambra` | `#8a5a00` | `#e8b45f` | ciò che attende |
| `--colore-ambra-sfondo` | `#fdefd2` | `#37280f` | il fondo di un avviso |
| `--colore-ambra-bordo` | `#d6a13c` | `#8a6520` | il contorno di un avviso |
| `--colore-ambra-testo` | `#3a2606` | `#fbeed4` | il testo dentro un avviso |
| `--colore-ambra-bottone-testo` | `#fff8ee` | `#2b1c00` | il testo sopra un pulsante ambra |
| `--colore-errore` | `#a02a2a` | `#e89393` | ciò che è rotto |
| `--colore-errore-sfondo` | `#fadfdf` | `#381a1a` | il fondo di un errore |

`--colore-ok` è l'unico nome nuovo rispetto a oggi: serve a REQ-543, che vuole il colore di
stato separato dall'accento. Finora il verde di «check verdi» era l'accento stesso, ed è una
delle ragioni per cui nella pagina attuale niente stacca.

## Le coppie che devono superare AA

REQ-541 si verifica su queste quattordici coppie, in entrambi i temi. La soglia è **4,5:1**
(WCAG 2.1, testo normale). Fra parentesi il rapporto misurato costruendo la tabella.

| coppia | chiaro | scuro |
| ------ | ------ | ----- |
| `testo` su `sfondo` | 15,44 | 15,54 |
| `testo` su `sfondo-rialzato` | 17,51 | 14,10 |
| `testo-attenuato` su `sfondo` | 5,48 | 7,37 |
| `testo-attenuato` su `sfondo-rialzato` | 6,22 | 6,69 |
| `accento` su `sfondo` | 5,85 | 8,39 |
| `accento-scuro` su `sfondo` | 8,45 | 11,07 |
| `accento-testo` su `accento` | 6,64 | 8,30 |
| `ambra` su `sfondo` | 5,23 | 9,80 |
| `ambra-testo` su `ambra-sfondo` | 12,64 | 12,41 |
| `ambra-bottone-testo` su `ambra` | 5,62 | 8,77 |
| `errore` su `sfondo` | 6,48 | 7,95 |
| `testo` su `errore-sfondo` | 13,91 | 13,26 |
| `ok` su `sfondo` | 5,65 | 8,64 |
| `ok` su `sfondo-rialzato` | 6,41 | 7,84 |

Il rapporto peggiore è **5,23**, con un margine di 0,73 sulla soglia. Nessuna coppia è al
limite: cambiare un valore di poco non fa cadere il requisito per caso, ma il test lo dice
subito se succede.

## Come si calcola

Luminanza relativa secondo WCAG 2.1: ogni canale `c` in `[0,1]` diventa
`c ≤ 0,03928 ? c/12,92 : ((c+0,055)/1,055)^2,4`, e la luminanza è
`0,2126·R + 0,7152·G + 0,0722·B`. Il rapporto fra due colori è
`(L_chiaro + 0,05) / (L_scuro + 0,05)`.

La funzione vive in `ui/lib.js` come funzione pura, con i suoi test: è ciò che rende REQ-541
verificabile dalla CI invece che a occhio.

## Le regole d'uso

Sono ciò che rende la tavolozza una scelta e non un elenco. REQ-543 le verifica.

1. **L'accento è solo delle azioni.** Pulsanti, link, il comando del PM. Non indica mai uno
   stato: un elemento colorato d'accento è qualcosa su cui si può premere.
2. **Lo stato lo portano i tre semantici.** `ok`, `ambra`, `errore`. Non compaiono mai come
   fondo di un pulsante d'azione.
3. **Il fondo rialzato è ciò che separa gli oggetti**, non un bordo su ogni cosa: bordo,
   riempimento e ombra dicono tutti «oggetto a sé», e spesi tutti insieme su ogni blocco
   appiattiscono la gerarchia invece di costruirla.
