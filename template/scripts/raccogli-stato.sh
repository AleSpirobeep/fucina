#!/usr/bin/env bash
# Raccoglie lo stato del repo (data-model.md §1) e lo scrive su stdout come JSON.
# Uso: raccogli-stato.sh <numero-issue-di-rapporto-o-vuoto>
# Richiede GH_TOKEN nell'ambiente. Usato da pm-agent.yml sia prima della decisione
# sia dopo un'azione deterministica, per rieseguire la decisione sullo stato aggiornato.
set -euo pipefail

# Il run di pm-agent.yml svegliato dall'evento pull_request è registrato da GitHub
# come check della PR stessa: va scartato dal calcolo di "check", altrimenti una PR
# con solo quel check in corso non risulterebbe mai "verde" (osservato sulla PR #68).
WORKFLOW_PM="pm-agent"

RAPPORTO="${1:-}"

ultimo_ha_marcatore() {
  local TIPO="$1" NUM="$2" BODY
  if [ "$TIPO" = "pr" ]; then
    BODY=$(gh pr view "$NUM" --json comments --jq '.comments[-1].body // ""')
  else
    BODY=$(gh issue view "$NUM" --json comments --jq '.comments[-1].body // ""')
  fi
  case "$BODY" in
    *'<!-- fucina:pm-umano -->'*) echo true ;;
    *) echo false ;;
  esac
}

PR_BASE=$(gh pr list --state open --json number,title,labels,body --jq \
  '[.[] | {numero: .number, titolo: .title, labels: [.labels[].name], corpo: (.body // "")}]')

PR_JSON="[]"
for NUM in $(echo "$PR_BASE" | jq -r '.[].numero'); do
  # Bucket assente (check non ancora registrati) è trattato come "in-corso": subito
  # dopo l'apertura i check impiegano qualche secondo a comparire, e non vanno
  # scambiati per "verde" (R8). Il check pm-agent stesso è scartato prima del
  # calcolo (vedi WORKFLOW_PM in testa al file).
  BUCKET=$( (gh pr checks "$NUM" --json bucket,workflow | jq -c --arg wf "$WORKFLOW_PM" \
    '[.[] | select(.workflow != $wf) | .bucket]') 2>/dev/null || echo '[]')
  if echo "$BUCKET" | jq -e 'length == 0' >/dev/null; then
    CHECK="in-corso"
  elif echo "$BUCKET" | jq -e 'any(.[]; . == "fail" or . == "cancel")' >/dev/null; then
    CHECK="rosso"
  elif echo "$BUCKET" | jq -e 'any(.[]; . == "pending")' >/dev/null; then
    CHECK="in-corso"
  else
    CHECK="verde"
  fi
  VISTO=$(ultimo_ha_marcatore pr "$NUM")
  ELEMENTO=$(echo "$PR_BASE" | jq -c --argjson n "$NUM" '.[] | select(.numero == $n)')
  ELEMENTO=$(echo "$ELEMENTO" | jq -c --arg check "$CHECK" --argjson visto "$VISTO" '. + {check: $check, ultimoCommentoPm: $visto}')
  PR_JSON=$(echo "$PR_JSON" | jq -c --argjson e "$ELEMENTO" '. + [$e]')
done

# --argjson è un flag di jq, non di gh: va passato a un jq separato dopo gh, mai a
# --jq (che si mangerebbe --argjson come propria espressione).
ISSUE_BASE=$(gh issue list --state open --json number,title,labels | jq -c \
  --argjson rapporto "${RAPPORTO:-null}" \
  '[.[] | select(.number != $rapporto) | {numero: .number, titolo: .title, labels: [.labels[].name]}]')

ISSUE_JSON="[]"
for NUM in $(echo "$ISSUE_BASE" | jq -r '.[].numero'); do
  VISTO=$(ultimo_ha_marcatore issue "$NUM")
  ELEMENTO=$(echo "$ISSUE_BASE" | jq -c --argjson n "$NUM" '.[] | select(.numero == $n)')
  ELEMENTO=$(echo "$ELEMENTO" | jq -c --argjson visto "$VISTO" '. + {ultimoCommentoPm: $visto}')
  ISSUE_JSON=$(echo "$ISSUE_JSON" | jq -c --argjson e "$ELEMENTO" '. + [$e]')
done

jq -n --argjson rapporto "${RAPPORTO:-null}" --argjson pr "$PR_JSON" --argjson issue "$ISSUE_JSON" \
  '{rapporto: $rapporto, pr: $pr, issue: $issue}'
