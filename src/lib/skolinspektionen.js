// Skolinspektionen publicerar inte sina beslut och rapporter via ett öppet API.
// Istället länkar vi till deras officiella söktjänst samt en förifylld
// webbsökning som snabbt hittar dokumenten för en specifik skola.

const SOK_BESLUT = 'https://www.skolinspektionen.se/beslut-rapporter/sok-beslut/';

export function skolinspektionenLankar(skola) {
  const fras = [skola.namn, skola.kommun].filter(Boolean).join(' ');
  return {
    // Officiell söktjänst där man väljer kommun/skola.
    sokverktyg: SOK_BESLUT,
    // Förifylld sökning avgränsad till skolinspektionen.se – hittar i praktiken
    // skolans beslut, tillsynsrapporter och skolenkäter direkt.
    forifylldSok: `https://www.google.com/search?q=${encodeURIComponent(
      `${fras} site:skolinspektionen.se`
    )}`,
  };
}
