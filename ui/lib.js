export function versione() {
  return "0.1.0";
}

const FORMATO_REPO = /^[^\s/]+\/[^\s/]+$/;

// Righe vuote (anche solo spazi) sono ignorate, non sono un errore di formato.
export function parseElencoRepo(testo) {
  return (testo ?? "")
    .split("\n")
    .map((riga) => riga.trim())
    .filter((riga) => riga.length > 0);
}

export function validaRepo(riga) {
  return FORMATO_REPO.test(riga);
}

export function validaElencoRepo(testo) {
  const righe = parseElencoRepo(testo);
  const nonValide = righe.filter((riga) => !validaRepo(riga));
  if (nonValide.length > 0) {
    return { ok: false, repos: [], nonValide };
  }
  return { ok: true, repos: righe, nonValide: [] };
}

// Vera solo se c'è un token e l'elenco repo è testuale e valido: usata per decidere
// se mostrare la dashboard o il modulo di configurazione.
export function configurazioneValida({ repoTesto, token }) {
  if (!token) {
    return false;
  }
  return validaElencoRepo(repoTesto ?? "").ok;
}
