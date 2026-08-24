// Drei anonymisierte Testfälle. Inhalte stammen unverändert aus den bereitgestellten
// Beispielen. Als UNKLAR markierte Begriffe wurden bewusst nicht korrigiert oder gedeutet.
const CASES = [
  {
    id: "fall-1",
    title: "Fall 1",
    input:
      "Befund: Dolor, Lendenwirbelsäule links. Nach Gartenarbeit, Ausstrahlung dorsal links bis Kniegelenk.\n" +
      "Therapie: Vibro PPT, Neuralmassage, Chiro Elves mit Release, Schiebe, Gluträgerpunkte.",
    note:
      "LWS li. Dolor n. Gartenarbeit, Ausstrahlung dorsal li. b. Knie.\n" +
      "Th: Vibro PPT, Neuralmassage, [UNKLAR: Chiro Elves] m. Release, Schiebe, [UNKLAR: Gluträgerpunkte].",
    brief:
      "Letzter Stand: LWS-Beschwerden links, ausgelöst nach Gartenarbeit, Ausstrahlung dorsal bis Knie.\n" +
      "Behandlung: Vibro PPT, Neuralmassage, [UNKLAR: Chiro Elves] mit Release, Schiebe, [UNKLAR: Gluträgerpunkte].\n" +
      "Reaktion: nicht dokumentiert.\n" +
      "Offen: Verlauf der Ausstrahlung, Reaktion auf die Behandlung."
  },
  {
    id: "fall-2",
    title: "Fall 2",
    input:
      "Kopfschmerzen, Halswirbelsäule linksseitig Zug dorsal Richtung Schulter. Seit einer Woche schlimmer.\n" +
      "Therapie: Vibro PPT, CBRTOT, Star Tregerband, FDM Jones C1 links.",
    note:
      "Kopfschmerz, HWS li., Zug dorsal Richtung Schulter. Seit 1 Wo. schlimmer.\n" +
      "Th: Vibro PPT, [UNKLAR: CBRTOT], [UNKLAR: Star Tregerband], FDM Jones C1 li.",
    brief:
      "Letzter Stand: Kopfschmerzen mit HWS-Beteiligung links, Zuggefühl dorsal Richtung Schulter, seit 1 Woche verschlechtert.\n" +
      "Behandlung: Vibro PPT, [UNKLAR: CBRTOT], [UNKLAR: Star Tregerband], FDM Jones C1 links.\n" +
      "Reaktion: nicht dokumentiert.\n" +
      "Offen: Verlauf des Kopfschmerzes, Ansprechen auf FDM Jones C1."
  },
  {
    id: "fall-3",
    title: "Fall 3",
    input:
      "Kniegelenk links medial nach Gartenarbeit, akut seit zehn Tagen.\n" +
      "Skriben, Kniegelenk, Quad Faszien, Fuß komplett, Tibiofibulargelenk Mobilisation. Lendenwirbelsäule L3/L4 Chiro.",
    note:
      "Knie li. medial, akut seit 10 Tg., n. Gartenarbeit.\n" +
      "Th: [UNKLAR: Skriben] Kniegelenk, Quad Faszien, Fuß kompl., Tibiofibulargelenk Mobilisation. LWS L3/L4 Chiro.",
    brief:
      "Letzter Stand: akute mediale Knieschmerzen links seit 10 Tagen, ausgelöst nach Gartenarbeit.\n" +
      "Behandlung: [UNKLAR: Skriben] am Kniegelenk, Quad-Faszien, Fuß komplett, Mobilisation Tibiofibulargelenk, LWS L3/L4 Chiro.\n" +
      "Reaktion: nicht dokumentiert.\n" +
      "Offen: Verlauf des Knieschmerzes, Wirkung der LWS-Behandlung."
  }
];
