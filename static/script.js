/* =========================================================
   ORIENTCI — SCRIPT.JS (v3)
   Données enrichies à partir des documents officiels de la Direction de
   l'Orientation et des Bourses (DOB — Ministère de l'Enseignement Supérieur
   et de la Recherche Scientifique, édition 2025) et de la brochure de
   concours INP-HB, session BAC 2025.

   1) Données (universités publiques, grandes écoles, autres écoles, bourses)
   2) Rendu des cartes (accordéon, image/monogramme, bloc concours pour INP-HB)
   3) Filtres par ville + recherche texte
   4) Rendu des bourses et de la liste "autres écoles"
   5) Suivi de trafic (envoyé au backend Python, silencieux si absent)
   6) Menu mobile + statistiques du hero
   ========================================================= */

/* ---------- 1) DONNÉES ---------- */

const SCHOOLS = [
  {
    name: "Université Félix Houphouët-Boigny (UFHB)",
    city: "Abidjan",
    website: "https://w.univ-fhb.edu.ci/",
    image: "https://w.univ-fhb.edu.ci/wp-content/uploads/2026/06/DSC_4843-1024x683.jpg",
    monogram: "UFHB",
    hue: "linear-gradient(135deg,#C24A05,#7A2E06)",
    filieres: [
      { nom: "Droit et Sciences Politiques", serie: "A, B, C, D, G1", criteres: "Philo 12, Franç 12, Hist-Géo 12", debouches: "Avocat, notaire, magistrat, juriste d'entreprise, administrations publique et privée, organismes internationaux, ONG, diplomatie", age: "23 ans max" },
      { nom: "Sciences Économiques et Gestion", serie: "A1, B, C, D, G2", criteres: "Maths A1/B 14, C 12, D 12, G2 15 — Franç 11, Angl 11", debouches: "Analyste financier, contrôleur de gestion, chargé de clientèle, manager, administration publique et privée (PME/PMI), organismes internationaux", age: "23 ans max" },
      { nom: "Langues, Littératures et Civilisations", serie: "Toutes séries", criteres: "Ex. Anglais : Angl 12, Franç 10, LV2 09 (barème variable selon la langue choisie)", debouches: "Enseignement, recherche, traduction et interprétariat, attaché commercial, tourisme, communication", age: "23 ans max" },
      { nom: "Criminologie", serie: "A, B, C, D, G1", criteres: "Philo 12, Franç 10, Hist-Géo 10", debouches: "Personnel des services de sécurité (police, gendarmerie), toxicologue, victimologue, éducateur spécialisé, médiation pénale, gestion d'établissements pénitentiaires", age: "23 ans max" },
      { nom: "Biosciences", serie: "C, D", criteres: "Svt 11, Angl 10, Math 12, Phys 11", debouches: "Biologiste, chercheur, laboratoires, industries pharmaceutiques et agroalimentaires, enseignement", age: "22 ans max" },
      { nom: "Sciences de la Terre et des Ressources Minières (STRM)", serie: "C, D, E", criteres: "Maths C 11, D 12, E 11 — Phys C/D 12 — Svt C/D 12", debouches: "Géologue, ingénieur des mines, expert en exploration, recherche", age: "23 ans max" },
      { nom: "Médecine", serie: "C, D", criteres: "Math 11, Phys 11, Svt 11", debouches: "Médecin, biochimiste, biologiste. Accès via le tronc commun de l'École Préparatoire aux Sciences de la Santé (EPSS), à l'Université Nangui Abrogoua", age: "22 ans max" },
      { nom: "Pharmacie", serie: "C, D", criteres: "Math 11, Phys 11, Svt 13", debouches: "Pharmacien, industries pharmaceutiques et cosmétiques. Accès via l'EPSS (UNA)", age: "22 ans max" },
      { nom: "Odontostomatologie", serie: "C, D", criteres: "Math 11, Phys 11, Svt 12", debouches: "Chirurgien-dentiste. Accès via l'EPSS (UNA)", age: "22 ans max" }
    ]
  },
  {
    name: "Université Nangui Abrogoua (UNA)",
    city: "Abidjan",
    website: "https://www.univ-na.ci/",
    image: null,
    monogram: "UNA",
    hue: "linear-gradient(135deg,#14603F,#0B3323)",
    filieres: [
      { nom: "Sciences et Gestion de l'Environnement", serie: "C, D", criteres: "—", debouches: "Expert en environnement, gestionnaire des déchets, spécialiste en eau", age: "—" },
      { nom: "Sciences et Technologies des Aliments", serie: "C, D", criteres: "—", debouches: "Ingénieur agroalimentaire, contrôleur qualité, responsable production", age: "—" },
      { nom: "Sciences Fondamentales Appliquées", serie: "C, D, E", criteres: "Math C/E 12, D 14 — Phys 12 — Franç 10, LV1 10", debouches: "Organisation et gestion d'entreprises, informatique, interfaces homme-machine, cryptographie, automobile, topographie, acoustique, astronomie, électronique", age: "22 ans max" },
      { nom: "Écologie et Environnement (DUT)", serie: "C, D", criteres: "LV1 12, Math 12, Phys 12, Svt 12", debouches: "Écologie, gestion des déchets, assainissement, hydraulique et ressources en eau, instituts de recherche, collectivités locales, aquaculture, développement durable", age: "23 ans max" },
      { nom: "Tronc commun EPSS — Sciences de la Santé", serie: "C, D", criteres: "Math 11, Phys 11, Svt 11", debouches: "Concours d'entrée commun donnant accès aux filières Médecine, Pharmacie et Odontostomatologie, dispensées à l'UFHB", age: "22 ans max" }
    ]
  },
  {
    name: "Université Alassane Ouattara",
    city: "Bouaké",
    website: "https://univ-ao.edu.ci/",
    image: "https://i0.wp.com/univ-ao.edu.ci/wp-content/uploads/2025/11/uao_DJI_0285.jpg?ssl=1",
    monogram: "UAO",
    hue: "linear-gradient(135deg,#E85D0A,#A83C06)",
    filieres: [
      { nom: "Communication et Médias", serie: "A, B, D", criteres: "Franç 12, Angl 10, Philo 12, Hist-Géo 10", debouches: "Journaliste, community manager, chargé de communication", age: "23 ans max" },
      { nom: "Sciences Économiques", serie: "A1, B, C, D, G2", criteres: "Maths A1/B 14, C 12, D 12, G2 15 — Franç 11, Angl 11", debouches: "Économiste, chef de projet, spécialiste en microfinance", age: "23 ans max" },
      { nom: "Sciences Juridiques", serie: "A, B, C, D, G1", criteres: "Philo 12, Franç 12, Hist-Géo 12", debouches: "Magistrat, avocat, juriste, administrations publique et privée", age: "23 ans max" }
    ]
  },
  {
    name: "Université Jean Lorougnon Guédé (UJLoG)",
    city: "Daloa",
    website: "https://ujlog.edu.ci/",
    image: null,
    monogram: "UJLoG",
    hue: "linear-gradient(135deg,#3E6B2E,#1F3D16)",
    filieres: [
      { nom: "Agroforesterie", serie: "C, D", criteres: "Angl 10, Math 11, Phys 11, Svt 11", debouches: "Ingénieur agronome, gestionnaire de parcs, expert en agroforesterie", age: "23 ans max" },
      { nom: "Environnement", serie: "C, D", criteres: "Angl 10, Math 11, Phys 11, Svt 11", debouches: "Ressources en eau, biodiversité, gestion des déchets, projets de développement durable, collectivités locales", age: "23 ans max" },
      { nom: "Sciences Sociales et Humaines", serie: "A, B", criteres: "Philo 10, Franç 10, Hist-Géo 10", debouches: "Sociologue, chercheur, administration publique, développement communautaire", age: "23 ans max" },
      { nom: "Sciences Économiques et de Gestion", serie: "A1, B, C, D, G2", criteres: "Maths A1/B 14, C 12, D 12, G2 15 — Franç 11, Angl 11", debouches: "Économiste, gestionnaire, chef de projet, microfinance", age: "23 ans max" }
    ]
  },
  {
    name: "Université Péléforo Gon Coulibaly",
    city: "Korhogo",
    website: "https://univ-pgc.edu.ci/",
    image: null,
    monogram: "UPGC",
    hue: "linear-gradient(135deg,#8A5A1F,#4A2F0F)",
    filieres: [
      { nom: "Sciences Sociales", serie: "A, B", criteres: "Philo 10, Franç 10, Hist-Géo 10", debouches: "Sociologue, chef de projet développement communautaire", age: "23 ans max" },
      { nom: "Sciences Biologiques", serie: "C, D", criteres: "Svt 12, Math 11, Phys 11", debouches: "Biologiste, chercheur, laboratoires, agro-industries", age: "23 ans max" },
      { nom: "Médecine 🆕", serie: "C, D", criteres: "Math 11, Phys 11, Svt 11", debouches: "Médecin — filière ouverte à la rentrée académique 2025-2026, première promotion en cours de formation", age: "22 ans max" }
    ]
  },
  {
    name: "Université de Man",
    city: "Man",
    website: "https://univ-man.edu.ci/",
    image: null,
    monogram: "U-MAN",
    hue: "linear-gradient(135deg,#2E5C6B,#16303A)",
    filieres: [
      { nom: "Sciences Géologiques et Minières (Géologie, Mines et Réservoirs, Géophysique)", serie: "C, D, E", criteres: "Math 12, Phys 12, Angl 10, Svt 12, Franç 11", debouches: "Géologue (production, pétrolier, exploitant minier), ingénieur des mines, hydraulicien, chef d'équipe mines, minéralurgiste, recherche", age: "23 ans max" },
      { nom: "Sciences et Technologie (Mathématiques-Informatique, Physique, Chimie)", serie: "C, D, E", criteres: "C : Math 12, Phys 12 — D : Math 14, Phys 14 — E : Math 12, Phys 12, Angl 12", debouches: "Administration publique/privée, enseignement, recherche, informatique, métrologie, chercheur en physique ou en chimie, industries pharmaceutique et agroalimentaire", age: "23 ans max" },
      { nom: "Ingénierie Agronomique, Forestière et Environnementale", serie: "C, D", criteres: "Math 12, Phys 12, Angl 10, Svt 12, Franç 11", debouches: "Ingénieur agronome, forestier, environnementaliste, gestion des ressources naturelles", age: "22 ans max" },
      { nom: "Classes Préparatoires (Mines et Énergie, Métallurgie, Mécanique-Électronique-Maintenance)", serie: "C, D, E", criteres: "Math 12, Phys 12, Angl 12, Franç 10", debouches: "Prépare aux concours des écoles d'ingénieurs de l'Université de Man (mines, métallurgie, mécanique/électronique)", age: "22 ans max" }
    ]
  },
  {
    name: "Université Polytechnique de San-Pedro",
    city: "San-Pedro",
    website: "https://usp.edu.ci/",
    image: "https://usp.edu.ci/media/imagedaccueil/Collation_001.jpg",
    monogram: "USP",
    hue: "linear-gradient(135deg,#0F6B5C,#0A362E)",
    filieres: [
      { nom: "Sciences et Technologies de la Mer (SDM)", serie: "C, D, E, B, F1, F4, F7", criteres: "C/D/E : Phys-Chim 12, Svt 12, Math 12, Franç 11, Angl 10, Hist-Géo 12 — B : Économie 12 — F1/F4/F7 : Phys-Chim 12", debouches: "Ingénieur océanographe, technicien en environnement, hydrobiologiste, consultant en environnement", age: "22 ans max" },
      { nom: "Agriculture, Ressources Halieutiques et Agro-Industries (ARHAI)", serie: "F7, C, D", criteres: "F7 : Phys 12, Math 12, Chimie 12, Franç 12, Angl 12 — C/D : Phys 12, Math 12, Svt 12, Franç 12, Angl 12", debouches: "Ingénieur nutritionniste, ingénieur recherche-développement, responsable aquaculture/mariculture, horticulteur", age: "22 ans max" },
      { nom: "Logistique, Tourisme, Hôtellerie, Restauration (LTHR)", serie: "A, C, D, E, G, H", criteres: "A : Franç 10, Hist-Géo 10, Angl 12, Math 10 — Autres séries : Franç 10, Hist-Géo 10, Angl 10, Math 10", debouches: "Agent commercial en transport, agent de manutention, agent aéroportuaire, déclarant en douane, gestionnaire de stock, majordome", age: "22 ans max" }
    ]
  },
  {
    name: "Université Virtuelle de Côte d'Ivoire (UVCI)",
    city: "En ligne",
    website: "https://uvci.edu.ci/",
    image: null,
    monogram: "UVCI",
    hue: "linear-gradient(135deg,#5B3E8A,#2E1F4A)",
    note: "Formation entièrement à distance. Coût : 30 000 FCFA/an (étudiants ivoiriens) · 100 000 FCFA/an (UEMOA) · 300 000 FCFA/an (hors UEMOA).",
    filieres: [
      { nom: "Développement d'Applications et e-Services (DAS)", serie: "C, D, E, F1, F2, F3", criteres: "Math C 11, D 12, E/F 11 — Phys C 10, D 11, E/F 11 — Franç/Angl 10", debouches: "Intégrateur de solutions web, architecte application mobile et web, développeur d'application, entrepreneur numérique", age: "23 ans max" },
      { nom: "Bases de Données (BD)", serie: "C, D, E, F1, F2, F3", criteres: "Math C 11, D 12, E/F 11 — Phys C 10, D 11, E/F 11 — Franç/Angl 10", debouches: "Administrateur de bases de données, architecte Cloud, business intelligence et big data, entrepreneur numérique", age: "23 ans max" },
      { nom: "Réseaux et Sécurité Informatique (RSI)", serie: "C, D, E, F1, F2, F3", criteres: "Math C 11, D 12, E/F 11 — Phys C 11, D 12, E/F 11 — Franç/Angl 10", debouches: "Administrateur réseaux et sécurité informatique, gestionnaire des systèmes d'information, entrepreneur numérique", age: "23 ans max" },
      { nom: "Multimédia et Arts Numériques (MMX)", serie: "C, D, E, F1, F2, F3", criteres: "Math C 11, D 12, E/F 11 — Phys C 11, D 12, E/F 11 — Franç/Angl 10", debouches: "Directeur artistique, designer multimédia, infographe, chef de projet multimédia", age: "23 ans max" },
      { nom: "Communication Digitale (COM)", serie: "A1, A2, C, D, E, G1", criteres: "Barème variable selon série — Franç/Angl 10 à 12", debouches: "Chargé de communication web, gestionnaire de médias sociaux, community manager, rédacteur web, responsable e-réputation", age: "23 ans max" },
      { nom: "e-Commerce et Marketing Digital (CMD)", serie: "A1, A2, B, C, D, E, G2", criteres: "Barème variable selon série — Franç/Angl 10 à 12", debouches: "Consultant web analytique, web marketeur, acheteur d'espace publicitaire web, traffic manager", age: "23 ans max" },
      { nom: "e-Administration et Transformation Digitale (ATD)", serie: "A1, A2, B, C, D, E, G1, G2", criteres: "Math 10, Angl 10, Hist-Géo 11, Franç 12", debouches: "Expert en innovation des services publics, responsable portail numérique, chef de projet dématérialisation", age: "23 ans max" }
    ]
  },
  {
    name: "INP-HB",
    city: "Yamoussoukro",
    website: "https://inphb.edu.ci/",
    image: "https://inphb.edu.ci/wp-content/uploads/2026/05/346351-scaled.jpg",
    monogram: "INP-HB",
    hue: "linear-gradient(135deg,#0B4A8F,#082C54)",
    concours: {
      titre: "Concours d'entrée — Session 2025 (nouveaux bacheliers/BT)",
      etapes: [
        { phase: "Préinscriptions en ligne", date: "02 → 22 juillet 2025" },
        { phase: "Dépôt des dossiers physiques", date: "11 → 26 juillet 2025" },
        { phase: "Résultats d'admissibilité (étude de dossier)", date: "05 août 2025" },
        { phase: "Composition écrite (Anglais, Culture scientifique, Culture générale — 3h30)", date: "11 août 2025" },
        { phase: "Résultats définitifs et affectation", date: "19 août 2025" }
      ],
      frais: "15 000 FCFA par concours + 3 000 FCFA de frais de dossier + 1 000 FCFA de frais de photo (paiement TresorMoney)",
      lien: "https://www.inphb.ci"
    },
    filieres: [
      { nom: "ESCAE — Commerce et Administration des Entreprises (GAE, FCA)", serie: "A1, A2, B, C, D, G2, BT Compta", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Gestion commerciale, marketing, communication, ressources humaines, supply chain, comptabilité et contrôle/audit, banque-finance-assurance", age: "24 ans max" },
      { nom: "ESI — Sciences et Technologies de l'Information et du Génie Industriel (STIC, STGI)", serie: "C, D, E, F1, F3, BT", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Électronique, informatique, télécoms, électrotechnique, automatismes industriels, mécatronique, maintenance biomédicale", age: "24 ans max" },
      { nom: "ESTP — Génie Civil (GC)", serie: "C, D, E, F4, BT", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Bâtiment et urbanisme, route et transport, hydraulique et environnement, géomètre topographe", age: "24 ans max" },
      { nom: "ESMG — Mines et Géologie (MG)", serie: "C, D, E, BT", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Mines, eau et environnement minier", age: "24 ans max" },
      { nom: "ESCPE — Pétrole et Chimie Industrielle (PME, CGP)", serie: "C, D, E, BT", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Industrie pétrolière, maintenance des équipements, chimie industrielle", age: "24 ans max" },
      { nom: "ESAS — Techniciens Supérieurs en Aéronautique (TSAERO)", serie: "C, D, E, F1, F2, F3", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Maintenance aéronautique, techniciens supérieurs en aéronautique", age: "24 ans max" },
      { nom: "ESA — Techniciens Supérieurs en Agronomie (TSA)", serie: "C, D, F7, BT", criteres: "Concours DTS (cycle court, 3 ans)", debouches: "Aménagement forestier, technologie alimentaire, analyses agricoles/biologiques, irrigation, cultures pérennes et maraîchères, gestion des organisations agricoles", age: "24 ans max" },
      { nom: "EPGE — Classes Préparatoires aux Grandes Écoles (BCPST, ECG, PCSI, MPSI, MP2I, LSA)", serie: "A1, A2, B, C, D, E", criteres: "Concours cycle long (2 ans de prépa)", debouches: "Prépare aux concours des grandes écoles d'ingénieurs de l'INP-HB (ESA, ESCAE, ESI, ESMG, ESTP, ESCPE) et d'écoles internationales (Polytechnique Paris, Mines ParisTech, ESTP Paris, etc.)", age: "22 ans max" }
    ]
  },
  {
    name: "ESATIC",
    city: "Abidjan",
    website: "https://esatic.ci/",
    image: null,
    monogram: "ESATIC",
    hue: "linear-gradient(135deg,#0E7A6E,#073E38)",
    filieres: [
      { nom: "Développement d'Applications et Systèmes d'Information (DASI)", serie: "C, D, E", criteres: "Voie de concours", debouches: "Développeur d'applications (web, mobile), testeur et intégrateur de solutions, administrateur de bases de données", age: "22 ans max" },
      { nom: "Réseaux et Télécommunications (RTEL)", serie: "C, D, E", criteres: "Voie de concours", debouches: "Technicien en réseaux et systèmes de télécommunications, assistant architecte réseaux, technicien en sécurité réseaux", age: "22 ans max" },
      { nom: "Technologies du Web et Images Numériques (TWIN)", serie: "C, D, E", criteres: "Voie de concours", debouches: "Développeur d'applications mobiles, développeur de solutions web et multimédia, web designer, community manager", age: "22 ans max" }
    ]
  },
  {
    name: "HETEC",
    city: "Abidjan",
    website: "https://www.groupehetec.net/",
    image: null,
    monogram: "HETEC",
    hue: "linear-gradient(135deg,#A8380F,#5E1E08)",
    filieres: [
      { nom: "Informatique et Technologies", serie: "C, D", criteres: "—", debouches: "Chef ou responsable d'équipe de production informatique, administrateur réseaux, administrateur de site web, analyste-programmeur", age: "—" },
      { nom: "Commerce et Management", serie: "A, B, C, D", criteres: "—", debouches: "Attaché commercial, promoteur des ventes, chef de secteur, assistant GRH, chargé de communication", age: "—" }
    ]
  },
  {
    name: "AGITEL-Formation",
    city: "Abidjan",
    website: "https://www.agitel-formation.net/site/",
    image: null,
    monogram: "AGITEL",
    hue: "linear-gradient(135deg,#1F5C7A,#0E2F3F)",
    filieres: [
      { nom: "Ingénierie Informatique", serie: "C, D", criteres: "—", debouches: "Chef ou responsable d'équipe de production informatique, administrateur réseaux, administrateur de site web, analyste-programmeur, architecte système", age: "—" }
    ]
  },
  {
    name: "AIBS",
    city: "Abidjan",
    website: "https://www.atlantique-ibs.net/",
    image: null,
    monogram: "AIBS",
    hue: "linear-gradient(135deg,#6B4A14,#3A280B)",
    filieres: [
      { nom: "Finance et Comptabilité", serie: "A, B, C, D", criteres: "—", debouches: "Responsable administratif et financier, chef comptable, contrôleur de gestion, chef de service approvisionnement, administrateur des ventes", age: "—" }
    ]
  },
  {
    name: "ISTC Polytechnique",
    city: "Abidjan",
    website: "https://www.istcpolytechnique.ci",
    image: null,
    monogram: "ISTC",
    hue: "linear-gradient(135deg,#7A2E5C,#3E1730)",
    filieres: [
      { nom: "École de Journalisme (EJ)", serie: "A, B, C, D", criteres: "Voie de test", debouches: "Rédacteur, journaliste reporter, présentateur du journal télévisé, journaliste radio, reporter d'images (JRI)", age: "—" },
      { nom: "École de Production Audiovisuelle (EPA)", serie: "A, B, C, D", criteres: "Voie de test", debouches: "Animateur de programmes TV/radio, assistant de réalisation, monteur, éclairagiste, script", age: "—" },
      { nom: "École des Arts et Images Numériques (EAIN)", serie: "A, B, C, D, E", criteres: "Voie de test", debouches: "Maquettiste PAO, animateur 2D, designer, web designer, développeur d'interactivité", age: "—" },
      { nom: "École Publicité Marketing (EPM)", serie: "A, B, C, D", criteres: "Voie de test", debouches: "Chargé de communication digitale, acheteur d'espaces publicitaires, community manager, assistant trafic manager", age: "—" },
      { nom: "École des Télécommunications et Technologies de l'Audiovisuel (ETTA)", serie: "A, B, C, D, E", criteres: "Voie de test", debouches: "Ingénieur d'étude, ingénieur systèmes, technicien de transmission ou de diffusion, ingénieur du son et de l'image", age: "—" }
    ]
  }
];

// Écoles régionales ou spécialisées accessibles aux bacheliers ivoiriens par
// concours communs, référencées par la DOB mais présentées ici sous forme
// de liste compacte (site officiel donné directement par le Ministère).
const OTHER_SCHOOLS = [
  { name: "ENSEA", location: "Abidjan, Côte d'Ivoire", note: "École Nationale Supérieure de Statistique et d'Économie Appliquée", website: "http://www.ensea.ed.ci" },
  { name: "INSAAC", location: "Abidjan, Côte d'Ivoire", note: "Institut National Supérieur des Arts et de l'Action Culturelle", website: "https://www.insaac.edu.ci" },
  { name: "INSFS", location: "Abidjan, Côte d'Ivoire", note: "Institut National de Formation Sociale", website: "http://www.infs-ci.org" },
  { name: "ECG", location: "Abidjan, Côte d'Ivoire", note: "École de Commerce et de Gestion (tutelle : Ministère du Commerce)", website: "http://www.ecg.ci" },
  { name: "CME", location: "Bingerville, Côte d'Ivoire", note: "Centre des Métiers de l'Électricité — formations orientées production d'énergie", website: "http://www.cme.ci" },
  { name: "EISMV", location: "Dakar, Sénégal", note: "École Inter-États des Sciences et Médecine Vétérinaires — école régionale", website: "http://www.eismv.org" },
  { name: "EAMAU", location: "Lomé, Togo", note: "École Africaine et Mauricienne d'Architecture et d'Urbanisme — école régionale", website: "http://www.eamau.org" },
  { name: "2IE", location: "Ouagadougou, Burkina Faso", note: "Institut International d'Ingénierie de l'Eau et de l'Environnement — école régionale", website: "http://www.2ie-edu.org" },
  { name: "EAMAC", location: "Niamey, Niger", note: "École Africaine de la Météorologie et de l'Aviation Civile — école régionale", website: "http://www.eamac.ne" }
];

// Chaque bourse a une description, des conditions et un montant.
const SCHOLARSHIPS = [
  {
    flag: "🇨🇮",
    name: "Bourse du Gouvernement Ivoirien",
    org: "Ministère de l'Enseignement Supérieur",
    desc: "Programme national de bourses d'études pour les étudiants ivoiriens, couvrant les frais de scolarité et une allocation mensuelle.",
    conditions: [
      "Être de nationalité ivoirienne",
      "Avoir un baccalauréat avec mention (Assez Bien ou Bien)",
      "S'inscrire dans une université ou grande école publique"
    ],
    amount: "Scolarité couverte + 50 000 - 100 000 FCFA/mois",
    link: "https://www.enseignement.gouv.ci/"
  },
  {
    flag: "🌍",
    name: "Bourse de la CEDEAO",
    org: "Communauté Économique des États de l'Afrique de l'Ouest",
    desc: "Programme régional destiné aux étudiants ressortissants des États membres.",
    conditions: [
      "Être ressortissant d'un pays membre de la CEDEAO",
      "Baccalauréat avec mention",
      "Être inscrit dans une université d'un pays membre"
    ],
    amount: "Scolarité couverte + 500 - 1 000 USD/mois",
    link: "https://www.ecowas.int/"
  },
  {
    flag: "🇫🇷",
    name: "Bourse d'Excellence Eiffel",
    org: "Gouvernement français",
    desc: "Programme d'excellence pour les étudiants étrangers, couvrant les frais de scolarité et une allocation.",
    conditions: [
      "Niveau Licence ou Master",
      "Dossier académique exceptionnel",
      "Projet professionnel solide"
    ],
    amount: "Scolarité couverte + 1 000 - 1 500 €/mois",
    link: "https://www.campusfrance.org/fr/eiffel"
  },
  {
    flag: "🇨🇦",
    name: "Bourse du Gouvernement Canadien",
    org: "Gouvernement du Canada",
    desc: "Programme de bourses pour étudiants internationaux (études, recherche).",
    conditions: [
      "Être inscrit dans une université canadienne",
      "Résultats académiques excellents",
      "Projet de recherche ou d'études"
    ],
    amount: "Montant variable selon le programme",
    link: "https://www.educanada.ca/"
  },
  {
    flag: "🇪🇺",
    name: "Erasmus+",
    org: "Union européenne",
    desc: "Programme d'échange et de mobilité pour étudiants.",
    conditions: [
      "Être inscrit dans une université partenaire",
      "Avoir un bon niveau académique",
      "Motivation pour étudier à l'étranger"
    ],
    amount: "Bourse de mobilité : 500 - 800 €/mois",
    link: "https://erasmus-plus.ec.europa.eu/"
  },
  {
    flag: "🇨🇳",
    name: "Bourse du Gouvernement Chinois (CSC)",
    org: "China Scholarship Council",
    desc: "Programme complet pour études en Chine (Langue, Licence, Master, Doctorat).",
    conditions: [
      "Être de nationalité étrangère",
      "Avoir un bon dossier académique",
      "Satisfaire aux conditions d'âge (18-35 ans)"
    ],
    amount: "Scolarité couverte + 1 500 - 3 000 ¥/mois",
    link: "https://www.campuschina.org/"
  },
  {
    flag: "🇫🇷",
    name: "Bourse AUF",
    org: "Agence Universitaire de la Francophonie",
    desc: "Programme pour étudiants francophones.",
    conditions: [
      "Être ressortissant d'un pays francophone",
      "Baccalauréat ou diplôme équivalent",
      "Inscription dans une université membre de l'AUF"
    ],
    amount: "Montant variable selon le programme",
    link: "https://www.auf.org/"
  }
];

/* ---------- 5) SUIVI DE TRAFIC ---------- */
// Envoie un évènement au backend Python (voir app.py). Échoue silencieusement
// si le backend n'est pas lancé (par ex. en ouvrant simplement index.html),
// afin que le site reste utilisable en pur statique.
function trackEvent(type, label, value) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label: label || "", value: value || "", path: window.location.pathname })
    }).catch(() => {});
  } catch (e) { /* backend absent : on ignore */ }
}

/* ---------- 2) UNIVERSITÉS : rendu des cartes (accordéon) ---------- */

const schoolsGrid = document.getElementById("schools-grid");
const filtersContainer = document.getElementById("city-filters");
const searchInput = document.getElementById("school-search");

let activeCity = "Toutes";
let searchTerm = "";

function externalLinkIcon() {
  return `<svg viewBox="0 0 12 12" fill="none"><path d="M4 8L8 4M8 4H4.8M8 4V7.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderConcoursBlock(concours) {
  if (!concours) return "";
  const etapesHTML = concours.etapes.map(e => `
    <li><span class="concours-phase">${e.phase}</span><span class="concours-date">${e.date}</span></li>
  `).join("");
  return `
    <div class="concours-box">
      <p class="concours-title">📅 ${concours.titre}</p>
      <ul class="concours-steps">${etapesHTML}</ul>
      <p class="concours-frais"><strong>Frais :</strong> ${concours.frais}</p>
      <a href="${concours.lien}" target="_blank" rel="noopener" class="btn btn-primary concours-btn">Se préinscrire sur ${concours.lien.replace("https://","")}</a>
    </div>
  `;
}

function renderSchoolCard(school, index) {
  const mediaHTML = school.image
    ? `<div class="school-media" style="background-image:url('${school.image}')">
         <span class="school-city-badge">${school.city}</span>
       </div>`
    : `<div class="school-media is-monogram" style="background:${school.hue}">
         <span class="school-city-badge">${school.city}</span>
         <span class="school-monogram">${school.monogram}</span>
       </div>`;

  const filieresHTML = school.filieres.map(f => `
    <div class="filiere">
      <p class="filiere-name">${f.nom}</p>
      <div class="filiere-meta">
        <span><strong>Série :</strong><span class="badge-serie">Bac ${f.serie}</span>${f.age && f.age !== "—" ? `<span class="badge-age">${f.age}</span>` : ""}</span>
        ${f.criteres && f.criteres !== "—" ? `<span><strong>Critères d'accès :</strong> ${f.criteres}</span>` : ""}
        <span><strong>Débouchés :</strong> ${f.debouches}</span>
      </div>
    </div>
  `).join("");

  const count = school.filieres.length;
  const countLabel = count > 1 ? `${count} filières` : `${count} filière`;
  const noteHTML = school.note ? `<p class="school-note">${school.note}</p>` : "";

  return `
    <article class="school-card" data-index="${index}">
      ${mediaHTML}
      <div class="school-body">
        <h3 class="school-name">${school.name}</h3>
        <div class="school-summary">
          <span class="school-count">${countLabel}</span>
          <span>recensée${count > 1 ? "s" : ""} sur OrientCI</span>
        </div>
        ${noteHTML}
        <div class="school-actions">
          <button class="toggle-filieres" data-toggle="${index}" aria-expanded="false">
            Voir le détail <span class="chev"></span>
          </button>
          <a class="official-link" href="${school.website}" target="_blank" rel="noopener" data-official="${school.name}">
            Site officiel ${externalLinkIcon()}
          </a>
        </div>
      </div>
      <div class="filieres-panel" id="panel-${index}">
        ${renderConcoursBlock(school.concours)}
        <div class="filieres-list">${filieresHTML}</div>
      </div>
    </article>
  `;
}

function matchesSearch(school, term) {
  if (!term) return true;
  const haystack = [
    school.name,
    ...school.filieres.map(f => `${f.nom} ${f.debouches}`)
  ].join(" ").toLowerCase();
  return haystack.includes(term);
}

function renderSchools() {
  const term = searchTerm.trim().toLowerCase();
  const filtered = SCHOOLS
    .map((s, i) => ({ school: s, index: i }))
    .filter(({ school }) => (activeCity === "Toutes" || school.city === activeCity) && matchesSearch(school, term));

  schoolsGrid.innerHTML = filtered.length
    ? filtered.map(({ school, index }) => renderSchoolCard(school, index)).join("")
    : `<p class="empty-state">Aucun établissement ne correspond à ta recherche pour le moment.</p>`;

  attachCardListeners();
}

function attachCardListeners() {
  schoolsGrid.querySelectorAll(".toggle-filieres").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".school-card");
      const isOpen = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        const name = card.querySelector(".school-name").textContent;
        trackEvent("school_open", name);
      }
    });
  });
  schoolsGrid.querySelectorAll(".official-link").forEach(link => {
    link.addEventListener("click", () => trackEvent("official_link_click", link.dataset.official));
  });
}

function renderFilters() {
  const cities = ["Toutes", ...new Set(SCHOOLS.map(s => s.city))];

  filtersContainer.innerHTML = cities.map(city => `
    <button class="filter-btn${city === activeCity ? " is-active" : ""}" data-city="${city}">
      ${city}
    </button>
  `).join("");

  filtersContainer.addEventListener("click", (event) => {
    const btn = event.target.closest(".filter-btn");
    if (!btn) return;

    activeCity = btn.dataset.city;
    filtersContainer.querySelectorAll(".filter-btn").forEach(b => {
      b.classList.toggle("is-active", b.dataset.city === activeCity);
    });
    trackEvent("city_filter", activeCity);
    renderSchools();
  });
}

let searchDebounce;
searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderSchools();
  clearTimeout(searchDebounce);
  if (searchTerm.trim().length > 2) {
    searchDebounce = setTimeout(() => trackEvent("search", searchTerm.trim()), 700);
  }
});

/* ---------- 4a) AUTRES ÉCOLES (liste compacte) ---------- */

function renderOtherSchools() {
  const container = document.getElementById("other-schools-list");
  if (!container) return;
  container.innerHTML = OTHER_SCHOOLS.map(s => `
    <li class="other-school">
      <div>
        <span class="other-school-name">${s.name}</span>
        <span class="other-school-location">${s.location}</span>
        <p class="other-school-note">${s.note}</p>
      </div>
      <a href="${s.website}" target="_blank" rel="noopener" class="official-link">Site officiel ${externalLinkIcon()}</a>
    </li>
  `).join("");
}

/* ---------- 3) BOURSES : rendu ---------- */

const scholarshipsGrid = document.getElementById("scholarships-grid");

function renderScholarshipCard(s, index) {
  const conditionsHTML = s.conditions.map(c => `<li>${c}</li>`).join("");
  return `
    <article class="scholarship-card" data-index="${index}">
      <div class="scholarship-head">
        <span class="scholarship-flag" aria-hidden="true">${s.flag}</span>
        <div class="scholarship-head-text">
          <h3 class="scholarship-name">${s.name}</h3>
          <p class="scholarship-org">${s.org}</p>
        </div>
      </div>
      <p class="scholarship-desc">${s.desc}</p>
      <p class="scholarship-amount">${s.amount}</p>

      <div class="scholarship-actions">
        <button class="toggle-filieres" data-toggle="${index}" aria-expanded="false">
          Voir les conditions <span class="chev"></span>
        </button>
      </div>

      <div class="scholarship-panel" id="scholarship-panel-${index}">
        <p class="scholarship-block-title">Conditions</p>
        <ul class="scholarship-conditions">${conditionsHTML}</ul>
        <a href="${s.link}" class="btn btn-secondary scholarship-btn" target="_blank" rel="noopener" data-scholarship="${s.name}">Voir le site officiel →</a>
      </div>
    </article>
  `;
}

function renderScholarships() {
  scholarshipsGrid.innerHTML = SCHOLARSHIPS.map(renderScholarshipCard).join("");

  scholarshipsGrid.querySelectorAll(".toggle-filieres").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".scholarship-card");
      const isOpen = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        const name = card.querySelector(".scholarship-name").textContent;
        trackEvent("scholarship_open", name);
      }
    });
  });
  scholarshipsGrid.querySelectorAll(".scholarship-btn").forEach(link => {
    link.addEventListener("click", () => trackEvent("scholarship_click", link.dataset.scholarship));
  });
}

/* ---------- 6) STATISTIQUES DU HERO ---------- */

function renderStats() {
  const totalFilieres = SCHOOLS.reduce((sum, s) => sum + s.filieres.length, 0);
  document.getElementById("stat-schools").textContent = SCHOOLS.length + OTHER_SCHOOLS.length;
  document.getElementById("stat-filieres").textContent = totalFilieres;
  document.getElementById("stat-scholarships").textContent = SCHOLARSHIPS.length;
}

/* ---------- MENU MOBILE ---------- */

const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    mainNav.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- INITIALISATION ---------- */

renderFilters();
renderSchools();
renderOtherSchools();
renderScholarships();
renderStats();
trackEvent("pageview", document.title);
