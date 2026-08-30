---
status: accepted
date: 2026-08-30
decision-makers: [Alessio]
---
# Autenticazione in Actions con il token OAuth della sottoscrizione Claude

## Contesto e problema
Si era assunto che GitHub Actions richiedesse una API key Anthropic, con costo a consumo
fuori dall'abbonamento già attivo. **L'assunzione era errata.**

## Opzioni considerate
- API key Anthropic a consumo
- Token OAuth della sottoscrizione (`claude setup-token`)
- GitHub Copilot Pro ($10/mese, agente nativo su issue)
- Endpoint compatibili Anthropic di terze parti: Kimi (~$6,90/mese), GLM Lite ($18/mese)
- DeepSeek V4 a consumo
- Sottoscrizione Google AI Plus già posseduta

## Decisione
Token OAuth della sottoscrizione Claude. `claude setup-token` genera un token da mettere
come secret e passare a `anthropics/claude-code-action` nell'input `claude_code_oauth_token`.
I run consumano la quota della sottoscrizione, non credito API.

**Google AI Plus è escluso**: le sottoscrizioni consumer Google non danno accesso API
("Google AI plan benefits apply only within the Google AI Studio web interface"), non
includono Jules né Antigravity (dall'AI Pro in su), il login Google gratuito di Gemini CLI
è stato chiuso il 18/6/2026 e l'app GitHub di Code Assist consumer il 17/7/2026. I 4,99
euro al mese non comprano nulla di utilizzabile qui. Le API key del piano gratuito Gemini
sono inoltre usate per l'addestramento: inadatte a un repo privato.

## Conseguenze
Costo marginale zero durante la fase di taratura.

Tre limiti da tenere presenti:
1. Il token OAuth è ammesso per le applicazioni native Anthropic. Dal 20/2/2026 è
   esplicitamente vietato usarlo per pilotare strumenti di terze parti (OpenCode, Cline,
   harness Agent SDK propri). `claude-code-action` è ammesso; un harness proprio no.
2. I limiti dichiarati "presuppongono un uso ordinario e individuale". Un loop autonomo
   continuo non lo è. Il piano Pro (10-40 prompt per 5 ore, condivisi con l'uso interattivo)
   non regge un loop; per uso regolare serve almeno Max 5x.
3. Il 13/5/2026 Anthropic aveva annunciato che dal 15/6/2026 l'uso in GitHub Actions
   sarebbe uscito dal pool della sottoscrizione. **La modifica è stata sospesa il giorno
   stesso, non ritirata.** È il rischio principale di questa scelta.

## Piano di ripiego
Se i limiti stringono o la modifica sospesa rientra in vigore, in ordine:
DeepSeek V4 a consumo (endpoint compatibile Anthropic, nessuna ambiguità contrattuale
sull'uso in CI, verosimilmente pochi euro al mese ai volumi previsti), oppure Copilot Pro
a 10 dollari al mese. Per rendere il cambio indolore, endpoint e secret restano
configurabili in `.fucina.yml` — vedi debito D-02.
