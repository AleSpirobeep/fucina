#!/usr/bin/env bash
# fucina init — prepara un repo GitHub per il loop dell'agente sviluppatore.
#
# Uso, dalla radice del repo da preparare:
#   bash /percorso/della/fucina/init.sh
#
# Idempotente: rieseguirlo non duplica nulla e non sovrascrive file esistenti.

set -euo pipefail

FUCINA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$FUCINA_DIR/template"

rosso()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde()  { printf '\033[32m%s\033[0m\n' "$*"; }
giallo() { printf '\033[33m%s\033[0m\n' "$*"; }

# --- preflight ---------------------------------------------------------------

command -v git >/dev/null || { rosso "git non trovato."; exit 1; }
command -v gh  >/dev/null || { rosso "gh non trovato: https://cli.github.com"; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { rosso "Non sei dentro un repo git."; exit 1; }
gh auth status >/dev/null 2>&1 || { rosso "gh non autenticato: esegui 'gh auth login'."; exit 1; }
[ -d "$TEMPLATE" ] || { rosso "Cartella template non trovata in $FUCINA_DIR"; exit 1; }

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
UTENTE=$(gh api user -q .login)
echo "Repo:   $REPO"
echo "Utente: $UTENTE"
echo

# --- label -------------------------------------------------------------------

crea_label() {
  local nome="$1" colore="$2" descrizione="$3"
  if gh label list --limit 200 --json name -q '.[].name' | grep -qx "$nome"; then
    echo "  = $nome (già presente)"
  else
    gh label create "$nome" --color "$colore" --description "$descrizione" >/dev/null
    verde "  + $nome"
  fi
}

echo "Label della macchina a stati:"
crea_label "ready-for-dev"       "0E8A6E" "Pronta per l'agente sviluppatore"
crea_label "in-progress"         "C2A24A" "L'agente ci sta lavorando"
crea_label "needs-review"        "3B7DD8" "PR da revisionare"
crea_label "changes-requested"   "D07B2C" "Revisione: servono modifiche"
crea_label "needs-human"         "A93B2C" "Bloccata: serve una decisione umana"
crea_label "allow-test-changes"  "6E5AA8" "Autorizza la modifica dei percorsi protetti"
crea_label "in-coda"             "5A6E8C" "In coda: il PM la avvierà al suo turno"
crea_label "rapporto-pm"         "2C6E49" "Issue di rapporto del PM"
echo

# --- file --------------------------------------------------------------------

SALTATI=()
copia() {
  local sorgente="$1" destinazione="$2"
  if [ -e "$destinazione" ]; then
    SALTATI+=("$destinazione")
    echo "  = $destinazione (esiste già, non toccato)"
    return
  fi
  mkdir -p "$(dirname "$destinazione")"
  cp "$sorgente" "$destinazione"
  verde "  + $destinazione"
}

echo "File di configurazione:"
copia "$TEMPLATE/.fucina.yml"                        ".fucina.yml"
copia "$TEMPLATE/.github/workflows/dev-agent.yml"    ".github/workflows/dev-agent.yml"
copia "$TEMPLATE/.github/workflows/guard-tests.yml"  ".github/workflows/guard-tests.yml"
copia "$TEMPLATE/.github/CODEOWNERS"                 ".github/CODEOWNERS"
copia "$TEMPLATE/docs/decisions/0000-template.md"    "docs/decisions/0000-template.md"
copia "$TEMPLATE/CLAUDE.md"                          "CLAUDE.md"
copia "$FUCINA_DIR/plugin/skills/dev-agent/SKILL.md" ".claude/skills/dev-agent/SKILL.md"
copia "$TEMPLATE/.github/workflows/pm-agent.yml"     ".github/workflows/pm-agent.yml"
copia "$TEMPLATE/scripts/pm-coda.js"                 "scripts/pm-coda.js"
copia "$TEMPLATE/scripts/raccogli-stato.sh"          "scripts/raccogli-stato.sh"
copia "$TEMPLATE/scripts/pm.ps1"                     "scripts/pm.ps1"
copia "$FUCINA_DIR/plugin/skills/pm-agent/SKILL.md"  ".claude/skills/pm-agent/SKILL.md"
echo

# CODEOWNERS con l'utente giusto, solo se l'abbiamo appena creato
if [[ ! " ${SALTATI[*]:-} " =~ " .github/CODEOWNERS " ]]; then
  sed -i.bak "s/@AleSpirobeep/@$UTENTE/g" .github/CODEOWNERS && rm -f .github/CODEOWNERS.bak
  echo "CODEOWNERS impostato su @$UTENTE"
  echo
fi

if [ ${#SALTATI[@]} -gt 0 ]; then
  giallo "File non toccati perché già presenti:"
  printf '  %s\n' "${SALTATI[@]}"
  giallo "Se vuoi rigenerarli, cancellali e rilancia init."
  echo
fi

# --- passi manuali -----------------------------------------------------------

cat <<FINE
$(giallo "Restano cinque cose che init non può fare al posto tuo:")

  1. Installa la GitHub App di Claude su questo repo:
     https://github.com/apps/claude
     Senza, i push dell'agente useranno il GITHUB_TOKEN di default e la CI
     non partirà mai (REQ-016) — la PR resterà in attesa per sempre.

  2. Imposta il secret con il token della sottoscrizione:
     claude setup-token
     gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo $REPO
     Non incollare mai il token altrove.

  3. Crea un token personale (fine-grained) limitato a questo repo, con
     Contents / Issues / Pull requests in lettura e scrittura, e salvalo:
     gh secret set FUCINA_PAT --repo $REPO
     Serve perché le PR aperte col GITHUB_TOKEN non fanno partire i check.

  4. Proteggi il branch main. Richiede repo pubblico o piano Pro:
       gh api -X PUT repos/$REPO/branches/main/protection --input protection.json
     con required_status_checks su "test" e "guard", PR obbligatoria con
     zero approvazioni richieste (le PR aperte col tuo PAT risultano tue,
     e non puoi approvare le tue PR: il cancello è il merge manuale),
     enforce_admins false. Nessun auto-merge, nessun bypass per gli agenti.

  5. Il PM (workflow pm-agent.yml) è installato spento. Il login gh locale deve
     avere lo scope "workflow" per poterlo accendere: se manca, esegui
       gh auth refresh -s workflow
     Per accenderlo: scripts/pm.ps1 avvia (spegnerlo: scripts/pm.ps1 ferma).
     Le issue dei task vanno create con la label "in-coda" e un titolo
     "T001: ..." — è così che il PM le trova e le ordina.

$(verde "Poi controlla la configurazione in .fucina.yml: test_command è obbligatorio.")
FINE
