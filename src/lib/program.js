// Översätter Skolverkets programkoder (t.ex. "NA25", "BF11") till läsbara
// programnamn. Koderna inleds med en tvåställig bokstavsförkortning för det
// nationella programmet; siffersuffixet anger läroplansrevision (GY11/GY25).

const NATIONELLA_PROGRAM = {
  BF: { namn: 'Barn- och fritidsprogrammet', typ: 'Yrkesprogram' },
  BA: { namn: 'Bygg- och anläggningsprogrammet', typ: 'Yrkesprogram' },
  EE: { namn: 'El- och energiprogrammet', typ: 'Yrkesprogram' },
  EK: { namn: 'Ekonomiprogrammet', typ: 'Högskoleförberedande' },
  ES: { namn: 'Estetiska programmet', typ: 'Högskoleförberedande' },
  FT: { namn: 'Fordons- och transportprogrammet', typ: 'Yrkesprogram' },
  FS: { namn: 'Försäljnings- och serviceprogrammet', typ: 'Yrkesprogram' },
  HA: { namn: 'Handels- och administrationsprogrammet', typ: 'Yrkesprogram' },
  HT: { namn: 'Hotell- och turismprogrammet', typ: 'Yrkesprogram' },
  HV: { namn: 'Hantverksprogrammet', typ: 'Yrkesprogram' },
  IN: { namn: 'Industritekniska programmet', typ: 'Yrkesprogram' },
  NA: { namn: 'Naturvetenskapsprogrammet', typ: 'Högskoleförberedande' },
  NB: { namn: 'Naturbruksprogrammet', typ: 'Yrkesprogram' },
  RL: { namn: 'Restaurang- och livsmedelsprogrammet', typ: 'Yrkesprogram' },
  SA: { namn: 'Samhällsvetenskapsprogrammet', typ: 'Högskoleförberedande' },
  TE: { namn: 'Teknikprogrammet', typ: 'Högskoleförberedande' },
  VF: { namn: 'VVS- och fastighetsprogrammet', typ: 'Yrkesprogram' },
  VO: { namn: 'Vård- och omsorgsprogrammet', typ: 'Yrkesprogram' },
  IM: { namn: 'Introduktionsprogram', typ: 'Introduktionsprogram' },
  // Särskilda/riksrekryterande utbildningar (namn från Skolverkets Syllabus-API).
  FL: { namn: 'Flygteknikutbildningen', typ: 'Yrkesprogram' },
  FR: { namn: 'Frisör- och stylistprogrammet', typ: 'Yrkesprogram' },
  SJ: { namn: 'Sjöfartsutbildningen', typ: 'Yrkesprogram' },
  IB: { namn: 'International Baccalaureate', typ: 'Högskoleförberedande' },
};

export function beskrivProgram(programkod) {
  const prefix = (programkod || '').slice(0, 2).toUpperCase();
  const match = NATIONELLA_PROGRAM[prefix];
  if (match) {
    return { kod: programkod, namn: match.namn, typ: match.typ };
  }
  return { kod: programkod, namn: programkod, typ: 'Övrigt' };
}
