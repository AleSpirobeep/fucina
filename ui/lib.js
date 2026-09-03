export function versione() {
  return "0.1.0";
}

export function parseElencoRepo(testo) {
  return (testo || "")
    .split("\n")
    .map((riga) => riga.trim())
    .filter((riga) => riga.length > 0);
}

export function validaRepo(repo) {
  return /^[\w.-]+\/[\w.-]+$/.test(repo);
}

export function validaElencoRepo(testo) {
  const repos = parseElencoRepo(testo);
  if (repos.length === 0) {
    return { ok: false, repos: [], errore: "Inserisci almeno un repo." };
  }

  const nonValidi = repos.filter((repo) => !validaRepo(repo));
  if (nonValidi.length > 0) {
    return {
      ok: false,
      repos: [],
      errore: `Formato non valido (usa proprietario/nome): ${nonValidi.join(", ")}`,
    };
  }

  return { ok: true, repos, errore: null };
}

export function configurazioneValida({ repoTesto, token }) {
  return validaElencoRepo(repoTesto).ok && typeof token === "string" && token.trim().length > 0;
}
