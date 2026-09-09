// Drei anonymisierte Testfälle. Inhalte stammen unverändert aus den bereitgestellten
// Beispielen. Note und Brief werden live von compressTranscript() erzeugt — die
// Referenzfälle zeigen exakt denselben Output wie die Live-Funktion.
const CASES = [
  {
    id: "fall-1",
    title: "Fall 1",
    input:
      "Befund: Dolor, Lendenwirbelsäule links. Nach Gartenarbeit, Ausstrahlung dorsal links bis Kniegelenk.\n" +
      "Therapie: Vibro PPT, Neuralmassage, Chiro Elves mit Release, Schiebe, Gluträgerpunkte."
  },
  {
    id: "fall-2",
    title: "Fall 2",
    input:
      "Kopfschmerzen, Halswirbelsäule linksseitig Zug dorsal Richtung Schulter. Seit einer Woche schlimmer.\n" +
      "Therapie: Vibro PPT, CBRTOT, Star Tregerband, FDM Jones C1 links."
  },
  {
    id: "fall-3",
    title: "Fall 3",
    input:
      "Kniegelenk links medial nach Gartenarbeit, akut seit zehn Tagen.\n" +
      "Skriben, Kniegelenk, Quad Faszien, Fuß komplett, Tibiofibulargelenk Mobilisation. Lendenwirbelsäule L3/L4 Chiro."
  }
];
