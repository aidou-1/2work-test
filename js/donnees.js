/* ============ LANGUE ============
   T(texte français, variables) renvoie le texte dans la langue de l'appli (réglage « langue », fr par défaut). */
function stocker(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }   // le stockage peut être refusé (navigation privée) : jamais bloquant
const propre = t => String(t).replace(/[<>]/g, "");
/* Icônes d'interface : un seul jeu au trait (même dessin que la barre de navigation), à la place des emojis */
const ICONES = { reprise: '<path d="M5 4v16l9-8z"/><path d="M17 5v14M21 5v14"/>', agenda: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', lecture: '<path d="M7 4v16l13-8z"/>', eclair: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  bulle: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', cloche: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>', flamme: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3.500 2-4.500 0 2 1 3 2 3 0-4 1-6.500 2-9.500z"/>',
  cible: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', pile: '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M22 11v3M7 11v3M11 11v3"/>', haltere: '<path d="M3 9v6M7 6v12M17 6v12M21 9v6M7 12h10"/>',
  course: '<circle cx="14" cy="5" r="2"/><path d="m7 21 3-6 3 2v4M10 15l1-5 4 2 3 1M11 10 8 9l-2 3"/>', loupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', envoi: '<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 5-5"/>' };
const ico = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;   // un nom saisi ou restauré ne peut jamais injecter de balise dans la page
let LANGUE = "fr";
try { LANGUE = localStorage.getItem("langue") || "fr"; } catch (e) {}
document.documentElement.lang = LANGUE;
const UI_EN = {"Récupération après l’effort, étirements, respiration": "Post-workout recovery, stretching, breathing", "Étirements par zone": "Stretching by area", "10 séances réglables, une par zone du corps": "10 adjustable sessions, one per body area", "Récupération terminée": "Recovery complete", "Bois un grand verre d’eau et prends soin de ton sommeil ce soir.": "Drink a big glass of water and look after your sleep tonight.", "Entraînement": "Training", "Crée ta séance, salle par objectif, sports, Tabata": "Create your workout, gym by goal, sports, Tabata", "15 sports : renfo, cardio et outils propres à chacun, et la boxe complète": "15 sports: strength, cardio and tools for each one, plus complete boxing", "Crée et enregistre ta séance, suis un objectif en salle, prépare-toi pour ton sport ou lance un Tabata.": "Create and save your workout, follow a gym goal, train for your sport or start a Tabata.", "Crée et enregistre ta séance, suis un objectif en salle, renforce-toi pour ton sport ou lance un Tabata.": "Create and save your workout, follow a gym goal, get stronger for your sport or start a Tabata.", "Renfo par sport": "Strength by sport", "15 sports, au poids du corps ou avec matériel": "15 sports, bodyweight or with equipment", "Par objectif : force, prise de muscle, excentrique, isométrie…": "By goal: strength, muscle growth, eccentric, isometric…", "Mes séances enregistrées": "My saved workouts", "Tes séances créées ou modifiées, prêtes à lancer": "Your created or edited workouts, ready to go", "Planifier ma séance": "Plan my workout", "Choisis tes exercices, règle durées et repos, enregistre ta séance": "Pick your exercises, set times and rest, save your workout", "Séances libres": "Free sessions", "Thème": "Theme", "Clair, sombre, ou automatique selon le téléphone": "Light, dark, or automatic based on your phone", "Clair": "Light", "Sombre": "Dark", "Auto": "Auto", "Coach vocal": "Voice coach", "Encouragements pendant l’effort : mi-parcours, 10 dernières secondes": "Encouragement during effort: halfway, last 10 seconds", "Favori": "Favourite", "Enregistre cette séance pour la relancer en un appui": "Save this workout to start it again in one tap", "☆ Enregistrer": "☆ Save", "Mes séances favorites": "My favourite workouts", "Tes séances enregistrées, prêtes à lancer": "Your saved workouts, ready to go", "Programmes": "Programmes", "4 semaines guidées": "4 guided weeks", "jour d’affilée": "day in a row", "Mes progrès · trophées": "My progress · trophies", "Mes progrès": "My progress", "Muscle du jour": "Muscle of the day", "Où il s’attache": "Where it attaches", "Comment il fonctionne": "How it works", "À quoi il sert": "What it’s for", "Pour le travailler": "To train it", "Le savais-tu ?": "Did you know?", "Sources : Gray’s Anatomy (42e éd., 2020), Kapandji – Anatomie fonctionnelle, et les études citées. Un nouveau muscle chaque jour à minuit.": "Sources: Gray’s Anatomy (42nd ed., 2020), Kapandji – The Physiology of the Joints, and the studies cited. A new muscle every day at midnight.", "Défi du jour": "Daily challenge", "Défi réussi !": "Challenge complete!", "Reviens demain pour un nouveau défi !": "Come back tomorrow for a new challenge!", "Série : {n} jours d’affilée. Reviens demain pour un nouveau défi !": "Streak: {n} days in a row. Come back tomorrow for a new challenge!", "Le défi change chaque jour à minuit. Termine-le pour allonger ta série !": "The challenge changes every day at midnight. Finish it to grow your streak!", "15 sports : course, foot, basket, tennis, natation, Pilates…": "15 sports: running, football, basketball, tennis, swimming, Pilates…", "Retour au sport après blessure": "Back to sport after injury", "Petites séances par zone, inspirées d’études scientifiques": "Short sessions by body area, based on scientific studies", "Choisis la zone à renforcer. Commence seulement avec l’accord de ton médecin ou kiné, et sans douleur.": "Pick the area to strengthen. Only start once your doctor or physio agrees, and without pain.", "Pas un avis médical : reprends seulement après accord de ton médecin ou kiné. Aucun exercice ne doit faire mal : en cas de douleur, arrête.": "Not medical advice: only resume once your doctor or physio agrees. No exercise should hurt: if you feel pain, stop.", "14 sports : course, foot, basket, tennis, natation, escalade…": "14 sports: running, football, basketball, tennis, swimming, climbing…", "Rechercher un exercice": "Search an exercise", "Aucun exercice ne correspond à « {q} ».": "No exercise matches “{q}”.", "✕ Menu": "✕ Menu", "made by Aidou": "made by Aidou", "Touche l’écran pour continuer": "Tap the screen to continue", "On s’y met ?": "Ready to go?", "Échauffe-toi, entraîne-toi, puis récupère.": "Warm up, train, then recover.", "Échauffements": "Warm-ups", "Boxe, course, handball, cyclisme, yoga, surf, ski": "Boxing, running, handball, cycling, yoga, surf, ski", "Planifier une séance": "Plan a workout", "Renfo par sport, salle de musculation, Tabata": "Strength by sport, gym, Tabata", "Retour au calme": "Cool-down", "Cohérence cardiaque, étirements": "Coherent breathing, stretching", "← Retour": "← Back", "Choisis ton activité, on s’occupe du reste.": "Pick your activity, we handle the rest.", "Exercices": "Exercises", "Touche × pour retirer, maintiens un exercice pour le déplacer": "Tap × to remove, press and hold an exercise to move it", "Par défaut": "Default", "Ajouter": "Add", "Fermer": "Close", "Conseillés pour cette routine": "Recommended for this routine", "Autres exercices": "Other exercises", "Durée par exercice": "Time per exercise", "Appliquée à tous les exercices": "Applied to every exercise", "Voix": "Voice", "Activée": "On", "Coupée": "Off", "Activé": "On", "Coupé": "Off", "Activés": "On", "Coupés": "Off", "Activées": "On", "Coupées": "Off", "Sons de l’interface": "Interface sounds", "Petits sons quand tu touches les menus, les boutons et les options": "Short sounds when you tap menus, buttons and options", "Vibrations": "Vibrations", "Écouter ma musique en même temps": "Listen to my music at the same time", "Les bips se mélangent à ta musique (Spotify, Deezer…) sans la couper. Sur iPhone, enlève le mode silencieux pour les entendre.": "Beeps mix with your music (Spotify, Deezer…) without stopping it. On iPhone, turn off silent mode to hear them.", "Conseils de posture": "Form cues", "La voix explique comment se placer et bien faire chaque exercice": "The voice explains how to set up and perform each exercise properly", "Volume des sons": "Sound volume", "Bips de la séance et sons de l’interface": "Workout beeps and interface sounds", "Force des vibrations": "Vibration strength", "Plus forte = vibrations plus longues": "Stronger = longer vibrations", "Légère": "Light", "Normale": "Normal", "Forte": "Strong", "Au toucher, à chaque changement d’exercice, au repos et pendant les 3 dernières secondes": "On tap, at each exercise change, at rest and during the last 3 seconds", "Repos entre exercices": "Rest between exercises", "Pause avant l’exercice suivant": "Break before the next exercise", "Répétitions par cycle": "Reps per round", "Nombre de fois l’enchaînement effort + repos": "Number of work + rest intervals", "Nombre de cycles": "Number of rounds", "Enchaînements répétés, avec une récupération entre chaque": "Repeated sequences, with recovery in between", "Récupération entre cycles": "Recovery between rounds", "Pause avant le cycle suivant": "Break before the next round", "Commencer": "Start", "Précédent": "Previous", "Pause": "Pause", "Reprendre": "Resume", "Passer": "Skip", "Prépare-toi": "Get ready", "Pose ton téléphone": "Put your phone down", "Ça commence dans quelques secondes.": "Starting in a few seconds.", "Commencer maintenant": "Start now", "Réglages": "Settings", "Ils s’appliquent à toutes les séances et restent enregistrés sur ce téléphone.": "They apply to every workout and are saved on this phone.", "Annonce les exercices, les séries et la respiration": "Announces exercises, sets and breathing", "Langue de l’application": "App language", "Menus, textes et descriptions des exercices": "Menus, texts and exercise descriptions", "Langue de la voix": "Voice language", "Langue des annonces pendant les séances": "Language of the announcements during workouts", "Personne qui parle": "Speaker", "Voix disponibles sur ce téléphone": "Voices available on this phone", "Écouter": "Listen", "Écran toujours allumé": "Keep screen on", "L’écran ne se met pas en veille pendant une séance": "The screen won’t sleep during a workout", "Sur Android, d’autres voix s’installent dans les paramètres du téléphone : Accessibilité ou Langues, puis « Synthèse vocale » (moteur Google). Sur iPhone : Réglages → Accessibilité → Contenu énoncé → Voix.": "On Android, more voices can be installed in the phone settings: Accessibility or Languages, then “Text-to-speech” (Google engine). On iPhone: Settings → Accessibility → Spoken Content → Voices.", "Échauffement terminé": "Warm-up complete", "Tu es prêt pour ta séance.": "You’re ready for your workout.", "Retour à l’accueil": "Back to home", "Quitter et retourner au menu d’accueil": "Quit and go back to the main menu", "Logo 2 Work": "2 Work logo", "Diminuer la durée de 5 secondes": "Decrease time by 5 seconds", "Augmenter la durée de 5 secondes": "Increase time by 5 seconds", "Diminuer le repos de 5 secondes": "Decrease rest by 5 seconds", "Augmenter le repos de 5 secondes": "Increase rest by 5 seconds", "Une répétition de moins": "One less rep", "Une répétition de plus": "One more rep", "Un cycle de moins": "One less round", "Un cycle de plus": "One more round", "Diminuer la récupération de 5 secondes": "Decrease recovery by 5 seconds", "Augmenter la récupération de 5 secondes": "Increase recovery by 5 seconds", "Tous les exercices conseillés sont déjà dans ta routine.": "All recommended exercises are already in your routine.", "Aucun autre exercice disponible.": "No other exercise available.", "Aucun exercice. Ajoutes-en au moins un pour commencer.": "No exercise. Add at least one to start.", "exercices": "exercises", "Quitter ?": "Quit?", "Construire une séance": "Build a workout", "Renfo par sport, au poids du corps ou avec matériel": "Strength by sport, bodyweight or with equipment", "Salle de musculation": "Gym", "Leg day, chest day, back day, push, pull… sur machines et poids libres": "Leg day, chest day, back day, push, pull… on machines and free weights", "Tabata": "Tabata", "Minuteur : effort, repos, répétitions et cycles réglables": "Timer: work, rest, reps and rounds adjustable", "Renfo du corps": "Body strength", "Haut du corps, bas du corps ou tout le corps": "Upper body, lower body or full body", "Haut du corps": "Upper body", "Bas du corps": "Lower body", "Haut et bas du corps": "Upper and lower body", "Séries par exercice": "Sets per exercise", "Chaque exercice est répété, avec un repos entre les séries": "Each exercise is repeated, with rest between sets", "Annonce quand inspirer, retenir et expirer : idéal allongé, sans regarder l’écran": "Tells you when to inhale, hold and exhale: ideal lying down, without looking at the screen", "Annonce le nom de chaque exercice": "Announces each exercise name", "(en français)": "(in French)", "(en anglais)": "(in English)", "Temps d’exercice": "Work time", "Durée de la séance": "Session length", "Durée de chaque étirement": "Time per stretch", "Durée de l’exercice": "Exercise time", "Durée de chaque effort": "Length of each effort", "En minutes, les exercices s’adaptent": "In minutes, exercises adjust", "Temps de repos": "Rest time", "Pause entre deux répétitions": "Break between two reps", "Échauffement {t}": "Warm-up · {t}", "{n} cycle": "{n} round", "{n} cycles": "{n} rounds", "{n} exercice": "{n} exercise", "{n} exercices": "{n} exercises", "{n} exercices × {s} série": "{n} exercises × {s} set", "{n} exercices × {s} séries": "{n} exercises × {s} sets", "environ {m} min": "about {m} min", "Séance de bien-être, pas un avis médical : arrête-toi en cas de vertige.": "Wellness session, not medical advice: stop if you feel dizzy.", "Retirer {n}": "Remove {n}", "Ajouter {n}": "Add {n}", "Exercice {a} sur {b} · série {c} sur {d}": "Exercise {a} of {b} · set {c} of {d}", "Exercice {a} sur {b}": "Exercise {a} of {b}", "EXERCICE": "WORK", "REPOS": "REST", "RÉCUPÉRATION": "RECOVERY", "Cycle {a} terminé · prochain : cycle {b} sur {c}": "Round {a} done · next: round {b} of {c}", "Cycle {a} sur {b} · Répétition {c} sur {d}": "Round {a} of {b} · Rep {c} of {d}", "Exercice {a} sur {b} · {t}": "Exercise {a} of {b} · {t}", "Cycle {a} sur {b}": "Cycle {a} of {b}", "Repos · prochaine : série {a} sur {b}": "Rest · next: set {a} of {b}", "Repos · prochain : exercice {a} sur {b}": "Rest · next: exercise {a} of {b}", "Repos": "Rest", "Prochaine série : ": "Next set: ", "Prochain exercice : ": "Next exercise: ", "Étirements terminés": "Stretching complete", "Tes muscles te remercient. Pense à t’hydrater.": "Your muscles thank you. Remember to drink water.", "Respiration terminée": "Breathing complete", "Reste un instant, les yeux fermés, avant de reprendre.": "Stay a moment with your eyes closed before getting up.", "Séance terminée": "Workout complete", "Bien joué ! Pense à t’hydrater et à t’étirer.": "Well done! Remember to drink water and stretch.", "Choisis ton sport, on s’occupe du reste.": "Pick your sport, we handle the rest.", "Séances typiques, jouées en séries. Durée, repos et nombre de séries réglables.": "Typical gym workouts, done in sets. Time, rest and number of sets are adjustable.", "Construis ta séance, va à la salle ou lance un Tabata.": "Build your workout, hit the gym or start a Tabata.", "Choisis ton sport.": "Pick your sport.", "Choisis ton échauffement.": "Pick your warm-up.", "Choisis ta zone : haut, bas ou tout le corps.": "Pick your area: upper, lower or full body.", "Poids du corps": "Bodyweight", "Sans matériel · {n} exercices": "No equipment · {n} exercises", "Avec matériel": "With equipment", "Kettlebell, haltères, barre Z, banc, poulie, élastique… · {n} exercices": "Kettlebell, dumbbells, EZ bar, bench, pulley, band… · {n} exercises", "Choisis ton type de séance.": "Pick your workout type.", "Cohérence cardiaque ou étirements.": "Coherent breathing or stretching.", "Cohérence cardiaque": "Coherent breathing", "Respiration guidée : express, classique, récupération": "Guided breathing: express, classic, recovery", "Choisis ta séance de respiration.": "Pick your breathing session.", "Étirements": "Stretching", "10 séances, une par zone du corps": "10 sessions, one per body area", "Choisis la zone du corps à étirer.": "Pick the body area to stretch.", "Automatique (recommandée)": "Automatic (recommended)", "{n} voix françaises sur ce téléphone": "{n} French voices on this phone", "{n} voix anglaises sur ce téléphone": "{n} English voices on this phone", "Aucune voix de cette langue trouvée sur ce téléphone": "No voice in this language found on this phone", "1 · Départ": "1 · Start", "2 · Position finale": "2 · End position", "Position à tenir": "Position to hold", "Vue de profil": "Side view", "Vue de face": "Front view", "Vue de dessus": "Top view", "Vue de dos": "Back view", "Menu": "Menu"};
function T(fr, v) {
  let t = LANGUE === "en" && UI_EN[fr] !== undefined ? UI_EN[fr] : fr;
  if (v) for (const k in v) t = t.split("{" + k + "}").join(v[k]);
  return t;
}
/* ============ DONNÉES ============
   Les exercices sont séparés des routines : un exercice peut servir dans plusieurs routines.
   Pour ajouter une vidéo plus tard : remplace "video": null par "video": "videos/inchworm.mp4"  */
const EXERCICES = {
  inchworm:   { nom: "Inchworm", duree: 20, video: null,
    description: "Debout, descends les mains au sol, marche jusqu’en position de pompe, puis reviens.",
    muscles: "Ischio-jambiers, mollets, épaules, gainage" },
  wgs:        { nom: "World’s greatest stretch", duree: 20, video: null,
    description: "Grande fente, main au sol côté jambe avant, rotation du buste bras vers le plafond. Reste du même côté : l’autre côté suit juste après.",
    muscles: "Fléchisseurs de hanche, adducteurs, ischios, rotation thoracique" },
  openbook:   { nom: "Open book actif", duree: 20, video: null,
    description: "Allongé sur le côté, genoux fléchis, ouvre le bras du dessus en suivant la main du regard, puis reviens. Change de côté à mi-temps.",
    muscles: "Colonne thoracique, pectoraux, épaules" },
  thread:     { nom: "Thread the needle", duree: 20, video: null,
    description: "À quatre pattes, passe un bras sous le buste en rotation, puis ouvre-le vers le plafond. Alterne.",
    muscles: "Épaules, haut du dos, rotation thoracique" },
  wipers:     { nom: "Windshield wipers", duree: 20, video: null,
    description: "Assis ou allongé, genoux fléchis, balance les jambes de gauche à droite de façon contrôlée.",
    muscles: "Rotateurs de hanche, obliques, bas du dos" },
  catcow:     { nom: "Cat-cow actif", duree: 20, video: null,
    description: "À quatre pattes, alterne dos rond et dos creux de façon fluide.",
    muscles: "Colonne entière, lombaires, abdos, trapèzes" },
  cossack:    { nom: "Cossack squat", duree: 20, video: null,
    description: "Grande position écartée, descends sur une jambe en gardant l’autre tendue. Alterne.",
    muscles: "Adducteurs, hanches, quadriceps, chevilles" },
  shadow:     { nom: "Shadow boxing avec pivots", duree: 20, video: null,
    description: "Enchaîne jab-croisé avec rotation du pied arrière.",
    muscles: "Épaules, tronc, jambes (gestes spécifiques)" },
  dogpedal:   { nom: "Downward dog avec pédalage", duree: 20, video: null,
    description: "En chien tête en bas, plie une jambe puis l’autre en alternant.",
    muscles: "Mollets, tendon d’Achille, ischio-jambiers" },
  scorpion:   { nom: "Scorpion", duree: 20, video: null,
    description: "Allongé sur le ventre, envoie un pied vers la main opposée en tournant le bassin. Alterne.",
    muscles: "Quadriceps, fléchisseurs de hanche, lombaires, abdos" },
  hip9090:    { nom: "90/90 hip switches", duree: 20, video: null,
    description: "Assis, genoux à 90°, bascule les deux genoux d’un côté à l’autre, sans les mains si possible.",
    muscles: "Rotateurs de hanche, fessiers" },
  rdl:        { nom: "Soulevé de terre roumain unipodal", duree: 20, video: null,
    description: "Sur une jambe, buste penché, jambe libre tendue derrière. Reste sur la même jambe : l’autre jambe suit juste après.",
    muscles: "Ischio-jambiers, fessiers, stabilité de cheville" },
  fente:      { nom: "Fente arrière bras en l’air", duree: 20, video: null,
    description: "Fente arrière, bras tendus au-dessus de la tête. Alterne les jambes.",
    muscles: "Quadriceps, psoas, fessiers" },
  pont:       { nom: "Pont fessier dynamique", duree: 20, video: null,
    description: "Allongé sur le dos, monte et descends le bassin en contractant les fessiers en haut.",
    muscles: "Fessiers, ischio-jambiers, lombaires" },
  askip:      { nom: "A-skip", duree: 20, video: null,
    description: "Skipping avec montée du genou et frappe de pied active au sol, toujours avec la même jambe : l’autre jambe suit juste après.",
    muscles: "Mollets, fléchisseurs de hanche, coordination" }
};

Object.assign(EXERCICES, {
  armcircles: { nom: "Cercles de bras", duree: 20, video: null,
    description: "Debout, trace de grands cercles avec les bras vers l’avant, puis vers l’arrière à mi-temps.",
    muscles: "Épaules, pectoraux, haut du dos" },
  armcross: { nom: "Bras croisés et ouverts", duree: 20, video: null,
    description: "Debout, ouvre grand les bras vers l’arrière, puis croise-les devant toi en les serrant, en rythme.",
    muscles: "Pectoraux, deltoïdes postérieurs, trapèzes" },
  scap: { nom: "Pompes scapulaires", duree: 20, video: null,
    description: "En planche bras tendus, rapproche puis écarte les omoplates sans plier les coudes.",
    muscles: "Omoplates, épaules, gainage" },
  twist: { nom: "Rotations du tronc debout", duree: 20, video: null,
    description: "Debout jambes écartées, tourne le buste d’un côté puis de l’autre en laissant les bras suivre le mouvement.",
    muscles: "Obliques, colonne thoracique, hanches" },
  tspin: { nom: "Planche avec rotation en T", duree: 20, video: null,
    description: "En planche, ouvre un bras vers le plafond en tournant le buste, puis reviens. Alterne les côtés.",
    muscles: "Épaules, obliques, rotation thoracique, gainage" },
  slips: { nom: "Esquives de boxe", duree: 20, video: null,
    description: "Genoux fléchis, garde levée, décale la tête à gauche puis à droite en pliant les jambes et en tournant le buste.",
    muscles: "Obliques, quadriceps, mobilité du tronc" },
  footwork: { nom: "Jeu de jambes léger", duree: 20, video: null,
    description: "Petits sauts sur la pointe des pieds, appuis rapides avant-arrière et sur les côtés, comme un boxeur.",
    muscles: "Mollets, chevilles, coordination" },
  lateral: { nom: "Fente latérale", duree: 20, video: null,
    description: "Grand pas sur le côté, plie la jambe d’appui en gardant l’autre tendue, reviens et alterne.",
    muscles: "Adducteurs, fessiers, quadriceps" },
  bird: { nom: "Bird dog", duree: 20, video: null,
    description: "À quatre pattes, tends un bras et la jambe opposée, tiens une seconde, reviens et alterne.",
    muscles: "Lombaires, fessiers, abdos, stabilité du tronc" },
  sumo: { nom: "Squat sumo avec toucher d’orteils", duree: 20, video: null,
    description: "Jambes écartées, descends en squat, attrape tes orteils, tends les jambes en gardant les mains aux pieds, puis redescends.",
    muscles: "Adducteurs, ischio-jambiers, fessiers, mollets" },
  cobra: { nom: "Cobra vers chien tête en bas", duree: 20, video: null,
    description: "Depuis le ventre au sol, pousse pour ouvrir la poitrine (cobra), puis relève le bassin en chien tête en bas. Enchaîne.",
    muscles: "Abdos, pectoraux, colonne, mollets, ischios" },
  legfwd: { nom: "Balancés de jambe avant-arrière", duree: 20, video: null,
    description: "Debout, appuyé à un mur, balance une jambe tendue d’avant en arrière. Change de jambe à mi-temps.",
    muscles: "Ischio-jambiers, fléchisseurs de hanche" },
  legside: { nom: "Balancés de jambe latéraux", duree: 20, video: null,
    description: "Debout, appuyé à un mur, balance une jambe tendue de côté et vers l’intérieur. Change de jambe à mi-temps.",
    muscles: "Adducteurs, abducteurs, hanches" },
  heelkick: { nom: "Talons-fesses", duree: 20, video: null,
    description: "Sur place, ramène chaque talon vers les fessiers en alternant, genoux sous le bassin.",
    muscles: "Ischio-jambiers, quadriceps" },
  kneeup: { nom: "Montées de genoux", duree: 20, video: null,
    description: "Sur place, monte les genoux à hauteur de hanche en rythme, en restant grand.",
    muscles: "Fléchisseurs de hanche, quadriceps, cardio" },
  lungetwist: { nom: "Fente marchée avec rotation", duree: 20, video: null,
    description: "Avance en fente, tourne le buste vers la jambe avant, puis change de jambe en marchant.",
    muscles: "Quadriceps, fessiers, fléchisseurs de hanche, obliques" },
  calfraise: { nom: "Montées sur les pointes", duree: 20, video: null,
    description: "Debout, monte sur la pointe des pieds de façon dynamique, puis redescends lentement.",
    muscles: "Mollets, chevilles, tendon d’Achille" },
  skater: { nom: "Pas de patineur", duree: 20, video: null,
    description: "Saute d’une jambe sur l’autre sur le côté, amortis l’appui et balance les bras.",
    muscles: "Fessiers, abducteurs, chevilles, équilibre" },
  hydrant: { nom: "Fire hydrant", duree: 20, video: null,
    description: "À quatre pattes, lève un genou sur le côté en gardant l’angle à 90°, puis fais des cercles. Alterne.",
    muscles: "Fessiers, rotateurs de hanche" },
  ankles: { nom: "Cercles de chevilles", duree: 20, video: null,
    description: "Sur une jambe, dessine de grands cercles avec la pointe du pied. Change de pied à mi-temps.",
    muscles: "Chevilles, mollets" }
});

/* Exercices conseillés pour chaque routine : les 8 de départ + d’autres qui sollicitent les mêmes zones */
const CONSEILLES = {
  boxe:   ["inchworm","wgs","openbook","thread","wipers","catcow","cossack","shadow","armcircles","armcross","scap","twist","tspin","slips","footwork","lateral","bird","sumo","cobra"],
  course: ["dogpedal","wgs","scorpion","hip9090","rdl","fente","pont","askip","legfwd","legside","heelkick","kneeup","lungetwist","calfraise","skater","hydrant","ankles","lateral","sumo","bird"]
};

const ROUTINES = {
  boxe:   { titre: "Boxe", detail: "Épaules, thoracique, hanches, tronc", couleur: "#C8283C",
            exercices: ["inchworm","wgs","openbook","thread","wipers","catcow","cossack","shadow"] },
  course: { titre: "Course à pied", detail: "Hanches, jambes, chevilles", couleur: "#0E7C86",
            exercices: ["dogpedal","wgs","scorpion","hip9090","rdl","fente","pont","askip"] }
};

Object.assign(EXERCICES, {
  squat: { nom: "Squat", duree: 40, video: null,
    description: "Pieds largeur d’épaules, descends en poussant les fesses en arrière jusqu’à avoir les cuisses parallèles au sol, puis remonte.",
    muscles: "Quadriceps, fessiers, ischio-jambiers" },
  fentesalt: { nom: "Fentes avant alternées", duree: 40, video: null,
    description: "Fais un grand pas en avant, descends jusqu’à deux genoux à 90°, repousse pour revenir et alterne les jambes.",
    muscles: "Quadriceps, fessiers, ischio-jambiers, équilibre" },
  pontuni: { nom: "Pont fessier unipodal", duree: 40, video: null,
    description: "Allongé sur le dos, une jambe tendue en l’air, monte le bassin en poussant sur l’autre pied et serre les fessiers. Change de jambe à mi-temps.",
    muscles: "Fessiers, ischio-jambiers, lombaires" },
  mollet1: { nom: "Montées de mollets sur une jambe", duree: 40, video: null,
    description: "Sur une jambe, monte sur la pointe du pied puis redescends lentement. Change de jambe à mi-temps.",
    muscles: "Mollets, tendon d’Achille, chevilles" },
  chaise: { nom: "La chaise", duree: 40, video: null,
    description: "Dos contre un mur, descends jusqu’à avoir les cuisses parallèles au sol et tiens la position.",
    muscles: "Quadriceps, fessiers, mollets" },
  planche: { nom: "Planche (gainage)", duree: 40, video: null,
    description: "Sur les avant-bras et la pointe des pieds, corps aligné de la tête aux talons, abdos et fessiers serrés.",
    muscles: "Abdos profonds, dos, épaules, fessiers" },
  planchelat: { nom: "Planche latérale", duree: 40, video: null,
    description: "Sur un avant-bras, corps aligné de profil, bassin haut, bras libre vers le plafond. Change de côté à mi-temps.",
    muscles: "Obliques, fessiers, épaules" },
  climbers: { nom: "Mountain climbers", duree: 40, video: null,
    description: "En position de pompe, ramène les genoux vers la poitrine en alternant, à bon rythme.",
    muscles: "Abdos, fléchisseurs de hanche, épaules, cardio" },
  squatsaute: { nom: "Squats sautés", duree: 40, video: null,
    description: "Descends en squat puis saute le plus haut possible. Amortis la réception et enchaîne.",
    muscles: "Quadriceps, fessiers, mollets, explosivité" },
  deadbug: { nom: "Dead bug", duree: 40, video: null,
    description: "Sur le dos, bras tendus vers le plafond et genoux à 90°. Tends un bras et la jambe opposée sans décoller le bas du dos, puis alterne.",
    muscles: "Abdos profonds, fléchisseurs de hanche, stabilité" },
  pompes: { nom: "Pompes", duree: 40, video: null,
    description: "Mains sous les épaules, corps aligné, descends la poitrine près du sol puis repousse.",
    muscles: "Pectoraux, triceps, épaules, gainage" },
  pompesserrees: { nom: "Pompes serrées", duree: 40, video: null,
    description: "Mains rapprochées sous la poitrine, coudes près du corps, descends puis repousse.",
    muscles: "Triceps, pectoraux, épaules" },
  burpees: { nom: "Burpees", duree: 40, video: null,
    description: "Depuis debout, mains au sol, jambes en arrière en planche, ramène les pieds puis saute bras en l’air.",
    muscles: "Corps entier, cardio, explosivité" },
  russian: { nom: "Rotations russes", duree: 40, video: null,
    description: "Assis, buste incliné en arrière, pieds décollés, fais pivoter le buste en portant les mains d’un côté puis de l’autre.",
    muscles: "Obliques, abdos, fléchisseurs de hanche" },
  superman: { nom: "Superman", duree: 40, video: null,
    description: "Allongé sur le ventre, lève en même temps bras, poitrine et jambes, tiens une seconde puis relâche.",
    muscles: "Lombaires, fessiers, haut du dos" },
  planchetouch: { nom: "Planche avec touchers d’épaule", duree: 40, video: null,
    description: "En position de pompe, touche ton épaule avec la main opposée sans bouger le bassin, puis alterne.",
    muscles: "Abdos, obliques, épaules, stabilité" }
});

/* Séances de renforcement (type "seance") */
Object.assign(ROUTINES, {
  renfoCourse: { type: "seance", titre: "Renfo course à pied", detail: "Jambes, fessiers, mollets, gainage", couleur: "#0E7C86",
    exercices: ["squat","fentesalt","rdl","pontuni","mollet1","planche","planchelat","deadbug"] },
  renfoBoxe: { type: "seance", titre: "Renfo boxe", detail: "Pectoraux, épaules, triceps, abdos, jambes explosives", couleur: "#C8283C",
    exercices: ["squatsaute","pompes","russian","planchetouch","chasseGarde","genouxMur","burpeeSprawl","climbers"] }
});
Object.assign(CONSEILLES, {
  renfoCourse: ["squat","fentesalt","rdl","pontuni","mollet1","planche","planchelat","deadbug","chaise","squatsaute","climbers","bird","lateral","skater","calfraise","pont","fente"],
  renfoBoxe: ["squatsaute","pompes","russian","planchetouch","chasseGarde","genouxMur","burpeeSprawl","pompesserrees","climbers","superman","burpees","planche","planchelat","squat","deadbug","fentesalt","tspin","scap","twist"]
});

/* Tabata : minuteur pur, sans exercices (effort + repos répétés, cycles séparés par une récupération) */
ROUTINES.tabata = { type: "seance", tabata: true, titre: "Tabata", detail: "Minuteur : effort, repos, répétitions et cycles réglables", couleur: "#D9480F", exercices: [] };

/* Routines de renforcement musculaire */
Object.assign(ROUTINES, {
  haut:   { titre: "Haut du corps", detail: "Renforcement : épaules, dos, pectoraux, bras", couleur: "#7B5EA7",
            exercices: ["armcircles","armcross","catcow","thread","openbook","scap","tspin","inchworm"] },
  bas:    { titre: "Bas du corps", detail: "Renforcement : hanches, fessiers, cuisses, mollets", couleur: "#AD5A0C",
            exercices: ["hip9090","hydrant","pont","legfwd","sumo","fente","rdl","calfraise"] },
  complet: { titre: "Haut et bas du corps", detail: "Renforcement : tout le corps", couleur: "#2F7D3A",
            exercices: ["armcircles","inchworm","wgs","catcow","thread","pont","sumo","lungetwist"] }
});
Object.assign(CONSEILLES, {
  haut:    ["armcircles","armcross","catcow","thread","openbook","scap","tspin","inchworm","twist","bird","cobra","dogpedal","wgs"],
  bas:     ["hip9090","hydrant","pont","legfwd","sumo","fente","rdl","calfraise","legside","lateral","cossack","scorpion","lungetwist","dogpedal","ankles","heelkick","kneeup","skater","wipers"],
  complet: ["armcircles","inchworm","wgs","catcow","thread","pont","sumo","lungetwist","openbook","scap","tspin","bird","cobra","dogpedal","twist","lateral","cossack","rdl","fente","calfraise"]
});

/* ============ PERSONNAGE (illustrations) ============
   Pose = [x hanche, y hanche, inclinaison du tronc, bras proche (haut, avant-bras), bras éloigné (haut, avant-bras),
           jambe proche (cuisse, tibia), jambe éloignée (cuisse, tibia)] — angles en degrés, 0 = vers le bas.
   f[0] = position principale, f[1] = position de départ (fantôme). Flèche = [x1, y1, xc, yc, x2, y2] (courbe). */
const POSES = {
  inchworm:  { f: [[102,111,61,0,0,0,0,-61,-61,-61,-61],[60,80,135,38,38,38,38,0,0,0,0]], a: [[105,58,130,40,160,56]] },
  wgs:       { f: [[100,110,70,-19,-19,190,190,90,0,-60,-60]], a: [[146,72,125,30,98,60]] },
  openbook:  { f: [[85,128,90,180,180,100,100,-80,-100,-75,-95],[85,128,90,100,100,100,100,-80,-100,-75,-95]], a: [[165,118,172,88,128,76]] },
  thread:    { f: [[75,110,62,-70,-70,0,0,0,-90,0,-90],[75,110,62,170,170,0,0,0,-90,0,-90]], a: [[62,106,38,60,98,38]] },
  wipers:    { f: [[110,128,-90,80,80,80,80,150,20,150,20]], a: [[110,84,130,66,152,84],[152,92,130,74,110,92]] },
  catcow:    { f: [[75,110,62,0,0,0,0,0,-90,0,-90]], a: [[72,86,96,60,122,80],[122,124,98,138,74,124]] },
  cossack:   { f: [[100,100,0,70,70,-70,-70,70,0,-48,-48]], a: [[70,40,100,18,130,40]] },
  shadow:    { f: [[115,82,10,90,90,20,160,25,-5,-35,10],[115,82,10,20,160,20,160,25,-5,-35,10]], a: [[150,36,172,36,196,36]] },
  dogpedal:  { f: [[128,97,-122,-58,-58,-58,-58,45,45,45,45],[128,97,-122,-58,-58,-58,-58,20,70,45,45]], a: [[152,96,170,112,152,128]] },
  scorpion:  { f: [[70,128,90,95,95,95,95,-90,150,-90,-90]], a: [[58,92,92,60,126,92]] },
  hip9090:   { f: [[110,128,0,-40,-40,-45,-45,150,-30,140,-20]], a: [[108,84,128,68,150,84],[150,94,128,78,108,94]] },
  rdl:       { f: [[120,80,90,0,0,0,0,0,0,-90,-90],[120,80,0,0,0,0,0,0,0,0,0]], a: [[138,52,172,42,186,72]] },
  fente:     { f: [[115,105,0,175,175,175,175,80,0,-20,-80],[115,80,0,175,175,175,175,0,0,0,0]], a: [[70,60,70,82,70,106]] },
  pont:      { f: [[101,114,-115,80,80,80,80,95,-37,95,-37],[104,128,-90,80,80,80,80,150,20,150,20]], a: [[103,94,103,76,103,58]] },
  askip:     { f: [[120,80,5,-40,-100,40,110,85,10,0,0],[120,80,5,40,110,-40,-100,0,0,85,10]], a: [[150,128,150,112,150,96]] }
};

Object.assign(POSES, {
  armcircles: { f: [[120,80,0,90,90,-90,-90,6,6,-6,-6],[120,80,0,150,150,-150,-150,6,6,-6,-6]], a: [[160,30,192,48,172,70],[80,30,48,48,68,70]] },
  armcross:   { f: [[120,80,0,95,95,-95,-95,6,6,-6,-6],[120,80,0,60,-130,-60,130,6,6,-6,-6]], a: [[172,64,156,64,140,64],[68,64,84,64,100,64]] },
  scap:       { f: [[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[112,84,112,70,112,56],[100,58,100,70,100,84]] },
  twist:      { f: [[120,80,0,100,100,70,70,14,14,-14,-14],[120,80,0,-70,-70,-100,-100,14,14,-14,-14]], a: [[165,32,185,50,168,68],[75,68,55,50,72,32]] },
  tspin:      { f: [[102,111,61,0,0,180,180,-61,-61,-61,-61],[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[152,78,158,42,128,34]] },
  slips:      { f: [[115,86,25,20,160,20,160,30,-10,-30,10],[115,82,5,20,160,20,160,30,-10,-30,10]], a: [[112,26,125,22,140,34]] },
  footwork:   { f: [[118,80,8,20,160,20,160,15,-5,-15,5],[118,72,8,20,160,20,160,15,-5,-15,5]], a: [[75,125,75,108,75,92],[165,92,165,108,165,125]] },
  lateral:    { f: [[100,100,0,40,-120,-40,120,70,0,-48,-48],[100,88,0,40,-120,-40,120,30,30,-30,-30]], a: [[132,48,152,42,172,52]] },
  bird:       { f: [[75,110,62,90,90,0,0,0,-90,-90,-90],[75,110,62,0,0,0,0,0,-90,0,-90]], a: [[152,76,168,76,186,76],[44,92,30,92,16,92]] },
  sumo:       { f: [[120,98,0,0,0,0,0,65,10,-65,-10],[120,88,0,0,0,0,0,30,30,-30,-30]], a: [[190,60,190,78,190,96]] },
  cobra:      { f: [[70,128,25,-20,-20,-20,-20,-90,-90,-90,-90],[128,97,-122,-58,-58,-58,-58,45,45,45,45]], a: [[108,92,140,66,172,90]] },
  legfwd:     { f: [[120,80,0,80,80,80,80,80,80,0,0],[120,80,0,80,80,80,80,-35,-35,0,0]], a: [[172,72,140,50,100,84]] },
  legside:    { f: [[120,80,0,70,70,-70,-70,55,55,0,0],[120,80,0,70,70,-70,-70,-25,-25,0,0]], a: [[172,100,160,122,132,126]] },
  heelkick:   { f: [[120,80,5,40,110,-40,-100,10,-150,0,0],[120,80,5,-40,-100,40,110,0,0,10,-150]], a: [[100,122,92,106,100,92]] },
  kneeup:     { f: [[120,80,0,-40,-100,40,110,90,0,0,0],[120,80,0,-40,-100,40,110,0,0,0,0]], a: [[165,125,165,108,165,92]] },
  lungetwist: { f: [[115,105,0,90,90,90,90,80,0,-20,-80],[115,80,0,90,90,90,90,0,0,0,0]], a: [[96,60,115,40,140,56]] },
  calfraise:  { f: [[120,70,0,5,5,-5,-5,0,0,0,0],[120,80,0,5,5,-5,-5,0,0,0,0]], a: [[165,122,165,106,165,90]] },
  skater:     { f: [[120,85,15,60,60,-80,-80,15,-10,-60,-30],[120,85,-15,-60,-60,80,80,-15,10,60,30]], a: [[170,70,185,70,200,70]] },
  hydrant:    { f: [[75,110,62,0,0,0,0,-100,0,0,-90],[75,110,62,0,0,0,0,0,-90,0,-90]], a: [[30,95,42,80,60,92]] },
  ankles:     { f: [[120,80,0,70,70,-70,-70,70,0,0,0]], a: [[132,112,150,142,168,112]] }
});

Object.assign(POSES, {
  squat:         { f: [[100,112,40,90,90,90,90,80,-40,80,-40],[120,80,0,90,90,90,90,0,0,0,0]], a: [[185,60,185,78,185,98]] },
  fentesalt:     { f: [[115,105,0,-35,60,-35,60,80,0,-20,-80],[115,80,0,-35,60,-35,60,0,0,0,0]], a: [[70,60,70,82,70,106]] },
  pontuni:       { f: [[101,114,-115,80,80,80,80,95,-37,100,100],[104,128,-90,80,80,80,80,150,20,150,20]], a: [[103,94,103,76,103,58]] },
  mollet1:       { f: [[120,70,0,5,5,-5,-5,0,0,-10,-120],[120,80,0,5,5,-5,-5,0,0,-10,-120]], a: [[165,122,165,106,165,90]] },
  chaise:        { f: [[80,110,0,20,70,20,70,90,0,90,0]], a: [] },
  planche:       { f: [[98,125,75,0,90,0,90,-75,-75,-75,-75]], a: [] },
  planchelat:    { f: [[114,125,75,0,90,180,180,-75,-75,-75,-75]], a: [[112,100,112,86,112,72]] },
  climbers:      { f: [[102,111,61,0,0,0,0,60,-60,-61,-61],[102,111,61,0,0,0,0,-61,-61,60,-60]], a: [[70,128,95,112,124,122]] },
  squatsaute:    { f: [[120,60,0,160,160,160,160,0,0,0,0],[100,112,40,-60,-60,-60,-60,80,-40,80,-40]], a: [[175,125,175,95,175,65]] },
  deadbug:       { f: [[110,128,-90,-90,-90,180,180,180,90,95,95]], a: [[150,100,165,108,178,114]] },
  pompes:        { f: [[99,129,79,-60,74,-60,74,-79,-79,-79,-79],[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[168,70,168,90,168,110]] },
  pompesserrees: { f: [[99,129,79,-60,74,-60,74,-79,-79,-79,-79],[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[168,70,168,90,168,110]] },
  burpees:       { f: [[102,111,61,0,0,0,0,-61,-61,-61,-61],[120,80,0,170,170,170,170,0,0,0,0]], a: [[60,104,66,36,106,44]] },
  russian:       { f: [[110,125,-35,70,70,70,70,120,70,120,70]], a: [[118,100,133,88,150,100],[150,106,133,94,116,106]] },
  superman:      { f: [[70,128,70,120,120,120,120,-110,-110,-110,-110],[70,128,90,95,95,95,95,-90,-90,-90,-90]], a: [[40,100,40,86,40,72],[150,96,150,82,150,68]] },
  planchetouch:  { f: [[102,111,61,100,-120,0,0,-61,-61,-61,-61],[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[165,68,150,50,132,72]] }
});

/* Catégories d'échauffement par sport (chaque routine appartient à une catégorie) */
const CATS = {
  boxe:   { titre: "Boxe", detail: "Épaules, thoracique, hanches, tronc", couleur: "#C8283C" },
  course: { titre: "Course à pied", detail: "Hanches, jambes, chevilles", couleur: "#0E7C86" },
  renfo:  { titre: "Renfo", detail: "Haut du corps, bas du corps ou tout le corps", couleur: "#7B5EA7" },
  yoga:   { titre: "Yoga", detail: "Souplesse, dos, hanches, respiration", couleur: "#C0527A" }
};
["boxe","course"].forEach(k => ROUTINES[k].cat = k);
["haut","bas","complet"].forEach(k => ROUTINES[k].cat = "renfo");

Object.assign(EXERCICES, {
  enfant: { nom: "Posture de l’enfant active", duree: 20, video: null,
    description: "À genoux, assis sur les talons, avance les mains loin devant toi et pose le front vers le sol. Respire, puis redresse-toi et recommence.",
    muscles: "Dos, épaules, hanches, chevilles" },
  cascade: { nom: "Flexion avant en cascade", duree: 20, video: null,
    description: "Debout, genoux souples, laisse retomber le buste et les bras vers le sol, tête relâchée, puis remonte lentement vertèbre par vertèbre.",
    muscles: "Ischio-jambiers, bas du dos, nuque" }
});
ROUTINES.yoga = { cat: "yoga", titre: "Yoga", detail: "Échauffement doux : dos, hanches, respiration", couleur: "#C0527A",
  exercices: ["catcow","thread","enfant","cobra","dogpedal","wgs","hip9090","cascade"] };
CONSEILLES.yoga = ["catcow","thread","enfant","cobra","dogpedal","wgs","hip9090","cascade","openbook","bird","hydrant","pont","wipers","scorpion","cossack","armcircles","twist"];
Object.assign(POSES, {
  enfant:  { v: "p", f: [[55,132,75,70,80,70,80,85,-90,85,-90],[60,109,0,0,0,0,0,0,-90,0,-90]], a: [[100,100,125,96,146,112]] },
  cascade: { v: "p", f: [[120,86,125,15,60,15,60,8,-5,8,-5],[120,85,0,170,170,170,170,0,0,0,0]], a: [[176,30,198,72,176,118]] }
});

/* Surf et ski : échauffements + séances de renfo (haut, bas, haut et bas du corps) */
Object.assign(CATS, {
  surf: { titre: "Surf", detail: "Épaules, dos, hanches, pop-up", couleur: "#1D8FE1" },
  ski:  { titre: "Ski", detail: "Jambes, chevilles, hanches, équilibre", couleur: "#3949AB" }
});
Object.assign(EXERCICES, {
  paddle: { nom: "Rame de surfeur", duree: 20, video: null,
    description: "Allongé sur le ventre, poitrine relevée, simule la rame : grands cercles de bras en alternant, jambes serrées.",
    muscles: "Épaules, dorsaux, lombaires, nuque" },
  popup: { nom: "Pop-up de surf", duree: 20, video: null,
    description: "Allongé sur le ventre, mains sous la poitrine : pousse, ramène les pieds sous toi d’un seul mouvement et relève-toi en position basse de surfeur. Redescends et recommence.",
    muscles: "Épaules, triceps, hanches, jambes, abdos" },
  surfsquat: { nom: "Squat de surfeur", duree: 20, video: null,
    description: "Pieds écartés et légèrement décalés, descends en squat bas, bras ouverts pour l’équilibre, puis remonte. Change de pied avant à mi-temps.",
    muscles: "Quadriceps, fessiers, adducteurs, équilibre" },
  skisquat: { nom: "Position du skieur", duree: 20, video: null,
    description: "Genoux fléchis, buste penché, bras tendus devant toi comme pour tenir des bâtons. Garde la position en rebondissant légèrement sur les jambes.",
    muscles: "Quadriceps, fessiers, lombaires, abdos" },
  skihop: { nom: "Sauts latéraux de skieur", duree: 20, video: null,
    description: "Pieds joints, saute d’un côté à l’autre d’une ligne imaginaire en amortissant chaque réception, genoux fléchis.",
    muscles: "Mollets, quadriceps, fessiers, chevilles, coordination" }
});
Object.assign(ROUTINES, {
  surf: { cat: "surf", titre: "Surf", detail: "Échauffement : épaules, dos, hanches, pop-up", couleur: "#1D8FE1",
    exercices: ["armcircles","thread","cobra","paddle","hip9090","cossack","surfsquat","popup"] },
  ski: { cat: "ski", titre: "Ski", detail: "Échauffement : jambes, chevilles, hanches", couleur: "#3949AB",
    exercices: ["legfwd","legside","ankles","lateral","sumo","twist","skisquat","skihop"] },
  renfoSurf: { type: "seance", titre: "Renfo surf", detail: "Épaules, dos, gainage, jambes", couleur: "#1D8FE1",
    exercices: ["pompes","squat","superman","burpees","planchelat","russian","fentesalt","planche"] },
  renfoSki: { type: "seance", titre: "Renfo ski", detail: "Cuisses, fessiers, mollets, gainage", couleur: "#3949AB",
    exercices: ["squat","chaise","fentesalt","skater","pontuni","mollet1","planche","planchelat"] },
  renfoHaut: { type: "seance", titre: "Renfo haut du corps", detail: "Pectoraux, épaules, triceps, dos, abdos", couleur: "#7B5EA7",
    exercices: ["pompes","pompesserrees","planchetouch","scap","superman","planche","tspin","climbers"] },
  renfoBas: { type: "seance", titre: "Renfo bas du corps", detail: "Cuisses, fessiers, ischios, mollets", couleur: "#AD5A0C",
    exercices: ["squat","fentesalt","rdl","pontuni","mollet1","chaise","skater","squatsaute"] },
  renfoComplet: { type: "seance", titre: "Renfo haut et bas du corps", detail: "Tout le corps", couleur: "#2F7D3A",
    exercices: ["squat","pompes","fentesalt","planche","pontuni","superman","climbers","burpees"] }
});
{ const t = ROUTINES.tabata; delete ROUTINES.tabata; ROUTINES.tabata = t; }   // Tabata en dernier
Object.entries({ renfoCourse: "course", renfoBoxe: "boxe", renfoSurf: "surf", renfoSki: "ski", renfoHaut: "haut", renfoBas: "bas", renfoComplet: "complet" }).forEach(([k, g]) => ROUTINES[k].grp = g);
Object.assign(CONSEILLES, {
  surf: ["armcircles","thread","cobra","paddle","hip9090","cossack","surfsquat","popup","wgs","openbook","armcross","scap","twist","bird","tspin","catcow","inchworm"],
  ski: ["legfwd","legside","ankles","lateral","sumo","twist","skisquat","skihop","chaise","rdl","calfraise","skater","cossack","hydrant","fente","wgs","pont"],
  renfoSurf: ["pompes","squat","superman","burpees","planchelat","russian","fentesalt","planche","pompesserrees","planchetouch","tspin","scap","climbers","deadbug","popup"],
  renfoSki: ["squat","chaise","fentesalt","skater","pontuni","mollet1","planche","planchelat","squatsaute","lateral","skihop","skisquat","rdl","deadbug"],
  renfoHaut: ["pompes","pompesserrees","planchetouch","scap","superman","planche","tspin","climbers","burpees","russian","planchelat","deadbug"],
  renfoBas: ["squat","fentesalt","rdl","pontuni","mollet1","chaise","skater","squatsaute","lateral","sumo","fente","calfraise","pont"],
  renfoComplet: ["squat","pompes","fentesalt","planche","pontuni","superman","climbers","burpees","planchelat","russian","deadbug","mollet1","squatsaute","pompesserrees"]
});
Object.assign(POSES, {
  paddle:    { v: "p", f: [[110,132,55,100,100,20,-30,-90,-90,-90,-90],[110,132,55,20,-30,100,100,-90,-90,-90,-90]], a: [[185,106,193,128,155,134]] },
  popup:     { v: "p", f: [[125,96,20,80,80,-80,-80,55,-10,-55,10],[85,130,90,0,0,0,0,-90,-90,-90,-90]], a: [[70,100,80,68,110,50]] },
  surfsquat: { v: "p", f: [[110,102,15,80,80,-80,-80,70,-15,-65,20],[110,85,0,80,80,-80,-80,8,-4,-8,4]], a: [[168,60,168,82,168,104]] },
  skisquat:  { v: "p", f: [[95,98,40,40,100,40,100,60,-20,60,-20],[95,85,0,0,0,0,0,0,0,0,0]], a: [[56,60,56,82,56,104]] },
  skihop:    { v: "f", f: [[165,78,12,25,5,-25,-5,-8,-3,-12,-5],[75,85,-12,25,5,-25,-5,10,5,14,8]], a: [[88,46,120,24,152,46]] }
});

/* ============ DIRECTION ARTISTIQUE (commune à toutes les images) ============
   1 · Départ = silhouette grise  |  2 · Position finale = silhouette blanche  |  flèches = sens du mouvement
   Vues : "p" = profil, "f" = face ou dessus (épaules et hanches avec largeur). Angles : 0 = vers le bas, 90 = vers la droite.
   Options de pose : [11] courbure du dos, [12] inclinaison de la tête, [13] longueur du tronc. null = segment masqué.
   Options d’image : u = libellé de la vue, m = mur, g = lignes de repère. */
const DA = {
  sol: "#B3BDCA",
  depart:  { membre: "#8B99AD", loin: "#7A889C", contour: "#3F4B5C", tete: "#A2AEBF" },
  arrivee: { membre: "#FFFFFF", loin: "#E3E8EF", contour: "#1E2733", tete: "url(#tete)" }
};

/* Images revues : vues de dessus, de face ou de dos quand le profil ne montre pas le mouvement */
Object.assign(POSES, {
  wipers:   { v: "f", u: "Vue de dessus", f: [[95,75,90,0,0,180,180,0,-90,0,-90],[95,75,90,0,0,180,180,180,-90,180,-90]], a: [[50,48,34,75,50,102,1]] },
  openbook: { v: "p", u: "Vue de dessus", f: [[85,75,90,180,180,0,0,0,-90,5,-85],[85,75,90,0,0,0,0,0,-90,5,-85]], a: [[148,112,172,75,148,36]] },
  scorpion: { v: "f", u: "Vue de dessus", f: [[85,75,90,0,0,180,180,-90,180,-90,-90],[85,75,90,0,0,180,180,-90,-90,-90,-90]], a: [[40,102,20,72,46,44]] },
  hip9090:  { v: "f", u: "Vue de dessus", f: [[120,95,0,160,160,-160,-160,125,-145,80,-5,0,0,8],[120,95,0,160,160,-160,-160,-80,5,-125,145,0,0,8]], a: [[95,130,120,146,150,130,1]] },
  twist:    { v: "f", u: "Vue de dessus", f: [[120,78,40,50,50,-130,-130,null,null,null,null,0,0,0],[120,78,-40,130,130,-50,-50,null,null,null,null,0,0,0]], a: [[70,28,120,6,170,28,1]] },
  russian:  { v: "f", u: "Vue de dessus", f: [[80,75,130,50,50,50,50,90,90,90,90,0,0,8],[80,75,50,130,130,130,130,90,90,90,90,0,0,8]], a: [[130,24,172,75,130,126,1]] },
  lungetwist: { v: "f", u: "Vue de dessus", f: [[100,75,150,30,30,30,30,88,92,-92,-88,0,0,8],[100,75,90,90,90,90,90,88,92,-92,-88,0,0,8]], a: [[158,66,172,88,150,106]] },
  slips:    { v: "f", f: [[120,82,18,25,-165,-25,165,20,-8,-20,8],[120,82,-18,25,-165,-25,165,20,-8,-20,8]], a: [[95,20,120,8,148,20,1]] },
  footwork: { v: "p", f: [[135,82,10,20,160,20,160,25,-5,-35,10],[115,82,10,20,160,20,160,25,-5,-35,10]], a: [[100,26,130,16,168,26]] },
  catcow:   { v: "p", f: [[75,110,62,0,0,0,0,0,-90,0,-90,14,55],[75,110,62,0,0,0,0,0,-90,0,-90,-10,-40]], a: [[70,70,100,48,130,70,1]] },
  hydrant:  { v: "f", u: "Vue de dos", f: [[120,110,0,0,0,0,0,90,0,0,null,0,0,16],[120,110,0,0,0,0,0,0,null,0,null,0,0,16]], a: [[140,134,166,134,176,106]] },
  thread:   { v: "f", u: "Vue de face", f: [[120,110,0,-50,-50,0,0,0,null,0,null,0,0,16],[120,110,0,180,180,0,0,0,null,0,null,0,0,16]], a: [[152,52,172,104,112,126]] },
  pompesserrees: { v: "f", u: "Vue de dessus", f: [[80,75,90,101,101,79,79,-90,-90,-90,-90],[80,75,90,90,90,90,90,-90,-90,-90,-90]], a: [[175,44,170,56,164,68],[175,106,170,94,164,82]] },
  cobra:    { v: "p", f: [[70,128,25,-20,-20,-20,-20,-90,-90,-90,-90],[70,128,90,95,95,95,95,-90,-90,-90,-90]], a: [[104,96,108,80,102,64]] },
  chaise:   { v: "p", f: [[80,110,0,20,70,20,70,90,0,90,0]], a: [], m: 60, g: [[80,110,150,110]] },
  planche:  { v: "p", f: [[98,125,75,0,90,0,90,-75,-75,-75,-75]], a: [], g: [[36,141,152,110]] },
  planchelat: { v: "p", f: [[114,125,75,0,90,180,180,-75,-75,-75,-75]], a: [[112,100,112,86,112,72]], g: [[50,141,160,112]] }
});
["cossack","lateral","sumo","legside","skater","armcircles","armcross"].forEach(id => { POSES[id].v = "f"; });
POSES.ankles.a = [[132,112,150,142,168,112,1]];

Object.assign(POSES, {
  thread:   { v: "p", f: [[75,110,62,-70,-70,0,0,0,-90,0,-90],[75,110,62,170,170,0,0,0,-90,0,-90]], a: [[62,106,38,60,98,38]] },
  hip9090:  { v: "f", u: "Vue de dessus", f: [[120,105,0,20,20,-20,-20,125,-145,80,-5,0,0,8],[120,105,0,20,20,-20,-20,-80,5,-125,145,0,0,8]], a: [[90,40,120,22,150,40,1]] },
  pont:     { v: "p", f: [[78,108.5,-125,80,80,80,80,100,-10,100,-10],[84,128,-90,80,80,80,80,150,20,150,20]], a: [[78,92,78,76,78,60]] },
  pontuni:  { v: "p", f: [[78,108.5,-125,80,80,80,80,100,-10,100,100],[84,128,-90,80,80,80,80,150,20,150,20]], a: [[78,92,78,76,78,60]] },
  scap:     { v: "p", f: [[102,111,61,0,0,0,0,-61,-61,-61,-61],[102,111,70,0,0,0,0,-61,-61,-61,-61]], a: [[112,84,112,70,112,56],[100,58,100,70,100,84]] },
  twist:    { v: "f", u: "Vue de dessus", pi: [[103,92],[137,92]], f: [[120,78,40,50,50,-130,-130,null,null,null,null,0,0,0],[120,78,-40,130,130,-50,-50,null,null,null,null,0,0,0]], a: [[70,28,120,6,170,28,1]] },
  squatsaute: { v: "p", f: [[120,70,0,155,155,155,155,0,0,0,0],[100,112,40,-60,-60,-60,-60,80,-40,80,-40]], a: [[175,125,175,95,175,65]] },
  lungetwist: { v: "p", f: [[115,105,0,120,120,-60,-60,80,0,-20,-80],[115,105,0,90,90,90,90,80,0,-20,-80]], a: [[165,60,184,84,162,108]] },
  russian:  { v: "f", u: "Vue de dessus", pi: [[150,66],[150,84]], f: [[70,75,130,50,50,50,50,null,null,null,null,0,0,8],[70,75,50,130,130,130,130,null,null,null,null,0,0,8]], a: [[120,24,160,75,120,126,1]] },
  planchetouch: { v: "f", u: "Vue de face", pi: [[113,138],[127,138]], f: [[120,110,0,-60,-158,0,0,null,null,null,null,0,0,16],[120,110,0,0,0,0,0,null,null,null,null,0,0,16]], a: [[160,72,150,56,130,64]] }
});

function figure(p, S, v) {
  const [hx, hy, t] = p, r = p.slice(3, 11);
  const c = p[11] || 0, hb = p[12] || 0, tl = p[13] === undefined ? 34 : p[13];
  const w = v === "f" ? 1 : 0;
  const rad = d => d * Math.PI / 180;
  const up = [Math.sin(rad(t)), -Math.cos(rad(t))], pr = [Math.cos(rad(t)), Math.sin(rad(t))];
  const hd = [Math.sin(rad(t + hb)), -Math.cos(rad(t + hb))];
  const hip = [hx, hy], sh = [hx + up[0] * tl, hy + up[1] * tl];
  const tete = [sh[0] + hd[0] * 15, sh[1] + hd[1] * 15];
  const dec = (o, k) => [o[0] + pr[0] * k, o[1] + pr[1] * k];
  const pt = (a, ang, len) => [a[0] + Math.sin(rad(ang)) * len, a[1] + Math.cos(rad(ang)) * len];
  const membre = (o, a1, l1, a2, l2) => {
    if (a1 === null) return null;
    const m = pt(o, a1, l1);
    return a2 === null ? [o, m] : [o, m, pt(m, a2, l2)];
  };
  const f1 = n => n.toFixed(1);
  const trait = (pts, wd, fill) => {
    if (!pts) return "";
    const s = pts.map(q => f1(q[0]) + "," + f1(q[1])).join(" ");
    return `<polyline points="${s}" fill="none" stroke="${S.contour}" stroke-width="${wd + 4}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${s}" fill="none" stroke="${fill}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const tw = w ? 26 : 20;
  let torse;
  if (tl === 0) {
    torse = `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="${tw / 2}" fill="${S.membre}" stroke="${S.contour}" stroke-width="4"/>`;
  } else {
    const ctl = [(hip[0] + sh[0]) / 2 - pr[0] * 2 * c, (hip[1] + sh[1]) / 2 - pr[1] * 2 * c];
    const d = `M${f1(hip[0])} ${f1(hip[1])} Q${f1(ctl[0])} ${f1(ctl[1])} ${f1(sh[0])} ${f1(sh[1])}`;
    torse = `<path d="${d}" fill="none" stroke="${S.contour}" stroke-width="${tw + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${S.membre}" stroke-width="${tw}" stroke-linecap="round"/>`;
  }
  const bF = dec(sh, -13 * w), bN = dec(sh, 13 * w), jF = dec(hip, -7 * w), jN = dec(hip, 7 * w);
  const mF = membre(bF, r[2], 24, r[3], 22), pF = membre(jF, r[6], 30, r[7], 30), pN = membre(jN, r[4], 30, r[5], 30), mN = membre(bN, r[0], 24, r[1], 22);
  const bout = (m, o) => m ? m[m.length - 1] : o;
  const svg =
    trait(mF, 8, S.loin) +
    trait(pF, 11, S.loin) +
    torse +
    trait(pN, 11, S.membre) +
    trait(mN, 8, S.membre) +
    `<circle cx="${f1(tete[0])}" cy="${f1(tete[1])}" r="11" fill="${S.tete}" stroke="${S.contour}" stroke-width="3.5"/>`;
  return { svg, tete, J: { mn: bout(mN, bN), mf: bout(mF, bF), pn: bout(pN, jN), pf: bout(pF, jF) } };
}

/* Matériel : dessiné au bout des mains ("mn", "mf", "m" = milieu des deux) ou des pieds ("pn", "pf"), ou à des coordonnées [x, y].
   Fixes (banc, barre de traction) : sous le personnage. Mobiles : par-dessus, en fantôme pour la position de départ. */
const FIXES = ["banc", "tbar", "pad", "tube", "pile"];
function objets(liste, J, fantome) {
  const f = n => n.toFixed(1), gris = "#9AA6B5", ct = "#3B4757";
  const pos = a => Array.isArray(a) ? a : a === "m" ? [(J.mn[0] + J.mf[0]) / 2, (J.mn[1] + J.mf[1]) / 2] : J[a];
  const trait = (a, b, w, c) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const rond = (x, y, r, fond) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fond}" stroke="${ct}" stroke-width="2.5"/>`;
  const forme = {
    barre: (a, L = 18) => {
      const [x, y] = pos(a), pl = dx => `<rect x="${f(x + dx - 2.5)}" y="${f(y - 8)}" width="5" height="16" rx="1.5" fill="${gris}" stroke="${ct}" stroke-width="2"/>`;
      return trait([x - L / 2, y], [x + L / 2, y], 7, ct) + trait([x - L / 2, y], [x + L / 2, y], 3.5, gris) + pl(-L / 2) + pl(L / 2);
    },
    kb: (a, dy = 12) => { const [x, y] = pos(a); return `<path d="M${f(x - 5)} ${f(y + dy - 6)}A6 7 0 0 1 ${f(x + 5)} ${f(y + dy - 6)}" fill="none" stroke="${ct}" stroke-width="3.5"/>` + rond(x, y + dy, 9, gris); },
    disc: a => { const [x, y] = pos(a); return rond(x, y, 11, gris) + rond(x, y, 2.5, "#fff"); },
    roue: a => { const [x, y] = pos(a); return rond(x, y, 8, gris) + rond(x, y, 2, ct); },
    bande: (a, b) => { const p = pos(a), q = pos(b); return `<path d="M${f(p[0])} ${f(p[1])}Q${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2 + 5)} ${f(q[0])} ${f(q[1])}" fill="none" stroke="#E8590C" stroke-width="3.5" stroke-linecap="round"/>`; },
    cable: (a, q) => trait(pos(a), q, 2.5, ct) + rond(q[0], q[1], 5, "#fff"),
    banc: (x, y, w) => trait([x + 8, y + 5], [x + 8, 145], 4, ct) + trait([x + w - 8, y + 5], [x + w - 8, 145], 4, ct) + `<rect x="${x}" y="${y}" width="${w}" height="9" rx="4" fill="${gris}" stroke="${ct}" stroke-width="2.5"/>`,
    // machines de salle : coussin (pad), armature (tube), pile de poids, plaque mobile orientée
    pad: (pts, w = 9) => ["#3B4757", "#9AA6B5"].map((c, i) => `<polyline points="${pts.join(" ")}" fill="none" stroke="${c}" stroke-width="${i ? w : w + 5}" stroke-linecap="round" stroke-linejoin="round"/>`).join(""),
    tube: pts => `<polyline points="${pts.join(" ")}" fill="none" stroke="#9AA6B5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    pile: (x, y, h = 44) => `<rect x="${x}" y="${y}" width="18" height="${h}" rx="2" fill="${gris}" stroke="${ct}" stroke-width="2.5"/>` + Array.from({ length: Math.floor(h / 7) - 1 }, (_, i) => trait([x, y + 7 * (i + 1)], [x + 18, y + 7 * (i + 1)], 1.5, ct)).join(""),
    plaque: (a, ang = 0, L = 22) => { const [x, y] = pos(a), dx = Math.sin(ang * Math.PI / 180) * L / 2, dy = Math.cos(ang * Math.PI / 180) * L / 2; return trait([x - dx, y - dy], [x + dx, y + dy], 12, ct) + trait([x - dx, y - dy], [x + dx, y + dy], 7, gris); },
    tbar: (x1, x2, y) => trait([x1, y], [x1, 145], 3, "#9AA6B5") + trait([x2, y], [x2, 145], 3, "#9AA6B5") + trait([x1, y], [x2, y], 6, ct) + trait([x1, y], [x2, y], 3, gris)
  };
  return `<g opacity="${fantome ? 0.45 : 1}">${liste.map(([t, ...a]) => forme[t](...a)).join("")}</g>`;
}
function matos(p, fin, dep) {
  const o = p.o || [], fixes = o.filter(x => FIXES.includes(x[0])), mobiles = o.filter(x => !FIXES.includes(x[0]));
  return { sous: objets(fixes, null) + (dep ? objets(mobiles, dep.J, true) : ""), sur: objets(mobiles, fin.J) };
}

function mini(id) {
  const p = POSES[id];
  if (!p) return EXERCICES[id].mini || "";
  const dessus = (p.u || "").includes("dessus");
  const dep = p.f[1] ? figure(p.f[1], DA.depart, p.v) : null, fin = figure(p.f[0], { ...DA.arrivee, tete: "#FFFFFF" }, p.v), mt = matos(p, fin, dep);
  const g = (dep ? dep.svg : "") + fin.svg + mt.sur;
  const sol = dessus ? "" : `<line x1="8" y1="145" x2="232" y2="145" stroke="${DA.sol}" stroke-width="4"/>`;
  return `<svg class="mini" viewBox="0 -14 240 164" aria-hidden="true">${sol}${mt.sous}${(p.pi || []).map(q => `<ellipse cx="${q[0]}" cy="${q[1]}" rx="6" ry="9" fill="#fff" stroke="#1E2733" stroke-width="3"/>`).join("")}${g}</svg>`;
}

function dessiner(e) {
  const p = POSES[e.id];
  if (!p) return e.visuel || "";
  const vue = T(p.u || (p.v === "f" ? "Vue de face" : "Vue de profil"));
  const fin = figure(p.f[0], DA.arrivee, p.v);
  const deb = p.f[1] ? figure(p.f[1], DA.depart, p.v) : null, mt = matos(p, fin, deb);
  const pastille = (n, t, fond) => {
    const x = Math.min(230, Math.max(11, t[0] + 16)), y = Math.min(139, Math.max(-2, t[1] - 16));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" stroke="#fff" stroke-width="2" style="fill:${fond}"/><text x="${x.toFixed(1)}" y="${(y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="#fff">${n}</text>`;
  };
  const fleches = (p.a || []).map(a => {
    const d = `M${a[0]} ${a[1]} Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`;
    return `<path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke-width="4.5" stroke-linecap="round" marker-end="url(#fl)"${a[6] ? ' marker-start="url(#fl2)"' : ""} style="stroke:var(--accent)"/>`;
  }).join("");
  const guides = (p.g || []).map(g => `<line x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}" stroke-width="2.5" stroke-dasharray="6 5" style="stroke:var(--accent)"/>`).join("");
  const mur = p.m ? `<rect x="${p.m}" y="8" width="7" height="137" fill="#9AA6B5"/>` : "";
  const sol = vue.includes("dessus") ? "" : `<line x1="8" y1="145" x2="232" y2="145" stroke="${DA.sol}" stroke-width="3"/>`;
  const defs = `<defs><marker id="fl" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--accent);stroke:#fff;stroke-width:1.5;stroke-linejoin:round"/></marker><marker id="fl2" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M10 0L0 5L10 10z" style="fill:var(--accent);stroke:#fff;stroke-width:1.5;stroke-linejoin:round"/></marker><radialGradient id="tete" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#D9DFE7"/></radialGradient></defs>`;
  const pieds = (p.pi || []).map(q => `<ellipse cx="${q[0]}" cy="${q[1]}" rx="6" ry="9" fill="#fff" stroke="#1E2733" stroke-width="3"/>`).join("");
  const legende = (deb ? `<span><i class="p1"></i>${T("1 · Départ")}</span><span><i class="p2"></i>${T("2 · Position finale")}</span>` : `<span><i class="p2"></i>${T("Position à tenir")}</span>`) + `<span class="vue">${vue}</span>`;
  return `<div class="illus"><svg viewBox="0 -14 240 164" role="img" aria-label="${e.nom} : ${vue.toLowerCase()}">${defs}${sol}${mur}${pieds}${mt.sous}${deb ? deb.svg : ""}${fin.svg}${mt.sur}${guides}${fleches}${deb ? pastille(1, deb.tete, "#3F4B5C") + pastille(2, fin.tete, "var(--accent)") : ""}</svg><div class="legende">${legende}</div></div>`;
}

/* Images revues : départ (gris) et arrivée (blanc) plus lisibles */
Object.assign(POSES, {
  inchworm:  { v: "p", f: [[102,111,61,0,0,0,0,-61,-61,-61,-61],[60,85,115,0,0,0,0,0,0,0,0]], a: [[100,128,118,120,138,128]] },
  openbook:  { v: "p", u: "Vue de dessus", f: [[85,75,90,180,180,90,90,0,-90,5,-85],[85,75,90,90,90,90,90,0,-90,5,-85]], a: [[168,72,172,40,132,30]] },
  pont:      { v: "p", f: [[123,108.5,-125,80,80,80,80,100,-10,100,-10],[129,128,-90,80,80,80,80,150,20,150,20]], a: [[123,92,123,76,123,60]] },
  pontuni:   { v: "p", f: [[123,108.5,-125,80,80,80,80,100,-10,100,100],[129,128,-90,80,80,80,80,150,20,150,20]], a: [[123,92,123,76,123,60]] },
  twist:     { v: "f", u: "Vue de dessus", pi: [[103,92],[137,92]], f: [[120,78,0,135,135,-45,-45,null,null,null,null,0,0,0],[120,78,0,90,90,-90,-90,null,null,null,null,0,0,0]], a: [[78,36,120,14,162,36,1]] },
  calfraise: { v: "f", f: [[120,76,0,25,10,-25,-10,2,0,-2,0],[120,85,0,25,10,-25,-10,2,0,-2,0]], a: [[170,126,170,108,170,90]] },
  mollet1:   { v: "p", f: [[120,77,0,70,70,-70,-70,0,0,-10,-120],[120,85,0,70,70,-70,-70,0,0,-10,-120]], a: [[170,126,170,108,170,90]] },
  russian:   { v: "p", f: [[90,128,-30,80,80,80,80,115,115,115,115]], a: [[130,90,152,108,130,126,1]] },
  planchetouch: { v: "p", f: [[102,111,61,120,-160,0,0,-61,-61,-61,-61],[102,111,61,0,0,0,0,-61,-61,-61,-61]], a: [[160,66,166,82,142,90]] }
});
POSES.pompesserrees = POSES.pompes;

const POSES_CALME = {
  grandissement: { v: "f", f: [[120,76,0,172,188,-172,-188,2,0,-2,0],[120,85,0,8,3,-8,-3,0,0,0,0]], a: [[170,110,170,70,170,30]] },
  nuqueFlex: { v: "p", f: [[110,80,0,60,-140,58,-138,0,0,0,0,0,55],[110,80,0,8,3,6,2,0,0,0,0]], a: [[142,34,148,48,138,60]] },
  nuqueLat:  { v: "f", f: [[120,80,0,150,-92,-15,-10,0,0,0,0,0,30],[120,80,0,8,3,-8,-3,0,0,0,0]], a: [[128,16,152,20,156,42]] },
  brasCroise: { v: "f", f: [[120,80,0,-80,-80,10,-170,0,0,0,0],[120,80,0,8,3,-8,-3,0,0,0,0]], a: [[96,70,84,62,70,64]] },
  triceps:   { v: "f", f: [[120,80,0,160,-70,124,124,0,0,0,0],[120,80,0,8,3,-8,-3,0,0,0,0]], a: [[158,18,164,34,156,50]] },
  dosMains:  { v: "p", f: [[110,80,12,-125,-125,-125,-125,0,0,0,0,0,-10],[110,80,0,5,5,5,5,0,0,0,0]], a: [[78,48,62,36,56,22]] },
  poignets:  { v: "p", f: [[110,80,0,90,90,80,50,0,0,0,0],[110,80,0,8,3,6,2,0,0,0,0]], a: [[170,40,176,56,168,70]] },
  murPecs:   { v: "p", m: 150, f: [[105,82,18,90,180,90,180,40,10,-20,-20],[95,80,0,90,180,90,180,0,0,0,0]], a: [[70,58,90,54,110,60]] },
  genouxPoitrine: { v: "p", f: [[130,128,-90,135,120,133,118,215,80,220,85],[130,130,-90,90,90,90,90,90,90,90,90]], a: [[152,92,136,84,118,94]] },
  torsionAllongee: { v: "p", u: "Vue de dessus", f: [[85,75,90,180,180,0,0,10,-80,15,-75],[85,75,90,180,180,0,0,95,-85,100,-80]], a: [[60,92,76,112,100,110]] },
  lateralDebout: { v: "f", f: [[112,84,25,155,155,155,155,0,0,0,0],[120,84,0,178,178,-178,-178,0,0,0,0]], a: [[104,-2,150,-6,172,30]] },
  flexionAssise: { v: "p", f: [[70,132,62,80,80,80,80,92,92,92,92,0],[70,132,0,90,90,90,90,92,92,92,92]], a: [[56,100,90,90,124,108]] },
  figure4:   { v: "p", f: [[130,130,-90,138,122,136,120,195,85,160,20],[130,130,-90,90,90,90,90,160,20,160,20]], a: [[152,116,138,100,120,88]] },
  papillon:  { v: "f", f: [[120,126,0,29,29,-29,-29,75,-90,-75,90,0,0,24],[120,126,0,29,29,-29,-29,60,-95,-60,95]], a: [[172,118,178,130,172,142]] },
  quadDebout: { v: "p", f: [[110,80,0,-20,-30,60,80,-3,-150,0,0],[110,80,0,8,3,6,2,0,0,0,0]], a: [[118,98,134,92,150,98]] },
  ischioCouche: { v: "p", f: [[130,130,-90,135,130,133,128,185,185,90,90],[130,130,-90,90,90,90,90,90,90,90,90]], a: [[150,80,138,64,126,56]] },
  molletMur: { v: "p", m: 163, f: [[105,96,15,90,90,90,90,60,5,-35,-35],[115,80,0,90,90,90,90,0,0,0,0]], a: [[78,100,94,96,110,100]] },
  soleaire:  { v: "p", m: 163, f: [[108,90,15,90,90,90,90,50,0,-30,0],[115,80,0,90,90,90,90,0,0,0,0]], a: [[78,100,94,96,110,100]] },
  straddle:  { v: "f", f: [[120,126,0,10,5,-10,-5,82,82,-82,-82,0,0,22],[120,126,0,10,5,-10,-5,82,82,-82,-82,0,0,34]], a: [[120,100,120,112,120,124]] }
};

/* ============ RETOUR AU CALME : étirements et cohérence cardiaque ============
   Étirements : tableau compact [id, nom, description, muscles]. Cohérence : routines "souffle" (rythme inspire / expire). */
Object.assign(EXERCICES, Object.fromEntries([
  ["grandissement", "Grandissement", "Debout, entrelace les doigts, monte les bras au-dessus de la tête et grandis-toi en te mettant sur la pointe des pieds. Respire profondément, puis relâche.", "Dos, épaules, flancs, mollets"],
  ["nuqueFlex", "Menton vers la poitrine", "Debout, mains derrière la tête, laisse le poids des bras amener doucement le menton vers la poitrine. Aucune traction, juste le poids.", "Nuque, haut du dos"],
  ["nuqueLat", "Inclinaison de la nuque", "Debout, incline la tête sur le côté et pose la main sur le dessus de la tête, sans tirer. L’autre épaule reste basse. Change de côté à mi-temps.", "Trapèzes, côté du cou"],
  ["brasCroise", "Épaule bras croisé", "Amène un bras tendu en travers de la poitrine et maintiens-le avec l’autre bras, au-dessus du coude. Garde l’épaule basse. Change de bras à mi-temps.", "Arrière de l’épaule, haut du dos"],
  ["triceps", "Étirement du triceps", "Lève un bras, plie le coude et pose la main derrière la tête. Avec l’autre main, pousse doucement le coude vers l’arrière. Change de bras à mi-temps.", "Triceps, côté du dos, épaule"],
  ["dosMains", "Ouverture de poitrine", "Debout, joins les mains dans le dos, bras tendus, et lève-les doucement en ouvrant la poitrine. Regard droit devant, épaules basses.", "Pectoraux, avant de l’épaule"],
  ["poignets", "Étirement des poignets", "Bras tendu devant toi, paume vers l’avant, tire doucement les doigts vers toi avec l’autre main. Change de main à mi-temps.", "Avant-bras, poignets"],
  ["murPecs", "Pectoraux contre le mur", "Debout près d’un mur, avant-bras plaqué contre le mur et coude à hauteur d’épaule. Avance doucement le buste jusqu’à sentir l’étirement. Change de bras à mi-temps.", "Pectoraux, avant de l’épaule"],
  ["genouxPoitrine", "Genou contre la poitrine", "Allongé sur le dos, ramène un genou vers la poitrine et tiens-le avec les deux mains, l’autre jambe allongée au sol. L’autre jambe suit juste après.", "Bas du dos, fessiers, hanches"],
  ["torsionAllongee", "Torsion allongée", "Allongé sur le dos, bras en croix, laisse tomber les genoux fléchis d’un côté, regard de l’autre côté. Change de côté à mi-temps.", "Lombaires, obliques, hanches"],
  ["lateralDebout", "Inclinaison latérale", "Debout, un bras levé, incline le buste sur le côté sans te pencher vers l’avant. Respire dans le flanc étiré. Change de côté à mi-temps.", "Flancs, obliques, dorsaux"],
  ["flexionAssise", "Pince assise", "Assis, jambes tendues devant toi, penche-toi vers l’avant en gardant le dos long et va chercher les pieds ou les chevilles. Genoux légèrement souples.", "Ischio-jambiers, bas du dos"],
  ["figure4", "Fessier en 4 allongé", "Allongé sur le dos, pose la cheville sur le genou opposé et tire la cuisse du dessous vers toi. Change de jambe à mi-temps.", "Fessiers, piriforme, hanches"],
  ["papillon", "Papillon", "Assis, plantes de pieds collées, genoux ouverts. Garde le dos long et appuie doucement sur les genoux ou penche le buste vers l’avant.", "Adducteurs, aine, hanches"],
  ["quadDebout", "Quadriceps debout", "Debout, attrape ta cheville derrière toi et amène le talon vers le fessier, genoux serrés, bassin vers l’avant. Change de jambe à mi-temps.", "Quadriceps, fléchisseurs de hanche"],
  ["ischioCouche", "Ischios allongé", "Allongé sur le dos, lève une jambe tendue et tire-la doucement vers toi en tenant l’arrière de la cuisse. Change de jambe à mi-temps.", "Ischio-jambiers, mollets"],
  ["molletMur", "Mollet contre le mur", "Mains au mur, une jambe en arrière tendue, talon bien au sol. Avance le bassin vers le mur. Change de jambe à mi-temps.", "Mollets (gastrocnémiens), tendon d’Achille"],
  ["soleaire", "Mollet genou fléchi", "Mains au mur, jambe arrière légèrement fléchie, talon toujours au sol. Descends le bassin vers le sol. Change de jambe à mi-temps.", "Soléaire, tendon d’Achille, chevilles"],
  ["straddle", "Jambes écartées assis", "Assis, jambes écartées en V, dos long. Penche-toi lentement vers l’avant en avançant les mains devant toi, sans forcer.", "Adducteurs, ischio-jambiers, bas du dos"],
  ["fenteLatTenue", "Fente latérale tenue", "Jambes bien écartées, descends sur une jambe fléchie en gardant l’autre tendue, pied à plat. Change de côté à mi-temps.", "Adducteurs, aine, hanches"],
  ["fenteBasse", "Fente basse, hanche en avant", "Un genou au sol, l’autre pied devant. Redresse le buste, serre le fessier de la jambe arrière et pousse le bassin vers l’avant. Change de jambe à mi-temps.", "Fléchisseurs de hanche, quadriceps"],
  ["enfantStat", "Posture de l’enfant", "À genoux, assis sur les talons, avance les mains loin devant toi et laisse tomber le front vers le sol. Respire dans le dos.", "Dos, épaules, hanches, chevilles"],
  ["chien", "Chien tête en bas", "Mains et pieds au sol, bassin haut en V inversé. Pousse le sol des mains et fais descendre les talons vers le sol. Fléchis un genou puis l’autre pour te délier.", "Mollets, ischios, épaules, dos"]
].map(([id, nom, description, muscles]) => [id, { nom, duree: 30, video: null, description, muscles, etir: true }])));

Object.assign(POSES, POSES_CALME);
POSES.enfantStat = POSES.enfant;
POSES.fenteLatTenue = POSES.lateral;
POSES.fenteBasse = { v: "p", f: [POSES.fente.f[0]], a: [[72,98,92,96,112,100]] };
POSES.chien = { ...POSES.dogpedal, f: [POSES.dogpedal.f[0]], a: [[150,70,142,56,134,46]] };

const ETIR = Object.keys(EXERCICES).filter(id => EXERCICES[id].etir);
Object.assign(ROUTINES, Object.fromEntries([
  ["etNuque", "Nuque et trapèzes", "Cou, trapèzes, épaules", ["grandissement","nuqueFlex","nuqueLat","brasCroise","triceps"]],
  ["etEpaules", "Épaules et bras", "Épaules, triceps, poignets", ["brasCroise","triceps","poignets","dosMains","murPecs"]],
  ["etPecs", "Pectoraux et haut du dos", "Poitrine, épaules, dos", ["murPecs","dosMains","chien","enfantStat","grandissement"]],
  ["etDos", "Dos et lombaires", "Dos, flancs, lombaires", ["enfantStat","catcow","genouxPoitrine","torsionAllongee","lateralDebout","flexionAssise"]],
  ["etHanches", "Hanches et fessiers", "Fessiers, hanches, bas du dos", ["fenteBasse","figure4","papillon","torsionAllongee","enfantStat"]],
  ["etCuisses", "Cuisses et hanches avant", "Quadriceps, fléchisseurs de hanche", ["grandissement","quadDebout","fenteBasse","fenteLatTenue","molletMur"]],
  ["etIschios", "Arrière des cuisses", "Ischio-jambiers, bas du dos", ["cascade","flexionAssise","ischioCouche","chien","genouxPoitrine"]],
  ["etMollets", "Mollets et chevilles", "Mollets, tendon d’Achille, chevilles", ["molletMur","soleaire","chien","ankles","quadDebout"]],
  ["etAdduct", "Adducteurs et aine", "Intérieur des cuisses, hanches", ["papillon","fenteLatTenue","straddle","figure4","enfantStat"]],
  ["etComplet", "Corps entier", "Du haut en bas, en 8 étirements", ["grandissement","cascade","quadDebout","fenteBasse","chien","enfantStat","torsionAllongee","brasCroise"]]
].map(([k, titre, detail, exercices]) => [k, { type: "calme", cat: "etir", titre, detail, couleur: "#2A9D8F", exercices }])));
Object.keys(ROUTINES).filter(k => ROUTINES[k].cat === "etir").forEach(k => CONSEILLES[k] = ETIR);

/* Cohérence cardiaque : séances de respiration guidée. Un bloc = une technique répétée en cycles [libellé, secondes, taille du cercle 0,45 → 1].
   Les durées des blocs s'adaptent proportionnellement à la durée choisie. Sources : voir NOTES.md. */
const BLOCS = {
  libre: { titre: "Respiration libre", voix: "Free breathing", cycle: [["RESPIRE LIBREMENT", 10, 0.7]],
    consigne: "Respire naturellement par le nez, une main sur le ventre. Laisse le souffle ralentir tout seul.",
    resume: "Respiration naturelle, sans compter : on pose le souffle avant et après." },
  coherence: { titre: "Cohérence cardiaque 5-5", voix: "Coherent breathing", cycle: [["INSPIRE", 5, 1], ["EXPIRE", 5, 0.45]],
    consigne: "Inspire 5 secondes, expire 5 secondes, sans pause, par le nez. Le ventre se gonfle à l’inspiration.",
    resume: "6 respirations par minute (0,1 Hz) : rythme où l’effet sur la variabilité cardiaque est en général maximal (Lehrer et Gevirtz, 2014). La respiration lente augmente la variabilité cardiaque (méta-analyse de Laborde et al., 2022, 223 études)." },
  expireLongue: { titre: "Expiration allongée 4-6", voix: "Extended exhale", cycle: [["INSPIRE", 4, 1], ["EXPIRE", 6, 0.45]],
    consigne: "Inspire 4 secondes par le nez, expire 6 secondes lentement, lèvres entrouvertes.",
    resume: "Rythme lent, souvent ressenti comme plus apaisant. Pas d’avantage démontré sur le 5-5 pour la variabilité cardiaque (Meehan et Shaffer, 2024)." },
  soupir: { titre: "Soupir cyclique", voix: "Cyclic sighing", cycle: [["INSPIRE", 3, 0.8], ["ENCORE UN PEU", 2, 1], ["EXPIRE LONGUEMENT", 7, 0.45]],
    consigne: "Inspire par le nez, ajoute une deuxième petite inspiration pour finir de remplir les poumons, puis expire lentement et complètement par la bouche.",
    resume: "5 min par jour pendant 4 semaines : meilleur gain d’humeur positive que la méditation (Balban et al., 2023, 108 adultes, étude préliminaire). Le rythme chronométré ici est un choix de l’appli." },
  carree: { titre: "Respiration carrée 4-4-4-4", voix: "Box breathing", cycle: [["INSPIRE", 4, 1], ["RETIENS", 4, 1], ["EXPIRE", 4, 0.45], ["POUMONS VIDES", 4, 0.45]],
    consigne: "Inspire 4 s, retiens 4 s, expire 4 s, reste poumons vides 4 s. Raccourcis les pauses si tu es mal à l’aise.",
    resume: "Testée par Balban et al. (2023) : améliore l’humeur, mais pas plus que la méditation. Preuves limitées, utile surtout pour se concentrer." }
};
/* Consigne vocale de chaque phase (en anglais, comme le reste de la voix) */
const SOUFFLE_VOIX = { "INSPIRE": "Breathe in", "EXPIRE": "Breathe out", "ENCORE UN PEU": "A little more",
  "EXPIRE LONGUEMENT": "Slowly breathe out", "RETIENS": "Hold", "POUMONS VIDES": "Hold, lungs empty", "RESPIRE LIBREMENT": "Breathe freely" };
const rythme = (i, e) => ({ titre: `Rythme ${(60 / (i + e)).toFixed(1).replace(".", ",")} resp./min`, voix: "Resonance pace", cycle: [["INSPIRE", i, 1], ["EXPIRE", e, 0.45]],
  consigne: "Respire sans forcer à ce rythme et note ton ressenti : plus calme, plus à l’aise ? Garde en tête celui qui te convient le mieux.",
  resume: "La fréquence de résonance se situe en moyenne autour de 6 respirations par minute, avec des différences selon les personnes (Lehrer et Gevirtz, 2014)." });
const SEANCES = [
  ["coherEffort", "Après l’effort", "Séance complète : reprise du souffle, soupir cyclique, cohérence", [[BLOCS.libre, 60], [BLOCS.soupir, 180], [BLOCS.coherence, 240], [BLOCS.libre, 60]],
    "Enchaînement du plus libre au plus guidé : on reprend le souffle, on ralentit avec le soupir cyclique, puis on se cale sur 6 respirations par minute."],
  ["coherFocus", "Concentration et stress", "Séance complète : respiration carrée, soupir cyclique", [[BLOCS.libre, 60], [BLOCS.carree, 180], [BLOCS.soupir, 120], [BLOCS.libre, 60]],
    "Avant une compétition, un examen ou un moment tendu : la respiration carrée occupe l’attention, le soupir cyclique fait redescendre."],
  ["coherSoir", "Fin de journée", "Séance complète : soupir cyclique, expiration allongée", [[BLOCS.libre, 60], [BLOCS.soupir, 180], [BLOCS.expireLongue, 240], [BLOCS.libre, 120]],
    "Pour décompresser le soir. Les preuves sur le sommeil lui-même restent limitées : c’est une aide à la détente."],
  ["coherReso", "Trouver son rythme", "Séance complète : 5 rythmes, de 6,7 à 4,6 respirations par minute", [[rythme(4, 5), 120], [rythme(5, 5), 120], [rythme(5, 6), 120], [rythme(6, 6), 120], [rythme(6, 7), 120]],
    "Inspiré du protocole de la fréquence de résonance (Lehrer et Gevirtz, 2014). Sans capteur cardiaque on ne mesure rien : choisis simplement le rythme où tu te sens le plus à l’aise."],
  ["coherExpress", "Express", "Cohérence 5-5 · 3 min", [[BLOCS.coherence, 180]], "Format court de la cohérence cardiaque."],
  ["coherClassique", "Cohérence classique", "Cohérence 5-5 · 5 min", [[BLOCS.coherence, 300]], "Le format de référence : 6 respirations par minute pendant 5 minutes."],
  ["coherSoupir", "Soupir cyclique", "Soupir cyclique · 5 min", [[BLOCS.soupir, 300]], "Le format testé dans l’étude de Balban et al. (2023) : 5 minutes par jour."],
  ["coherCarree", "Respiration carrée", "4-4-4-4 · 5 min", [[BLOCS.carree, 300]], "Une technique de concentration, à effet modeste sur l’humeur."],
  ["coherRecup", "Expiration allongée", "Inspire 4 s, expire 6 s · 5 min", [[BLOCS.expireLongue, 300]], "Rythme lent à expiration plus longue, simple et confortable."]
];
SEANCES.forEach(([k]) => delete ROUTINES[k]);
Object.assign(ROUTINES, Object.fromEntries(SEANCES.map(([k, titre, detail, blocs, etude]) => {
  const total = blocs.reduce((t, [, d]) => t + d, 0);
  return [k, { type: "calme", cat: "coherence", souffle: true, titre, couleur: "#3B82C4", exercices: [], minutes: Math.round(total / 60), etude,
    detail: detail.includes("·") ? detail : detail + " · " + total / 60 + " min",
    blocs: blocs.map(([b, duree]) => ({ ...b, duree })) }];
})));


/* ============ SÉANCES AVEC MATÉRIEL ============
   Tableau compact [id, nom, matériel, description, muscles]. Pose et nom parlé : POSES_MAT et VOIX. */
Object.assign(EXERCICES, Object.fromEntries([
  ["goblet", "Squat gobelet", "kettlebell, haltère ou disque", "Tiens la charge contre la poitrine, coudes serrés. Descends en squat profond, dos droit, puis remonte en poussant dans les talons.", "Quadriceps, fessiers, gainage"],
  ["kbSwing", "Swing kettlebell", "kettlebell", "Pieds écartés, charnière de hanche : balance la kettlebell entre les jambes puis propulse les hanches vers l’avant. Les bras guident, la force vient des hanches.", "Fessiers, ischio-jambiers, dos, épaules"],
  ["kbPress", "Développé kettlebell une main", "kettlebell", "Kettlebell au creux de l’épaule, gainage serré : pousse à la verticale jusqu’au bras tendu, puis redescends sous contrôle. Change de bras à mi-temps.", "Épaules, triceps, gainage"],
  ["dbPress", "Développé couché haltères", "banc, haltères", "Allongé sur le banc, pieds au sol : descends les haltères à hauteur de poitrine puis pousse jusqu’aux bras tendus.", "Pectoraux, épaules, triceps"],
  ["dbRow", "Rowing haltère un bras", "banc, haltère", "Une main appuyée sur le banc, dos plat : tire l’haltère vers la hanche en gardant le coude près du corps. Change de bras à mi-temps.", "Dorsaux, rhomboïdes, biceps"],
  ["dbShoulder", "Développé épaules haltères", "haltères", "Debout, haltères à hauteur d’épaules : pousse au-dessus de la tête sans cambrer le dos, puis redescends.", "Épaules, triceps"],
  ["dbLunge", "Fentes arrière avec haltères", "haltères", "Un haltère dans chaque main, recule un pied et descends jusqu’à frôler le sol avec le genou, puis reviens. Alterne les jambes.", "Quadriceps, fessiers, ischio-jambiers"],
  ["dbCurl", "Curl haltères", "haltères", "Debout, coudes collés au corps : monte les haltères vers les épaules puis redescends lentement.", "Biceps, avant-bras"],
  ["dbRDL", "Soulevé de terre roumain haltères", "haltères", "Haltères devant les cuisses, jambes presque tendues : recule les hanches en gardant le dos plat, descends sous les genoux puis remonte.", "Ischio-jambiers, fessiers, lombaires"],
  ["dbLateral", "Élévations latérales", "haltères", "Haltères le long du corps : monte les bras sur les côtés jusqu’à l’horizontale, coudes légèrement fléchis, puis redescends lentement.", "Épaules (deltoïdes)"],
  ["bulgare", "Squat bulgare haltères", "banc, haltères", "Pied arrière posé sur le banc, haltères dans les mains : descends à la verticale sur la jambe avant puis remonte. Change de jambe à mi-temps.", "Quadriceps, fessiers, équilibre"],
  ["hipThrust", "Hip thrust sur banc", "banc, disque", "Haut du dos sur le banc, disque sur les hanches : pousse dans les talons pour monter le bassin, serre les fessiers en haut, puis redescends.", "Fessiers, ischio-jambiers"],
  ["stepUp", "Montées sur banc", "banc", "Pose un pied sur le banc et monte en poussant dans la jambe d’appui, genou opposé vers le haut, puis redescends. Change de jambe à mi-temps.", "Quadriceps, fessiers, équilibre"],
  ["dips", "Dips sur banc", "banc", "Mains sur le bord du banc derrière toi, jambes tendues devant : fléchis les coudes à 90° puis repousse.", "Triceps, pectoraux, épaules"],
  ["ezCurl", "Curl barre Z", "barre Z", "Debout, mains sur les prises inclinées, coudes fixes : monte la barre vers la poitrine puis redescends sous contrôle.", "Biceps, avant-bras"],
  ["ezSkull", "Barre au front", "barre Z, banc", "Allongé sur le banc, barre bras tendus : fléchis uniquement les coudes pour descendre la barre vers le front, puis tends les bras.", "Triceps"],
  ["ezRow", "Rowing barre Z buste penché", "barre Z", "Buste penché, dos plat : tire la barre vers le bas du ventre en rapprochant les omoplates, puis redescends.", "Dorsaux, trapèzes, biceps"],
  ["ezBench", "Développé couché barre Z", "barre Z, banc", "Allongé sur le banc, descends la barre jusqu’au bas de la poitrine puis pousse jusqu’aux bras tendus.", "Pectoraux, triceps, épaules"],
  ["poulieTirage", "Tirage vertical poulie haute", "poulie verticale", "Assis, cuisses calées : tire la barre vers le haut de la poitrine en abaissant les coudes, puis remonte lentement.", "Grand dorsal, biceps"],
  ["poulieTriceps", "Extensions triceps à la poulie", "poulie verticale", "Debout, coudes collés aux côtes : pousse la barre vers le bas jusqu’à tendre les bras, puis remonte à hauteur de poitrine.", "Triceps"],
  ["poulieCrunch", "Crunch à la poulie", "poulie verticale", "À genoux face à la poulie, corde près du front : enroule le buste vers les genoux en contractant les abdos, puis reviens.", "Abdominaux"],
  ["poulieBucheron", "Bûcheron à la poulie", "poulie verticale", "De l’épaule vers la hanche opposée, tire en diagonale avec rotation du buste, bras presque tendus. Change de côté à mi-temps.", "Obliques, épaules, gainage"],
  ["bandRow", "Tirage assis à l’élastique", "élastique", "Assis, élastique autour des pieds : tire vers le ventre en serrant les omoplates, puis reviens.", "Dorsaux, biceps"],
  ["bandChest", "Développé poitrine à l’élastique", "élastique", "Élastique passé dans le dos, mains à hauteur de poitrine : tends les bras vers l’avant puis reviens.", "Pectoraux, triceps"],
  ["bandWalk", "Marche latérale à l’élastique", "élastique", "Élastique autour des chevilles ou des genoux, genoux fléchis : fais des pas latéraux sans rejoindre les pieds.", "Moyen fessier, hanches"],
  ["bandPullApart", "Écartement d’élastique", "élastique", "Bras tendus devant toi, élastique entre les mains : écarte les bras en serrant les omoplates puis reviens.", "Arrière des épaules, haut du dos"],
  ["roue", "Roulette abdominale", "roulette", "À genoux, mains sur la roulette : roule vers l’avant en gardant le dos plat et les abdos serrés, puis reviens.", "Abdominaux, épaules, gainage"],
  ["discRussian", "Rotations russes avec disque", "poids simple", "Assis, buste incliné, pieds décollés, un disque entre les mains : tourne de droite à gauche.", "Obliques, abdominaux"],
  ["discWood", "Bûcheron avec disque", "poids simple", "Debout, disque au-dessus d’une épaule : descends-le en diagonale vers la hanche opposée en pivotant. Change de côté à mi-temps.", "Obliques, épaules, hanches"],
  ["tractions", "Tractions", "barre de traction", "Prise large, suspendu bras tendus : monte jusqu’à passer le menton au-dessus de la barre, puis redescends lentement.", "Grand dorsal, biceps, avant-bras"],
  ["chinups", "Tractions prise supination", "barre de traction", "Paumes vers toi, mains à largeur d’épaules : monte jusqu’à passer le menton au-dessus de la barre, puis redescends sous contrôle.", "Biceps, dorsaux"],
  ["relevesJambes", "Relevés de jambes suspendu", "barre de traction", "Suspendu à la barre, monte les jambes tendues jusqu’à l’horizontale sans te balancer, puis redescends lentement.", "Abdominaux bas, fléchisseurs de hanche"],
  ["pike", "Pompes pike", "", "Hanches hautes en V inversé : fléchis les coudes pour amener la tête vers le sol entre les mains, puis repousse.", "Épaules, triceps"],
  ["hollow", "Gainage dos rond", "", "Allongé sur le dos, lombaires collées au sol, bras tendus derrière la tête, jambes tendues décollées : tiens la position.", "Abdominaux profonds"]
].map(([id, nom, mat, description, muscles]) => [id, { nom, duree: 40, video: null, description, muscles: muscles + (mat ? " · " + mat : ""), mat: !!mat }])));

const POSES_MAT = {
  goblet: {v:"p",f:[[95,108,20,15,150,15,150,75,5,72,0],[100,82,0,15,150,15,150,0,0,0,0]],a:[[160,70,162,92,160,112]],o:[["kb","m",8]]},
  kbSwing: {v:"p",f:[[100,82,0,90,90,90,90,0,0,0,0],[80,88,60,9.8,-37.9,9.8,-37.9,25,-5,25,-5]],a:[[100,128,142,132,168,90]],o:[["kb","m",14]]},
  kbPress: {v:"p",f:[[110,82,0,178,178,8,3,0,0,0,0],[110,82,0,20,160,8,3,0,0,0,0]],a:[[150,80,150,40,150,2]],o:[["kb","mn",0]]},
  dbPress: {v:"p",f:[[145,102,-90,180,180,180,180,75,0,75,0],[145,102,-90,70,180,70,180,75,0,75,0]],a:[[96,86,96,66,96,46]],o:[["banc",70,113,110],["barre","m",18]]},
  dbRow: {v:"p",f:[[80,86,70,-40,25,45.9,18.1,15,-8,-12,5],[80,86,70,5,5,45.9,18.1,15,-8,-12,5]],a:[[128,128,118,108,106,92]],o:[["banc",120,113,70],["barre","mn",18]]},
  dbShoulder: {v:"f",f:[[120,82,0,165,185,-165,-185,3,0,-3,0],[120,82,0,105,180,-105,-180,3,0,-3,0]],a:[[172,70,172,40,172,10]],o:[["barre","mn",18],["barre","mf",18]]},
  dbLunge: {v:"p",f:[[115,105,0,0,0,0,0,80,0,-20,-80],[115,82,0,0,0,0,0,0,0,0,0]],a:[[75,70,75,92,75,114]],o:[["barre","mn",18]]},
  dbCurl: {v:"p",f:[[110,82,0,0,160,0,160,0,0,0,0],[110,82,0,0,0,0,0,0,0,0,0]],a:[[140,100,152,78,138,56]],o:[["barre","m",18]]},
  dbRDL: {v:"p",f:[[95,82,65,0,0,0,0,10,-5,10,-5],[95,82,0,0,0,0,0,0,0,0,0]],a:[[108,98,88,96,66,98]],o:[["barre","m",18]]},
  dbLateral: {v:"f",f:[[120,82,0,90,90,-90,-90,3,0,-3,0],[120,82,0,8,8,-8,-8,3,0,-3,0]],a:[[178,84,190,62,182,44]],o:[["barre","mn",18],["barre","mf",18]]},
  bulgare: {v:"p",f:[[112,100,10,0,0,0,0,70,0,-35,-125],[112,86,0,0,0,0,0,20,5,-25,-100]],a:[[168,60,168,84,168,108]],o:[["banc",40,113,70],["barre","m",18]]},
  hipThrust: {v:"p",f:[[120,100,-100,88,88,88,88,75,5,75,5]],a:[[120,76,120,60,120,44]],o:[["banc",30,113,65],["disc","m"]]},
  stepUp: {v:"p",f:[[140,53,0,-25,-10,45,70,0,0,100,-20]],a:[[100,64,100,44,100,24]],o:[["banc",110,113,75]]},
  dips: {v:"p",f:[[110,125,-5,-94.6,-8.1,-94.6,-8.1,75,75,75,75],[106,107,-5,-46.1,-15.1,-46.1,-15.1,60,60,60,60]],a:[[88,92,88,108,88,124]],o:[["banc",30,113,60]]},
  ezCurl: {v:"f",f:[[120,82,0,8,168,-8,-168,3,0,-3,0],[120,82,0,8,3,-8,-3,3,0,-3,0]],a:[[172,100,178,80,172,60]],o:[["barre","m",46]]},
  ezSkull: {v:"p",f:[[145,102,-90,180,180,180,180,75,0,75,0],[145,102,-90,180,-51,180,-51,75,0,75,0]],a:[[120,92,128,72,120,52]],o:[["banc",70,113,110],["barre","m",36]]},
  ezRow: {v:"p",f:[[90,86,65,-45,30,-45,30,10,-5,10,-5],[90,86,65,0,0,0,0,10,-5,10,-5]],a:[[135,118,122,104,108,92]],o:[["barre","m",36]]},
  ezBench: {v:"p",f:[[145,102,-90,180,180,180,180,75,0,75,0],[145,102,-90,70,180,70,180,75,0,75,0]],a:[[96,86,96,66,96,46]],o:[["banc",70,113,110],["barre","m",36]]},
  poulieTirage: {v:"p",f:[[110,108,-10,10,150,10,150,90,0,90,0],[110,108,-10,165,175,165,175,90,0,90,0]],a:[[150,38,152,60,150,82]],o:[["banc",84,118,44],["barre","m",40],["cable","m",[118,-8]]]},
  poulieTriceps: {v:"p",f:[[110,82,0,5,0,5,0,0,0,0,0],[110,82,0,5,120,5,120,0,0,0,0]],a:[[150,60,152,80,150,100]],o:[["barre","m",24],["cable","m",[128,-10]]]},
  poulieCrunch: {v:"p",f:[[100,100,50,20,170,20,170,0,-90,0,-90,8,25,34],[100,100,10,20,170,20,170,0,-90,0,-90]],a:[[150,70,150,86,140,102]],o:[["barre","m",14],["cable","m",[140,-10]]]},
  poulieBucheron: {v:"f",f:[[120,82,0,40,40,40,40,15,0,-15,0],[120,82,0,-150,-150,-150,-150,15,0,-15,0]],a:[[96,20,120,60,150,100]],o:[["barre","m",14],["cable","m",[60,-10]]]},
  bandRow: {v:"p",f:[[80,135,-5,-35,70,-35,70,90,90,90,90],[80,135,-5,90,90,90,90,90,90,90,90]],a:[[130,98,110,104,92,112]],o:[["bande","m","pn"]]},
  bandChest: {v:"p",f:[[110,82,0,90,90,90,90,0,0,0,0],[110,82,0,-20,70,-20,70,0,0,0,0]],a:[[130,40,150,44,168,48]],o:[["bande","m",[22,48]]]},
  bandWalk: {v:"f",f:[[120,84,0,15,5,-15,-5,18,18,-18,-18],[120,84,0,15,5,-15,-5,8,8,-8,-8]],a:[[160,126,176,118,190,126]],o:[["bande","pn","pf"]]},
  bandPullApart: {v:"f",f:[[120,82,0,90,90,-90,-90,3,0,-3,0],[120,82,0,70,-110,-70,110,3,0,-3,0]],a:[[172,60,186,56,200,60],[68,60,54,56,40,60]],o:[["bande","mn","mf"]]},
  roue: {v:"p",f:[[70,105,85,48,48,48,48,0,-90,0,-90],[70,105,60,22,22,22,22,0,-90,0,-90]],a:[[100,90,125,86,146,100]],o:[["roue","m"]]},
  discRussian: {v:"p",f:[[90,128,-30,80,80,80,80,115,115,115,115]],a:[[130,90,152,108,130,126,1]],o:[["disc","m"]]},
  discWood: {v:"f",f:[[120,82,0,40,40,40,40,15,0,-15,0],[120,82,0,-150,-150,-150,-150,15,0,-15,0]],a:[[96,20,120,60,150,100]],o:[["disc","m"]]},
  tractions: {v:"f",f:[[120,48,0,64.9,-156.6,-64.9,156.6,6,0,-6,0],[120,82,0,167.5,159.2,-167.5,-159.2,4,0,-4,0]],a:[[176,60,176,34,176,8]],o:[["tbar",50,190,4]]},
  chinups: {v:"p",f:[[100,50,0,82,-134.2,82,-134.2,-15,-70,-20,-75],[100,82,0,182.6,155.5,182.6,155.5,10,-30,8,-35]],a:[[150,60,150,34,150,8]],o:[["barre","m",20]]},
  relevesJambes: {v:"p",f:[[100,82,0,182.6,155.5,182.6,155.5,90,90,90,90,6,0,34],[100,82,0,182.6,155.5,182.6,155.5,0,0,0,0]],a:[[135,128,152,110,152,84]],o:[["barre","m",20]]},
  pike: {v:"p",f:[[124,106,-128,-100.2,-38.1,-100.2,-38.1,50,50,50,50],[128,97,-122,-58,-58,-58,-58,47,47,47,47]],a:[[88,86,96,100,100,118]]},
  hollow: {v:"p",f:[[130,132,-80,-100,-100,-100,-100,105,105,105,105],[130,132,-90,-90,-90,-90,-90,90,90,90,90]],a:[[190,120,198,106,192,92]]}
};
Object.assign(POSES, POSES_MAT);

const MATOS = Object.keys(EXERCICES).filter(id => EXERCICES[id].mat || id === "pike" || id === "hollow");
Object.assign(ROUTINES, Object.fromEntries([
  ["renfoCourseMat", "course", "renfoCourse", "Renfo course à pied · matériel", "Jambes à l’unilatéral, fessiers, gainage", ["bulgare","stepUp","dbRDL","hipThrust","bandWalk","kbSwing","hollow","relevesJambes"]],
  ["renfoBoxeMat", "boxe", "renfoBoxe", "Renfo boxe · matériel", "Explosivité, pecs, dos, rotation du tronc", ["kbSwing","dbPress","rafaleSac","poulieBucheron","dbRow","traineau","discRussian","tractions","roue","pike"]],
  ["renfoSurfMat", "surf", "renfoSurf", "Renfo surf · matériel", "Dos, épaules, gainage, jambes", ["tractions","poulieTirage","dbRow","pike","bandPullApart","goblet","hollow","discWood"]],
  ["renfoSkiMat", "ski", "renfoSki", "Renfo ski · matériel", "Cuisses, fessiers, gainage, équilibre", ["goblet","bulgare","kbSwing","dbRDL","bandWalk","roue","discRussian","stepUp"]],
  ["renfoHautMat", "haut", "renfoHaut", "Renfo haut du corps · matériel", "Pectoraux, dos, épaules, bras, abdos", ["dbPress","tractions","dbShoulder","ezRow","ezCurl","poulieTriceps","dips","relevesJambes"]],
  ["renfoBasMat", "bas", "renfoBas", "Renfo bas du corps · matériel", "Cuisses, fessiers, ischio-jambiers", ["goblet","dbLunge","dbRDL","hipThrust","bulgare","kbSwing","stepUp","bandWalk"]],
  ["renfoCompletMat", "complet", "renfoComplet", "Renfo haut et bas du corps · matériel", "Tout le corps", ["goblet","dbPress","dbRow","kbSwing","tractions","dbLunge","roue","hollow"]]
].map(([k, grp, base, titre, detail, exercices]) => [k, { type: "seance", grp, mat: true, titre, detail, couleur: ROUTINES[base].couleur, exercices }])));
Object.keys(ROUTINES).filter(k => ROUTINES[k].mat).forEach(k => CONSEILLES[k] = [...new Set([...ROUTINES[k].exercices, ...MATOS, ...CONSEILLES[k.replace("Mat", "")]])]);

/* ============ HANDBALL ET CYCLISME ============ */
Object.assign(EXERCICES, Object.fromEntries([
  ["lancer", "Lancers à vide", 20, "", "Gestuelle de tir sans ballon : bras armé derrière la tête, pas d’appel, puis lance vers l’avant en relâchant. Commence doucement et accélère peu à peu.", "Épaules, coiffe des rotateurs, tronc, hanches"],
  ["pasChasse", "Pas chassés défensifs", 20, "", "Position basse, bras levés comme en défense : déplace-toi en pas chassés à droite puis à gauche, sans croiser les pieds.", "Fessiers, adducteurs, quadriceps, chevilles"],
  ["sautTir", "Sauts de tir en suspension", 20, "", "Deux pas d’élan, impulsion sur une jambe, genou opposé monté et bras armé : simule le tir en l’air, puis réceptionne-toi en douceur sur les deux pieds.", "Mollets, quadriceps, épaules, gainage"],
  ["rotEpaule", "Rotations d’épaules 90/90", 20, "", "Bras écartés à l’horizontale, coudes fléchis à 90° : pivote les avant-bras de bas en haut sans bouger les coudes, lentement.", "Coiffe des rotateurs, épaules"],
  ["bandRotExt", "Rotation externe à l’élastique", 40, "élastique", "Coude à hauteur d’épaule et fléchi à 90°, élastique accroché bas devant toi : pivote l’avant-bras vers le haut sans bouger le coude, puis redescends lentement. Change de bras à mi-temps.", "Coiffe des rotateurs, arrière des épaules"],
  ["pedalage", "Pédalage sur le dos", 20, "", "Allongé sur le dos, jambes en l’air : pédale lentement en faisant de grands cercles, bas du dos collé au sol.", "Hanches, quadriceps, ischio-jambiers, abdos"]
].map(([id, nom, duree, mat, description, muscles]) => [id, { nom, duree, video: null, description, muscles: muscles + (mat ? " · " + mat : ""), mat: !!mat }])));
const POSES_SPORT = {
  lancer: {v:"p",f:[[120,84,18,70,45,-35,-20,25,10,-35,-60],[105,84,-12,-120,165,100,100,25,5,-25,-15]],a:[[70,30,110,6,160,32]]},
  pasChasse: {v:"f",f:[[140,83,0,150,175,-150,-175,12,-5,-12,5],[95,86,0,150,175,-150,-175,30,0,-30,0]],a:[[88,134,118,126,148,134]]},
  sautTir: {v:"p",f:[[130,66,-6,-120,165,150,150,95,5,-10,-20],[88,86,8,-110,160,140,140,20,0,-15,-5]],a:[[188,118,190,92,188,66]]},
  rotEpaule: {v:"f",f:[[120,82,0,90,180,-90,-180,3,0,-3,0],[120,82,0,90,0,-90,0,3,0,-3,0]],a:[[184,72,196,50,184,28],[56,72,44,50,56,28]]},
  bandRotExt: {v:"f",f:[[120,82,0,90,180,-8,-3,3,0,-3,0],[120,82,0,90,0,-8,-3,3,0,-3,0]],a:[[184,72,196,50,184,28]],o:[["bande","mn",[200,142]]]},
  pedalage: {v:"p",f:[[110,128,-90,90,90,90,90,160,95,112,112],[110,128,-90,90,90,90,90,112,112,160,95]],a:[[172,58,196,74,176,98]]}
};
Object.assign(POSES, POSES_SPORT);
MATOS.push("bandRotExt");
Object.keys(CONSEILLES).filter(k => ROUTINES[k] && ROUTINES[k].mat).forEach(k => CONSEILLES[k].push("bandRotExt"));
Object.assign(CATS, {
  handball: { titre: "Handball", detail: "Épaules, coiffe des rotateurs, appuis, sauts", couleur: "#C2410C" },
  cyclisme: { titre: "Cyclisme", detail: "Hanches, jambes, dos", couleur: "#2F855A" }
});
// ordre d'affichage : les nouveaux sports juste après la course à pied
["renfo", "yoga", "surf", "ski"].forEach(k => { const c = CATS[k]; delete CATS[k]; CATS[k] = c; });
/* [clé, cat ou grp, titre, détail, exercices, conseillés en plus] ; les clés ...Mat sont les séances avec matériel */
[
  ["handball", "handball", "Handball", "Épaules, appuis, sauts", ["legfwd","legside","armcircles","rotEpaule","pasChasse","lancer","skater","sautTir"], ["armcross","scap","openbook","thread","lateral","kneeup","heelkick","calfraise","footwork","twist","wgs","hip9090","ankles"]],
  ["cyclisme", "cyclisme", "Cyclisme", "Dos, hanches, jambes", ["catcow","openbook","hip9090","legfwd","pont","pedalage","fente","calfraise"], ["wgs","scorpion","dogpedal","thread","hydrant","sumo","legside","ankles","kneeup","heelkick","cascade","bird"]],
  ["renfoHandball", "handball", "Renfo handball", "Sauts, appuis latéraux, épaules, gainage", ["squatsaute","skater","pompes","superman","fentesalt","russian","planchelat","pontuni"], ["squat","burpees","planche","planchetouch","climbers","pompesserrees","deadbug","chaise","mollet1","scap","tspin","rotEpaule"]],
  ["renfoCyclisme", "cyclisme", "Renfo cyclisme", "Cuisses, fessiers, dos, gainage", ["squat","chaise","fentesalt","pontuni","mollet1","planche","superman","deadbug"], ["squatsaute","planchelat","bird","skater","pont","rdl","climbers","russian"]],
  ["renfoHandballMat", "handball", "Renfo handball · matériel", "Puissance, épaules protégées, rotation du tronc", ["kbSwing","bulgare","dbRow","bandRotExt","poulieBucheron","dbRDL","bandPullApart","roue"], []],
  ["renfoCyclismeMat", "cyclisme", "Renfo cyclisme · matériel", "Cuisses, fessiers, chaîne postérieure, dos", ["goblet","bulgare","dbRDL","hipThrust","stepUp","dbRow","roue","hollow"], []]
].forEach(([k, g, titre, detail, exercices, plus]) => {
  const seance = k.startsWith("renfo"), mat = k.endsWith("Mat");
  ROUTINES[k] = seance ? { type: "seance", grp: g, mat, titre, detail, couleur: CATS[g].couleur, exercices } : { cat: g, titre, detail, couleur: CATS[g].couleur, exercices };
  CONSEILLES[k] = [...new Set([...exercices, ...(mat ? [...MATOS, ...CONSEILLES[k.replace("Mat", "")]] : plus)])];
});

const VOIX_SALLE = {};
/* ============ SPORTS : mouvements spécifiques (boxe, puis les autres sports) ============
   [id, durée, matériel FR, EN, nom FR, EN, muscles FR, EN, description FR, EN, pose empruntée, consigne dite FR, EN] */
{
  const EN = LANGUE === "en";
  [["burpeeSprawl", 40, "", "", "Burpee esquive au sol", "Sprawl burpee", "Jambes, hanches, épaules, cardio", "Legs, hips, shoulders, cardio", "En garde, pose les mains au sol et lance les jambes loin en arrière en laissant descendre les hanches près du sol, puis ramène les pieds et reviens tout de suite en garde.", "From your guard, put your hands down and shoot your legs far back, letting your hips drop close to the floor, then bring your feet in and get straight back into your guard.", "burpees",
     "En garde, pieds écartés comme les épaules.|Mains au sol, lance les jambes en arrière et descends les hanches. Ramène les pieds et reviens en garde.|Garde les bras solides et le regard devant toi. Remonte les mains au menton à chaque fois.", "In your guard, feet shoulder-width apart.|Hands down, shoot your legs back and drop your hips. Bring your feet in and return to your guard.|Keep your arms strong and your eyes forward. Bring your hands back to your chin every time."],
   ["genouxMur", 30, "", "", "Montées de genoux au mur", "Wall knee drives", "Fléchisseurs de hanche, mollets, gainage, cardio", "Hip flexors, calves, core, cardio", "Mains à plat contre un mur, bras tendus, corps incliné et gainé : monte les genoux l’un après l’autre le plus vite possible, sur l’avant du pied.", "Hands flat on a wall, arms straight, body leaning and braced: drive your knees up one after the other as fast as you can, on the balls of your feet.", "climbers",
     "Mains au mur, bras tendus, corps incliné en une seule ligne.|Monte les genoux l’un après l’autre, le plus vite possible.|Reste sur l’avant du pied. Les hanches ne reculent pas et le dos reste droit.", "Hands on the wall, arms straight, body leaning in one line.|Drive your knees up one after the other, as fast as you can.|Stay on the balls of your feet. Hips do not drift back and your back stays straight."],
   ["chasseGarde", 30, "", "", "Pas chassés et direct", "Shuffle and jab", "Mollets, fessiers, épaules, coordination", "Calves, glutes, shoulders, coordination", "En garde, fais trois pas chassés rapides d’un côté, arrête-toi net sur des appuis solides et lance un direct, puis repars de l’autre côté.", "In your guard, take three quick shuffle steps to one side, stop dead on solid feet and throw a jab, then go back the other way.", "pasChasse",
     "En garde, genoux souples, poids sur l’avant des pieds.|Trois pas chassés rapides, un arrêt net, puis un direct. Repars de l’autre côté.|Ne croise jamais les pieds. Les mains restent hautes pendant le déplacement.", "In your guard, knees soft, weight on the balls of your feet.|Three quick shuffle steps, a dead stop, then a jab. Go back the other way.|Never cross your feet. Hands stay up while you move."],
   ["rafaleSac", 30, "sac de frappe", "heavy bag", "Rafale basse-haute au sac", "Body-head bag flurry", "Épaules, tronc, jambes, cardio", "Shoulders, trunk, legs, cardio", "Face au sac, enchaîne sans pause deux coups au corps en fléchissant les jambes, puis deux coups à la tête en te redressant.", "Facing the bag, throw two body shots with your knees bent, then two head shots as you rise, without a pause.", "shadow",
     "En garde face au sac, à distance de bras.|Deux coups au corps en pliant les jambes, puis deux coups à la tête. Enchaîne sans pause.|Descends avec les jambes, pas avec le dos. Ramène la main au menton après chaque frappe.", "In your guard facing the bag, at arm’s length.|Two body shots with your knees bent, then two head shots. Keep going without a pause.|Go down with your legs, not your back. Bring your hand back to your chin after every punch."],
   ["traineau", 30, "traîneau", "sled", "Poussée de traîneau", "Sled push", "Quadriceps, fessiers, mollets, gainage", "Quads, glutes, calves, core", "Mains sur les montants, bras tendus, dos plat et corps incliné : pousse le traîneau par petits pas puissants, sans t’arrêter.", "Hands on the posts, arms straight, back flat and body leaning: push the sled with short powerful steps, without stopping.", "",
     "Mains sur les montants, bras tendus, dos plat, corps incliné.|Pousse le traîneau par petits pas puissants, sans t’arrêter.|Garde les hanches basses et le regard vers le sol devant toi. Ne laisse pas le dos s’arrondir.", "Hands on the posts, arms straight, back flat, body leaning.|Push the sled with short powerful steps, without stopping.|Keep your hips low and your eyes on the floor ahead. Do not let your back round."],
   ["splitStep", 30, "", "", "Split-step et départ", "Split-step and first step", "Mollets, fessiers, réactivité", "Calves, glutes, reaction speed", "Pieds écartés, fais un petit saut sur place, puis à la réception pars de deux pas vifs sur le côté et reviens au centre. Alterne les côtés.", "Feet apart, do a small hop on the spot, then as you land push off with two quick steps to the side and come back to the centre. Alternate sides.", "pasChasse", "Pieds un peu plus écartés que les épaules, genoux souples.|Fais un petit saut, et à la réception pars de deux pas vifs sur le côté, puis reviens au centre.|Reste sur l’avant des pieds et garde le buste face à toi.", "Feet slightly wider than your shoulders, knees soft.|Do a small hop, and as you land take two quick steps to the side, then come back to the centre.|Stay on the balls of your feet and keep your chest facing forward."],
   ["fenteEtoile", 40, "", "", "Fentes en étoile", "Star lunges", "Quadriceps, fessiers, adducteurs, équilibre", "Quads, glutes, adductors, balance", "Debout sur une jambe, fais avec l’autre une fente vers l’avant, puis sur le côté, puis en arrière en croisant, en revenant au centre à chaque fois. Change de jambe à mi-temps.", "Standing on one leg, lunge with the other forward, then to the side, then back and across, returning to the centre each time. Switch legs halfway.", "lateral", "Debout, poids sur une jambe, mains sur les hanches.|Fente vers l’avant, puis sur le côté, puis en arrière en croisant. Reviens au centre à chaque fois.|Le genou de la jambe d’appui reste aligné avec le pied, sans rentrer vers l’intérieur.", "Standing, weight on one leg, hands on hips.|Lunge forward, then to the side, then back and across. Return to the centre each time.|The knee of the standing leg stays in line with the foot, without caving in."],
   ["rotElastique", 40, "élastique", "resistance band", "Rotation du tronc à l’élastique", "Band trunk rotation", "Obliques, tronc, épaules", "Obliques, trunk, shoulders", "Élastique accroché sur le côté à hauteur de poitrine, bras tendus : tourne le buste en pivotant sur le pied arrière, comme un coup droit, puis reviens lentement. Change de côté à mi-temps.", "Band anchored to the side at chest height, arms straight: rotate your torso, pivoting on the back foot like a forehand, then return slowly. Switch sides halfway.", "twist", "De profil par rapport à l’attache, bras tendus devant la poitrine.|Tourne le buste en pivotant sur le pied arrière, puis reviens lentement.|Ce sont les hanches et le buste qui tournent, pas seulement les bras.", "Side-on to the anchor, arms straight in front of your chest.|Rotate your torso, pivoting on the back foot, then come back slowly.|Your hips and torso turn, not just your arms."],
   ["bandejaVide", 30, "", "", "Bandeja et smash à vide", "Shadow bandeja and smash", "Épaules, tronc, jambes", "Shoulders, trunk, legs", "Recule en pas chassés, arme le bras au-dessus de l’épaule et frappe dans le vide : une bandeja, puis un smash. Reviens vers l’avant entre chaque coup.", "Shuffle back, cock your arm above your shoulder and hit the air: a bandeja, then a smash. Move forward again between shots.", "frappeVide", "De profil, raquette ou main armée au-dessus de l’épaule.|Recule en pas chassés, frappe une bandeja, puis un smash, et reviens vers l’avant.|Ne recule jamais en courant de dos : toujours en pas chassés.", "Side-on, racket or hand cocked above your shoulder.|Shuffle back, hit a bandeja, then a smash, and come forward again.|Never run backwards facing away: always shuffle."],
   ["receptionSaut", 30, "", "", "Saut et réception stabilisée", "Jump and stick landing", "Quadriceps, fessiers, genoux stables", "Quads, glutes, stable knees", "Saute à la verticale, puis reçois-toi sur les deux pieds, genoux fléchis et alignés avec les pieds, et tiens la position deux secondes avant de repartir.", "Jump straight up, then land on both feet, knees bent and in line with your feet, and hold the position for two seconds before going again.", "squatsaute", "Pieds écartés comme les hanches, bras le long du corps.|Saute, reçois-toi genoux fléchis, et tiens la position deux secondes.|À la réception, les genoux ne rentrent pas vers l’intérieur. Atterris en silence.", "Feet hip-width apart, arms by your sides.|Jump, land with bent knees, and hold for two seconds.|On landing, your knees do not cave in. Land quietly."],
   ["pasDefensifs", 30, "", "", "Pas défensifs", "Defensive slides", "Fessiers, adducteurs, cuisses", "Glutes, adductors, thighs", "Position basse, bras écartés : glisse de trois pas d’un côté sans croiser les pieds, recule en diagonale, puis repars de l’autre côté.", "Low stance, arms wide: slide three steps to one side without crossing your feet, drop back diagonally, then go the other way.", "pasChasse", "Position basse, pieds écartés, bras ouverts.|Trois pas glissés d’un côté, un recul en diagonale, puis repars de l’autre côté.|Reste bas pendant tout le déplacement et ne croise jamais les pieds.", "Low stance, feet wide, arms open.|Three sliding steps to one side, a diagonal drop back, then go the other way.|Stay low the whole time and never cross your feet."],
   ["sprintNavette", 30, "", "", "Sprint aller-retour", "Shuttle sprint", "Jambes, cardio, changements de direction", "Legs, cardio, changes of direction", "Sprinte sur cinq mètres, pose un pied au-delà de la ligne en abaissant le bassin, fais demi-tour et sprinte au retour.", "Sprint five metres, plant one foot beyond the line while lowering your hips, turn and sprint back.", "kneeup", "Debout derrière une ligne, une autre ligne à cinq mètres.|Sprinte, pose un pied après la ligne, fais demi-tour et sprinte au retour.|Freine en abaissant le bassin, pas en te penchant en arrière.", "Standing behind a line, another line five metres away.|Sprint, plant a foot past the line, turn and sprint back.|Brake by lowering your hips, not by leaning back."],
   ["nordique", 30, "", "", "Nordic ischios", "Nordic hamstring curl", "Ischio-jambiers", "Hamstrings", "À genoux, chevilles bloquées sous un meuble lourd ou tenues par un partenaire, corps droit des genoux à la tête : descends vers l’avant le plus lentement possible en freinant avec l’arrière des cuisses, rattrape-toi avec les mains et remonte en poussant.", "Kneeling, ankles held under a heavy piece of furniture or by a partner, body straight from knees to head: lower yourself forward as slowly as you can, braking with the back of your thighs, catch yourself with your hands and push back up.", "", "À genoux sur un tapis, chevilles bloquées, corps droit des genoux à la tête.|Descends vers l’avant le plus lentement possible, rattrape-toi avec les mains, puis remonte en poussant.|Garde les hanches dans l’alignement : le corps reste une planche du début à la fin.", "Kneeling on a mat, ankles anchored, body straight from knees to head.|Lower forward as slowly as you can, catch yourself with your hands, then push back up.|Keep your hips in line: your body stays like a plank from start to finish."],
   ["lancerMedecine", 30, "médecine-ball", "medicine ball", "Lancer de médecine-ball contre un mur", "Medicine ball wall throw", "Épaules, tronc, puissance", "Shoulders, trunk, power", "Face à un mur, ballon au-dessus de la tête, avance le pied opposé et lance fort contre le mur comme un tir, rattrape et recommence. Change de bras à mi-temps.", "Facing a wall, ball above your head, step forward with the opposite foot and throw hard against the wall like a shot, catch it and repeat. Switch arms halfway.", "lancer", "Face au mur à deux mètres, ballon tenu au-dessus de la tête.|Avance le pied opposé et lance fort contre le mur, rattrape, recommence.|Le mouvement part des jambes et du tronc, le bras finit le geste.", "Two metres from the wall, ball held above your head.|Step forward with the opposite foot and throw hard against the wall, catch, repeat.|The movement starts from the legs and trunk, the arm finishes it."],
   ["sautsRebond", 30, "", "", "Sauts répétés au rebond", "Repeated rebound jumps", "Mollets, quadriceps, détente", "Calves, quads, jumping power", "Enchaîne des sauts verticaux en touchant le sol le moins longtemps possible, comme un ressort, bras qui montent à chaque saut.", "Chain vertical jumps, touching the ground as briefly as possible like a spring, arms rising on every jump.", "sautContre", "Pieds écartés comme les hanches, bras le long du corps.|Saute, et dès que tu touches le sol, rebondis aussitôt vers le haut.|Reste sur l’avant des pieds, talons qui ne touchent pas le sol.", "Feet hip-width apart, arms by your sides.|Jump, and as soon as you touch the ground, bounce straight back up.|Stay on the balls of your feet, heels off the ground."],
   ["fouleesBond", 30, "", "", "Foulées bondissantes", "Bounding", "Fessiers, mollets, puissance de foulée", "Glutes, calves, stride power", "Cours en faisant de grandes foulées bondies : pousse fort sur la jambe d’appui, monte le genou opposé et reste en l’air le plus longtemps possible.", "Run with big bounding strides: push hard off the standing leg, drive the opposite knee up and stay in the air as long as you can.", "askip", "Debout, prêt à courir, bras fléchis.|Grandes foulées bondies : pousse fort derrière toi et monte le genou devant.|Reçois-toi sous ton bassin, pas loin devant toi.", "Standing, ready to run, arms bent.|Big bounding strides: push hard behind you and drive the knee forward.|Land under your hips, not far in front of you."],
   ["jambesTendues", 30, "", "", "Foulées jambes tendues", "Straight-leg bounds", "Ischios, mollets, coordination", "Hamstrings, calves, coordination", "Avance en lançant les jambes presque tendues devant toi et en griffant le sol sous le bassin, sur l’avant du pied, bras qui accompagnent.", "Move forward kicking almost straight legs out in front and clawing the ground under your hips, on the balls of your feet, arms following.", "heelkick", "Debout, buste droit, bras fléchis.|Lance une jambe presque tendue devant toi et griffe le sol sous le bassin, puis l’autre.|Reste grand, buste droit, sans t’asseoir en arrière.", "Standing, chest tall, arms bent.|Swing one almost straight leg forward and claw the ground under your hips, then the other.|Stay tall, chest upright, without sitting back."],
   ["squatUni", 40, "", "", "Squat sur une jambe assisté", "Assisted single-leg squat", "Quadriceps, fessiers, équilibre", "Quads, glutes, balance", "Tiens-toi d’une main à un appui, une jambe tendue devant : descends sur l’autre jambe en gardant le genou aligné avec le pied, puis remonte. Change de jambe à mi-temps.", "Hold a support with one hand, one leg straight in front: lower yourself on the other leg keeping the knee in line with the foot, then stand up. Switch legs halfway.", "squat", "Debout sur une jambe, une main sur un appui, l’autre jambe tendue devant.|Descends le plus bas possible en contrôle, puis remonte.|Le genou reste aligné avec le pied et le talon reste au sol.", "Standing on one leg, one hand on a support, the other leg straight in front.|Lower as far as you can with control, then stand up.|The knee stays in line with the foot and the heel stays down."],
   ["tractionBloquee", 30, "barre de traction", "pull-up bar", "Traction bloquée", "Lock-off pull-up", "Dos, biceps, avant-bras", "Back, biceps, forearms", "Monte en traction, puis bloque-toi menton au-dessus de la barre, puis bras à angle droit, puis presque tendus, quelques secondes à chaque hauteur.", "Pull up, then hold with your chin above the bar, then with arms at a right angle, then almost straight, a few seconds at each height.", "tractions", "Suspendu à la barre, mains écartées comme les épaules.|Monte, puis bloque-toi en haut, à mi-hauteur et presque en bas, quelques secondes à chaque fois.|Épaules basses, loin des oreilles, et pas d’élan avec les jambes.", "Hanging from the bar, hands shoulder-width apart.|Pull up, then hold at the top, halfway and near the bottom, a few seconds each time.|Shoulders down, away from your ears, and no swinging with the legs."],
   ["doigtsElastique", 40, "élastique", "resistance band", "Ouverture des doigts à l’élastique", "Band finger extensions", "Extenseurs des doigts, avant-bras", "Finger extensors, forearms", "Passe un petit élastique autour des doigts serrés et ouvre la main au maximum, tiens une seconde, referme lentement. Change de main à mi-temps.", "Loop a small band around your gathered fingers and open your hand as wide as you can, hold for a second, close slowly. Switch hands halfway.", "", "Coude plié, élastique autour des doigts serrés.|Ouvre la main au maximum, tiens une seconde, puis referme lentement.|Le poignet reste droit pendant tout le mouvement.", "Elbow bent, band around your gathered fingers.|Open your hand as wide as you can, hold for a second, then close slowly.|Keep your wrist straight throughout."],
   ["streamline", 40, "", "", "Gainage en flèche", "Streamline hold", "Épaules, dos, gainage", "Shoulders, back, core", "Allongé sur le ventre, bras tendus au-dessus de la tête mains l’une sur l’autre, décolle légèrement bras et jambes et tiens le corps long et gainé comme une flèche.", "Lying face down, arms straight overhead with one hand on the other, lift your arms and legs slightly and hold your body long and braced like an arrow.", "superman", "À plat ventre, bras tendus au-dessus de la tête, une main sur l’autre.|Décolle légèrement bras et jambes et tiens le corps long, comme une flèche.|Garde la nuque dans l’alignement, regard vers le sol.", "Face down, arms straight overhead, one hand on the other.|Lift your arms and legs slightly and hold your body long, like an arrow.|Keep your neck in line, eyes on the floor."],
   ["nageElastique", 40, "élastique", "resistance band", "Tirage de nage à l’élastique", "Band swim pull", "Grand dorsal, épaules, triceps", "Lats, shoulders, triceps", "Penché en avant, élastique fixé devant toi, bras tendus : tire jusqu’aux cuisses en gardant les coudes hauts, comme une traction de crawl, puis reviens lentement.", "Leaning forward, band anchored in front, arms straight: pull down to your thighs keeping your elbows high, like a front-crawl stroke, then return slowly.", "crawlSec", "Penché en avant, dos plat, élastique tenu bras tendus devant toi.|Tire jusqu’aux cuisses, coudes hauts, puis reviens lentement.|Le dos reste plat, ce sont les bras qui travaillent.", "Leaning forward, flat back, band held with straight arms in front.|Pull down to your thighs, elbows high, then return slowly.|Your back stays flat, your arms do the work."],
   ["squatFreine", 40, "", "", "Squat freiné", "Slow eccentric squat", "Quadriceps, fessiers", "Quads, glutes", "Descends en squat en comptant lentement jusqu’à quatre, marque une pause en bas, puis remonte normalement.", "Lower into a squat while slowly counting to four, pause at the bottom, then stand up at normal speed.", "skisquat", "Pieds écartés comme les épaules, bras devant toi.|Descends en quatre secondes, marque une pause, puis remonte.|Le poids reste sur tout le pied, genoux dans l’axe des orteils.", "Feet shoulder-width apart, arms in front.|Lower over four seconds, pause, then stand up.|Weight stays on the whole foot, knees in line with your toes."],
   ["fenteSautee", 30, "", "", "Fentes sautées", "Jump lunges", "Quadriceps, fessiers, explosivité", "Quads, glutes, explosiveness", "En fente, saute et change de jambe en l’air, puis reçois-toi en douceur dans la fente opposée.", "From a lunge, jump and switch legs in the air, then land softly in the opposite lunge.", "fentesalt", "En fente, buste droit, genou arrière près du sol.|Saute, change de jambe en l’air et reçois-toi dans l’autre fente.|Atterris en douceur et garde le genou avant au-dessus du pied.", "In a lunge, chest upright, back knee close to the floor.|Jump, switch legs in the air and land in the other lunge.|Land softly and keep the front knee over the foot."],
   ["rotationSurf", 30, "", "", "Rotation en position de surf", "Surf stance rotations", "Obliques, jambes, équilibre", "Obliques, legs, balance", "En position de surf, jambes fléchies et pieds écartés, tourne le buste et les bras d’un côté puis de l’autre comme pour un virage, sans bouger les pieds.", "In surf stance, knees bent and feet wide, rotate your torso and arms one way then the other as if turning, without moving your feet.", "surfsquat", "Position de surf : pieds écartés, genoux fléchis, bras ouverts.|Tourne le buste et les bras d’un côté, puis de l’autre, comme pour un virage.|Les pieds restent fixes et les genoux fléchis.", "Surf stance: feet wide, knees bent, arms open.|Rotate your torso and arms one way, then the other, as if turning.|Your feet stay put and your knees stay bent."],
   ["equilibreSurf", 40, "", "", "Équilibre en position de surf", "Surf stance balance", "Chevilles, genoux, gainage", "Ankles, knees, core", "En position de surf, transfère lentement le poids sur le pied avant puis sur le pied arrière, en tenant chaque côté quelques secondes, bras écartés pour l’équilibre.", "In surf stance, slowly shift your weight onto the front foot then onto the back foot, holding each side a few seconds, arms out for balance.", "surfsquat", "Position de surf, genoux fléchis, bras écartés.|Transfère lentement le poids sur le pied avant, tiens, puis sur le pied arrière, tiens.|Reste bas et regarde devant toi, pas tes pieds.", "Surf stance, knees bent, arms out.|Slowly shift your weight onto the front foot, hold, then onto the back foot, hold.|Stay low and look ahead, not at your feet."],
   ["teaser", 40, "", "", "Teaser", "Teaser", "Abdominaux, fléchisseurs de hanche", "Abs, hip flexors", "Allongé sur le dos, enroule le buste en levant les jambes jusqu’à former un V, bras tendus vers les pieds, puis redescends en déroulant lentement.", "Lying on your back, roll your torso up while lifting your legs into a V, arms reaching towards your feet, then roll back down slowly.", "rollUp", "Sur le dos, bras tendus au-dessus de la tête, jambes tendues.|Enroule le buste et lève les jambes en V, bras vers les pieds, puis redescends lentement.|Déroule la colonne vertèbre par vertèbre, sans te laisser tomber.", "On your back, arms overhead, legs straight.|Roll up and lift your legs into a V, arms towards your feet, then lower slowly.|Roll down one vertebra at a time, without dropping."],
   ["swimmingPil", 40, "", "", "Swimming (Pilates)", "Swimming (Pilates)", "Dos, fessiers, épaules", "Back, glutes, shoulders", "À plat ventre, décolle bras et jambes et fais de petits battements alternés, bras et jambe opposés ensemble, en gardant la nuque longue.", "Face down, lift your arms and legs and flutter them alternately, opposite arm and leg together, keeping your neck long.", "superman", "À plat ventre, bras tendus devant, jambes tendues.|Décolle bras et jambes et fais de petits battements, bras et jambe opposés ensemble.|Nuque longue, regard vers le sol, ventre légèrement rentré.", "Face down, arms straight in front, legs straight.|Lift your arms and legs and make small flutters, opposite arm and leg together.|Long neck, eyes on the floor, belly slightly drawn in."],
   ["ciseaux", 40, "", "", "Ciseaux", "Scissors", "Abdominaux, ischios", "Abs, hamstrings", "Sur le dos, tête et épaules décollées, jambes tendues vers le plafond : descends une jambe vers le sol en tenant l’autre, puis change, en gardant le bas du dos collé au sol.", "On your back, head and shoulders lifted, legs straight up: lower one leg towards the floor while holding the other, then switch, keeping your lower back pressed down.", "hundred", "Sur le dos, tête et épaules décollées, jambes tendues vers le plafond.|Descends une jambe vers le sol en tenant l’autre, puis change.|Le bas du dos reste collé au sol du début à la fin.", "On your back, head and shoulders lifted, legs straight up.|Lower one leg towards the floor while holding the other, then switch.|Your lower back stays pressed down from start to finish."]
  ].forEach(([id, duree, matFr, matEn, nomFr, nomEn, musFr, musEn, descFr, descEn, pose, vFr, vEn]) => {
    const mat = EN ? matEn : matFr;
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: (EN ? musEn : musFr) + (mat ? " · " + mat : ""), mat: !!mat };
    VOIX_SALLE[id] = nomEn; if (POSES[pose]) POSES[id] = POSES[pose];
    if (typeof CONSIGNES !== "undefined") CONSIGNES[id] = [vFr, vEn];
  });
}

Object.keys(EXERCICES).forEach(id => EXERCICES[id].mat && !MATOS.includes(id) && MATOS.push(id));

/* ============ SALLE DE MUSCULATION ============
   Exercices sur machines et poids libres des salles grand public. Séances jouées en séries (mode "salle"). */
Object.assign(EXERCICES, Object.fromEntries([
  ["squatBarre", "Squat à la barre", "barre, rack", "Barre posée sur le haut du dos, pieds largeur d’épaules : descends en poussant les hanches en arrière, cuisses au moins parallèles, dos droit, puis remonte.", "Quadriceps, fessiers, gainage", "Back squat"],
  ["presseCuisses", "Presse à cuisses", "presse", "Dos bien plaqué au dossier, pieds largeur de hanches sur la plateforme : descends jusqu’à 90° aux genoux puis pousse sans verrouiller les genoux.", "Quadriceps, fessiers", "Leg press"],
  ["legExt", "Leg extension", "machine", "Assis, boudin calé au-dessus des chevilles : tends les jambes jusqu’à l’horizontale, marque une seconde, puis redescends lentement.", "Quadriceps", "Leg extension"],
  ["legCurl", "Leg curl allongé", "machine", "Allongé sur le ventre, boudin derrière les chevilles : ramène les talons vers les fesses sans décoller le bassin, puis redescends lentement.", "Ischio-jambiers", "Lying leg curl"],
  ["molletsMachine", "Mollets à la machine", "machine", "Épaules sous les coussins, avant des pieds sur la marche : monte le plus haut possible sur la pointe des pieds puis descends sous la marche pour étirer.", "Mollets", "Standing calf raise"],
  ["abducteurs", "Abducteurs à la machine", "machine", "Assis, coussins contre l’extérieur des genoux : écarte les cuisses en contrôlant, puis reviens sans laisser les poids se toucher.", "Moyen fessier, hanches", "Hip abduction machine"],
  ["souleveTerre", "Soulevé de terre", "barre", "Barre au-dessus du milieu des pieds, dos plat, bras tendus : pousse dans le sol en gardant la barre contre les jambes jusqu’à être debout, puis redescends sous contrôle.", "Fessiers, ischio-jambiers, dos, trapèzes", "Deadlift"],
  ["rowPoulie", "Tirage horizontal à la poulie", "poulie basse", "Assis, pieds calés, dos droit : tire la poignée vers le nombril en serrant les omoplates, puis tends les bras sans arrondir le dos.", "Dorsaux, rhomboïdes, biceps", "Seated cable row"],
  ["pullover", "Pullover à la poulie", "poulie haute", "Debout, buste légèrement penché, bras presque tendus : descends la barre vers les cuisses en gardant les coudes fixes, puis remonte lentement.", "Grand dorsal, triceps longs", "Straight arm pulldown"],
  ["facePull", "Face pull", "poulie, corde", "Corde à hauteur du visage : tire vers le front en écartant les mains, coudes hauts, puis reviens bras tendus.", "Arrière des épaules, coiffe des rotateurs, trapèzes", "Face pull"],
  ["benchBarre", "Développé couché à la barre", "barre, banc, rack", "Allongé, omoplates serrées, pieds au sol : descends la barre au bas des pectoraux puis pousse jusqu’aux bras tendus. Avec une charge lourde, fais-toi assister.", "Pectoraux, triceps, avant des épaules", "Barbell bench press"],
  ["inclineHalteres", "Développé incliné haltères", "banc incliné, haltères", "Banc incliné à 30-45° : descends les haltères à hauteur du haut des pectoraux puis pousse vers le haut en les rapprochant.", "Haut des pectoraux, épaules, triceps", "Incline dumbbell press"],
  ["chestPress", "Chest press à la machine", "machine", "Assis, poignées à hauteur de poitrine : pousse vers l’avant jusqu’aux bras tendus, puis reviens lentement sans décoller le dos.", "Pectoraux, triceps", "Machine chest press"],
  ["pecDeck", "Pec deck (butterfly)", "machine", "Assis, bras ouverts sur les coussins : referme les bras devant toi en serrant les pectoraux, puis rouvre lentement.", "Pectoraux", "Pec deck fly"],
  ["crossover", "Écarté à la poulie vis-à-vis", "poulies hautes", "Debout entre les deux poulies, bras ouverts, coudes légèrement fléchis : ramène les mains devant le bassin en arc de cercle, puis rouvre.", "Pectoraux", "Cable crossover"],
  ["militaire", "Développé militaire", "barre", "Debout, gainé, barre au niveau du menton : pousse au-dessus de la tête jusqu’aux bras tendus sans cambrer, puis redescends.", "Épaules, triceps, gainage", "Overhead press"],
  ["oiseau", "Oiseau à la machine", "machine", "Assis face à la machine, bras tendus devant toi : ouvre les bras vers l’arrière en serrant les omoplates, puis reviens.", "Arrière des épaules, haut du dos", "Reverse fly"],
  ["shrugs", "Haussements d’épaules", "haltères", "Debout, haltères le long du corps : monte les épaules vers les oreilles, tiens une seconde, puis relâche sans rouler les épaules.", "Trapèzes", "Dumbbell shrugs"],
  ["curlMarteau", "Curl marteau", "haltères", "Debout, paumes face à face, coudes collés au corps : monte l’haltère vers l’épaule puis redescends. Alterne les bras.", "Biceps, avant-bras", "Hammer curl"],
  ["extNuque", "Extension triceps à la nuque", "haltère", "Haltère tenu à deux mains au-dessus de la tête : descends-le derrière la nuque en fléchissant les coudes, puis tends les bras.", "Triceps", "Overhead triceps extension"]
].map(([id, nom, mat, description, muscles, voix]) => (VOIX_SALLE[id] = voix, [id, { nom, duree: 45, video: null, description, muscles: muscles + " · " + mat, mat: true }]))));
const POSES_SALLE = {
  squatBarre: {v:"p",f:[[95,106,32,-60,165,-60,165,75,5,72,0],[100,82,0,-40,176,-40,176,0,0,0,0]],a:[[160,60,162,84,160,108]],o:[["disc","mn"]]},
  presseCuisses: {v:"p",f:[[80,112,-58,40,95,40,95,128.3,131.7,128.3,131.7],[80,112,-58,40,95,40,95,124.5,129.2,124.5,129.2]],a:[[118,108,140,96,160,74]],o:[["pad",[[88,124],[42,96]]],["pad",[[70,124],[104,124]]],["tube",[[96,142],[200,30]]],["plaque","pn",-45,34]]},
  legExt: {v:"p",f:[[96,106,-6,25,90,25,90,90,90,90,90],[96,106,-6,25,90,25,90,90,15,90,15]],a:[[170,128,184,118,186,100]],o:[["pad",[[84,118],[124,118]]],["pad",[[78,114],[72,62]]],["tube",[[80,145],[80,118]]],["pile",24,96],["roue","pn"]]},
  legCurl: {v:"p",f:[[110,103,90,90,90,90,90,-90,-170,-90,-170],[110,103,90,90,90,90,90,-90,-90,-90,-90]],a:[[28,96,30,74,48,60]],o:[["banc",40,113,160],["roue","pn"]]},
  molletsMachine: {v:"p",f:[[120,72,0,175,5,175,5,0,0,0,0],[120,80,0,175,5,175,5,0,0,0,0]],a:[[166,120,166,104,166,88]],o:[["pad",[[104,141],[140,141]],8],["tube",[[92,145],[92,22]]],["plaque","mn",90,26]]},
  abducteurs: {v:"f",f:[[120,86,0,20,0,-20,0,40,0,-40,0],[120,86,0,20,0,-20,0,12,8,-12,-8]],a:[[168,136,186,128,196,112],[72,136,54,128,44,112]],o:[["pad",[[96,100],[144,100]]],["tube",[[120,145],[120,104]]]],u:"Vue de face"},
  souleveTerre: {v:"p",f:[[128,82,0,0,0,0,0,0,0,0,0],[82,94,60,0,0,0,0,50,-10,50,-10]],a:[[176,124,178,100,176,76]],o:[["disc","mn"]]},
  rowPoulie: {v:"p",f:[[96,118,-8,-14.4,121.7,-14.4,121.7,69,91.4,69,91.4],[96,118,12,90,90,90,90,69,91.4,69,91.4]],a:[[176,72,152,68,128,72]],o:[["pad",[[78,128],[118,128]]],["pad",[[160,138],[164,112]],7],["cable","mn",[206,108]],["barre","mn",12]]},
  pullover: {v:"p",f:[[100,82,25,20,20,20,20,0,0,0,0],[100,82,25,140,140,140,140,0,0,0,0]],a:[[178,40,174,74,150,100]],o:[["cable","m",[210,-6]],["barre","m",22]]},
  facePull: {v:"p",f:[[100,82,-8,166.4,30.3,166.4,30.3,10,0,-10,0],[100,82,-8,100,100,100,100,10,0,-10,0]],a:[[168,64,150,52,128,60]],o:[["cable","m",[210,34]],["roue","m"]]},
  benchBarre: {v:"p",f:[[145,102,-90,180,180,180,180,75,0,75,0],[145,102,-90,70,180,70,180,75,0,75,0]],a:[[78,86,78,66,78,46]],o:[["tube",[[64,145],[64,50]]],["banc",70,113,110],["disc","m"]]},
  inclineHalteres: {v:"p",f:[[100,108,-52,190.3,157.9,190.3,157.9,82.2,4.4,82.3,0.5],[100,108,-52,182.7,43.4,182.7,43.4,82.2,4.4,82.3,0.5]],a:[[124,58,124,40,124,22]],o:[["pad",[[110,120],[56,82]]],["tube",[[96,145],[96,122]]],["barre","m",18]]},
  chestPress: {v:"p",f:[[96,106,-8,90,90,90,90,90,10,90,10],[96,106,-8,2.1,136.6,2.1,136.6,90,10,90,10]],a:[[120,40,144,36,168,40]],o:[["pad",[[84,118],[124,118]]],["pad",[[78,114],[72,62]]],["tube",[[80,145],[80,118]]],["pile",24,96],["plaque","mn",0,18]]},
  pecDeck: {v:"p",f:[[96,106,-6,80,175,80,175,90,10,90,10],[96,106,-6,-80,175,-80,175,90,10,90,10]],a:[[60,40,96,22,132,40]],o:[["pad",[[84,118],[124,118]]],["pad",[[78,114],[72,62]]],["tube",[[80,145],[80,118]]],["plaque","mn",0,18]]},
  crossover: {v:"f",f:[[120,82,0,8.5,-22.9,-8.5,22.9,6,0,-6,0],[120,82,0,114.4,110.1,-114.4,-110.1,6,0,-6,0]],a:[[194,46,176,74,146,90],[46,46,64,74,94,90]],o:[["cable","mn",[226,-6]],["cable","mf",[14,-6]]],u:"Vue de face"},
  militaire: {v:"p",f:[[110,82,0,190.3,157.9,190.3,157.9,0,0,0,0],[110,82,0,167.7,12.8,167.7,12.8,0,0,0,0]],a:[[160,50,160,28,160,6]],o:[["disc","mn"]]},
  oiseau: {v:"p",f:[[96,106,6,-75,-75,-75,-75,90,10,90,10],[96,106,6,90,90,90,90,90,10,90,10]],a:[[136,44,100,26,62,44]],o:[["pad",[[84,118],[124,118]]],["pad",[[118,112],[126,66]]],["tube",[[110,145],[110,118]]],["plaque","mn",0,16]]},
  shrugs: {v:"f",f:[[120,82,0,8,3,-8,-3,3,0,-3,0,0,0,40],[120,82,0,8,3,-8,-3,3,0,-3,0]],a:[[178,58,178,42,178,26]],o:[["barre","mn",18],["barre","mf",18]]},
  curlMarteau: {v:"p",f:[[110,82,0,0,165,0,0,0,0,0,0],[110,82,0,0,0,0,0,0,0,0,0]],a:[[140,100,152,78,138,56]],o:[["barre","mn",18]]},
  extNuque: {v:"p",f:[[110,82,0,176,180,176,180,0,0,0,0],[110,82,0,168,-40,168,-40,0,0,0,0]],a:[[78,46,74,24,96,4]],o:[["barre","m",14]]}
};
Object.assign(POSES, POSES_SALLE);
// Développé épaules à la machine (ajouté avec les visuels 3D)
EXERCICES.shoulderMachine = { nom: "Développé épaules à la machine", duree: 45, video: null, mat: true,
  description: "Assis, dos plaqué au dossier, poignées à hauteur d’épaules : pousse au-dessus de la tête sans verrouiller les coudes, puis redescends lentement.",
  muscles: "Épaules, triceps · machine" };
VOIX_SALLE.shoulderMachine = "Machine shoulder press";
POSES_SALLE.shoulderMachine = { v: "f", f: [[120,86,0,165,185,-165,-185,12,8,-12,-8],[120,86,0,105,180,-105,-180,12,8,-12,-8]], a: [[172,66,172,36,172,6]], o: [["pad",[[96,100],[144,100]]],["barre","mn",14],["barre","mf",14]], u: "Vue de face" };
POSES.shoulderMachine = POSES_SALLE.shoulderMachine;
const SALLE = Object.keys(POSES_SALLE);
/* [clé, titre, détail, couleur, exercices] : séances typiques de salle, jouées en séries */
[
  ["legDay", "Leg day · jambes", "Cuisses, fessiers, ischios, mollets", "#AD5A0C", ["squatBarre","presseCuisses","legExt","legCurl","dbLunge","molletsMachine"]],
  ["chestDay", "Chest day · pectoraux", "Pectoraux, avant des épaules, triceps", "#C8283C", ["benchBarre","inclineHalteres","chestPress","pecDeck","crossover","dips"]],
  ["backDay", "Back day · dos", "Dos, trapèzes, biceps", "#1D6FA5", ["souleveTerre","tractions","poulieTirage","rowPoulie","dbRow","pullover"]],
  ["shoulderDay", "Shoulder day · épaules", "Épaules et trapèzes", "#7B5EA7", ["militaire","shoulderMachine","dbLateral","oiseau","facePull","shrugs"]],
  ["armDay", "Arm day · bras", "Biceps, triceps, avant-bras", "#0E7C86", ["ezCurl","poulieTriceps","curlMarteau","extNuque","dbCurl","ezSkull"]],
  ["pushDay", "Push day · poussée", "Pectoraux, épaules, triceps", "#B83280", ["benchBarre","militaire","inclineHalteres","dbLateral","poulieTriceps","extNuque"]],
  ["pullDay", "Pull day · tirage", "Dos, arrière des épaules, biceps", "#2F855A", ["tractions","rowPoulie","poulieTirage","facePull","ezCurl","curlMarteau"]],
  ["gluteDay", "Glute day · fessiers", "Fessiers, ischios, hanches", "#C2410C", ["hipThrust","bulgare","dbRDL","abducteurs","legCurl","stepUp"]],
  ["fullBody", "Full body · corps entier", "Jambes, pectoraux, dos, épaules, abdos", "#3949AB", ["squatBarre","benchBarre","rowPoulie","militaire","legCurl","poulieCrunch"]],
  ["absDay", "Abs day · abdos", "Abdominaux, obliques, gainage", "#4A5568", ["poulieCrunch","relevesJambes","roue","poulieBucheron","hollow","planche"]]
].forEach(([k, titre, detail, couleur, exercices]) => {
  ROUTINES[k] = { type: "seance", salle: true, titre, detail, couleur, exercices };
  CONSEILLES[k] = [...new Set([...exercices, ...SALLE, ...MATOS, "pompes", "planche", "planchelat", "deadbug"])];
});

/* ============ NATATION, FOOT, BASKET, VOLLEY, TENNIS, PADEL, ESCALADE ============
   Contenu écrit dans les deux langues ; le nom français reste dans nomFr / titreFr pour la voix française. */
{
  const EN = LANGUE === "en";
  [["crawlSec", 20, "", "", "Crawl à sec", "Dry crawl strokes", "Épaules, dorsaux, triceps", "Shoulders, lats, triceps", "Buste penché en avant, enchaîne de grands mouvements de crawl : un bras passe devant pendant que l’autre pousse vers l’arrière, en alternance.", "Torso leaning forward, make big crawl strokes: one arm reaches forward while the other pushes back, alternating.", "Dry crawl strokes"], ["battements", 20, "", "", "Battements de jambes", "Flutter kicks", "Abdos, fléchisseurs de hanche, quadriceps", "Abs, hip flexors, quads", "Allongé sur le dos, bas du dos collé au sol, jambes tendues légèrement décollées : fais de petits battements rapides de haut en bas.", "Lying on your back, lower back pressed down, straight legs slightly lifted: make small, quick up-and-down kicks.", "Flutter kicks"], ["sautContre", 20, "", "", "Sauts de contre", "Block jumps", "Mollets, quadriceps, fessiers, épaules", "Calves, quads, glutes, shoulders", "Mains à hauteur du visage, fléchis les jambes puis saute à la verticale bras tendus vers le haut, comme pour contrer au filet. Réception souple.", "Hands at face height, bend your legs then jump straight up with arms extended, as if blocking at the net. Land softly.", "Block jumps"], ["frappeVide", 20, "", "", "Frappes de balle à vide", "Shadow kicks", "Hanches, quadriceps, ischio-jambiers, adducteurs", "Hips, quads, hamstrings, adductors", "Sur une jambe, arme la jambe de frappe vers l’arrière puis lance-la vers l’avant comme pour frapper le ballon, bras ouverts pour l’équilibre. Change de jambe à mi-temps.", "On one leg, swing the kicking leg back then forward as if striking the ball, arms out for balance. Switch legs halfway.", "Shadow kicks"], ["coupDroit", 20, "", "", "Coups droits et revers à vide", "Shadow forehands and backhands", "Épaules, tronc, obliques, jambes", "Shoulders, trunk, obliques, legs", "Jambes fléchies, fais tourner les épaules et enchaîne des coups droits puis des revers à vide, en accompagnant le geste avec tout le corps.", "Knees bent, rotate your shoulders and alternate shadow forehands and backhands, using your whole body.", "Shadow forehands and backhands"], ["suspension", 20, "barre de traction", "pull-up bar", "Suspension passive", "Dead hang", "Avant-bras, épaules, dos", "Forearms, shoulders, back", "Suspendu à la barre, bras tendus, épaules d’abord relâchées puis légèrement engagées : tiens la position en respirant calmement.", "Hang from the bar with straight arms, shoulders relaxed then slightly engaged: hold while breathing calmly.", "Dead hang"]].forEach(([id, duree, matFr, matEn, nomFr, nomEn, musFr, musEn, descFr, descEn, voix]) => {
    const mat = EN ? matEn : matFr;
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: (EN ? musEn : musFr) + (mat ? " · " + mat : ""), mat: !!mat };
    VOIX_SALLE[id] = voix;
  });
  const POSES_SPORT2 = {
  crawlSec: {v:"p",f:[[110,82,40,150,150,-30,-25,0,0,0,0],[110,82,40,15,10,-160,-165,0,0,0,0]],a:[[178,40,196,70,176,100,1]]},
  battements: {v:"p",f:[[120,128,-90,-95,-95,-95,-95,100,100,78,78],[120,128,-90,-95,-95,-95,-95,78,78,100,100]],a:[[196,96,200,110,196,124,1]]},
  sautContre: {v:"f",f:[[120,70,0,174,180,-174,-180,4,0,-4,0],[120,86,0,125,175,-125,-175,14,-6,-14,6]],a:[[180,120,182,96,180,72]]},
  frappeVide: {v:"p",f:[[110,82,-8,-70,-80,70,80,75,85,0,0],[110,82,8,70,80,-70,-80,-35,-115,0,0]],a:[[60,138,110,150,170,108]]},
  coupDroit: {v:"f",f:[[120,84,0,20,40,-120,-160,22,0,-22,0],[120,84,0,60,70,-30,-20,22,0,-22,0]],a:[[178,96,132,32,70,40]]}
};
  Object.assign(POSES, POSES_SPORT2);
  POSES.suspension = { v: "f", f: [POSES.tractions.f[1]], o: POSES.tractions.o };
  MATOS.push("suspension");
  const cats = [["natation", "Natation", "Swimming", "Épaules, dos, chevilles, respiration", "Shoulders, back, ankles, breathing", "#0891B2"], ["foot", "Football", "Football", "Hanches, adducteurs, ischios, appuis", "Hips, adductors, hamstrings, footwork", "#047857"], ["basket", "Basket", "Basketball", "Chevilles, genoux, appuis, sauts", "Ankles, knees, footwork, jumps", "#B45309"], ["volley", "Volley", "Volleyball", "Épaules, sauts, appuis", "Shoulders, jumps, footwork", "#CA8A04"], ["tennis", "Tennis", "Tennis", "Épaules, rotation, appuis", "Shoulders, rotation, footwork", "#65A30D"], ["padel", "Padel", "Padel", "Épaules, rotation, déplacements", "Shoulders, rotation, movement", "#9333EA"], ["escalade", "Escalade", "Climbing", "Doigts, épaules, dos, hanches", "Fingers, shoulders, back, hips", "#7C4A2D"]];
  cats.forEach(([k, fr, en, dFr, dEn, couleur]) => { CATS[k] = { titre: EN ? en : fr, detail: EN ? dEn : dFr, couleur }; });
  // ordre d'affichage : les sports avant Renfo, Yoga, Surf, Ski
  ["renfo", "yoga", "surf", "ski"].forEach(k => { const c = CATS[k]; delete CATS[k]; CATS[k] = c; });
  [["natation", "natation", "Natation", "Swimming", "Épaules, dos, chevilles", "Shoulders, back, ankles", ["armcircles", "armcross", "crawlSec", "rotEpaule", "thread", "openbook", "legfwd", "battements"]], ["renfoNatation", "natation", "Renfo natation", "Swimming strength", "Dos, épaules, gainage, battements", "Back, shoulders, core, kicks", ["superman", "pompes", "planche", "hollow", "battements", "planchelat", "russian", "squatsaute"]], ["renfoNatationMat", "natation", "Renfo natation · matériel", "Swimming strength · equipment", "Dorsaux, coiffe des rotateurs, triceps, gainage", "Lats, rotator cuff, triceps, core", ["tractions", "poulieTirage", "bandPullApart", "bandRotExt", "dbRow", "poulieTriceps", "roue", "hollow"]], ["foot", "foot", "Football", "Football", "Hanches, adducteurs, ischios, appuis", "Hips, adductors, hamstrings, footwork", ["askip", "heelkick", "kneeup", "legfwd", "legside", "hip9090", "lateral", "frappeVide"]], ["renfoFoot", "foot", "Renfo football", "Football strength", "Jambes, adducteurs, gainage, explosivité", "Legs, adductors, core, power", ["squat", "fentesalt", "pontuni", "skater", "squatsaute", "planchelat", "deadbug", "mollet1"]], ["renfoFootMat", "foot", "Renfo football · matériel", "Football strength · equipment", "Ischios, fessiers, puissance, rotation", "Hamstrings, glutes, power, rotation", ["bulgare", "dbRDL", "hipThrust", "kbSwing", "bandWalk", "stepUp", "poulieBucheron", "roue"]], ["basket", "basket", "Basket", "Basketball", "Chevilles, genoux, appuis, sauts", "Ankles, knees, footwork, jumps", ["kneeup", "heelkick", "legside", "lateral", "pasChasse", "skater", "sautContre", "sautTir"]], ["renfoBasket", "basket", "Renfo basket", "Basketball strength", "Détente, appuis latéraux, gainage", "Vertical jump, lateral footwork, core", ["squatsaute", "skater", "fentesalt", "mollet1", "planche", "pompes", "burpees", "planchelat"]], ["renfoBasketMat", "basket", "Renfo basket · matériel", "Basketball strength · equipment", "Jambes, puissance, épaules, gainage", "Legs, power, shoulders, core", ["goblet", "bulgare", "kbSwing", "stepUp", "dbRDL", "bandWalk", "dbShoulder", "roue"]], ["volley", "volley", "Volley", "Volleyball", "Épaules, sauts, appuis", "Shoulders, jumps, footwork", ["kneeup", "legside", "armcircles", "rotEpaule", "lateral", "pasChasse", "sautContre", "lancer"]], ["renfoVolley", "volley", "Renfo volley", "Volleyball strength", "Détente, épaules, gainage", "Vertical jump, shoulders, core", ["squatsaute", "fentesalt", "pompes", "superman", "planchelat", "mollet1", "skater", "planche"]], ["renfoVolleyMat", "volley", "Renfo volley · matériel", "Volleyball strength · equipment", "Puissance, épaules protégées, jambes", "Power, protected shoulders, legs", ["kbSwing", "goblet", "bulgare", "bandRotExt", "dbShoulder", "poulieBucheron", "stepUp", "roue"]], ["tennis", "tennis", "Tennis", "Tennis", "Épaules, rotation du tronc, appuis", "Shoulders, trunk rotation, footwork", ["armcircles", "rotEpaule", "twist", "openbook", "coupDroit", "lateral", "pasChasse", "skater"]], ["renfoTennis", "tennis", "Renfo tennis", "Tennis strength", "Jambes, rotation, gainage, épaules", "Legs, rotation, core, shoulders", ["fentesalt", "skater", "squatsaute", "russian", "planchelat", "superman", "pompes", "mollet1"]], ["renfoTennisMat", "tennis", "Renfo tennis · matériel", "Tennis strength · equipment", "Coiffe des rotateurs, rotation du tronc, jambes", "Rotator cuff, trunk rotation, legs", ["bandRotExt", "poulieBucheron", "discWood", "dbRow", "bulgare", "goblet", "bandPullApart", "roue"]], ["padel", "padel", "Padel", "Padel", "Épaules, rotation, déplacements", "Shoulders, rotation, movement", ["armcircles", "rotEpaule", "twist", "coupDroit", "lateral", "cossack", "pasChasse", "kneeup"]], ["renfoPadel", "padel", "Renfo padel", "Padel strength", "Jambes, gainage, rotation", "Legs, core, rotation", ["fentesalt", "chaise", "squat", "russian", "planchelat", "pompes", "skater", "mollet1"]], ["renfoPadelMat", "padel", "Renfo padel · matériel", "Padel strength · equipment", "Épaules, rotation du tronc, jambes", "Shoulders, trunk rotation, legs", ["bandRotExt", "discWood", "goblet", "bulgare", "poulieBucheron", "dbRow", "bandWalk", "roue"]], ["escalade", "escalade", "Escalade", "Climbing", "Doigts, épaules, dos, hanches", "Fingers, shoulders, back, hips", ["armcircles", "rotEpaule", "scap", "catcow", "thread", "hip9090", "wgs", "suspension"]], ["renfoEscalade", "escalade", "Renfo escalade", "Climbing strength", "Tirage, gainage, épaules", "Pulling, core, shoulders", ["pompes", "superman", "planche", "hollow", "pike", "scap", "planchelat", "russian"]], ["renfoEscaladeMat", "escalade", "Renfo escalade · matériel", "Climbing strength · equipment", "Tractions, gainage suspendu, épaules", "Pull-ups, hanging core, shoulders", ["tractions", "chinups", "relevesJambes", "suspension", "dbRow", "bandPullApart", "bandRotExt", "roue"]]].forEach(([k, g, tFr, tEn, dFr, dEn, exercices]) => {
    const seance = k.startsWith("renfo"), mat = k.endsWith("Mat"), titre = EN ? tEn : tFr, detail = EN ? dEn : dFr, couleur = CATS[g].couleur;
    ROUTINES[k] = seance ? { type: "seance", grp: g, mat, titre, titreFr: tFr, detail, couleur, exercices } : { cat: g, titre, titreFr: tFr, detail, couleur, exercices };
  });
  ["natation", "renfoNatation", "renfoNatationMat", "foot", "renfoFoot", "renfoFootMat", "basket", "renfoBasket", "renfoBasketMat", "volley", "renfoVolley", "renfoVolleyMat", "tennis", "renfoTennis", "renfoTennisMat", "padel", "renfoPadel", "renfoPadelMat", "escalade", "renfoEscalade", "renfoEscaladeMat"].forEach(k => {
    const r = ROUTINES[k], base = r.mat ? CONSEILLES[k.replace("Mat", "")] || [] : [];
    CONSEILLES[k] = [...new Set([...r.exercices, ...(r.mat ? MATOS : []), ...base, ...(r.mat ? [] : ["squat", "fentesalt", "planche", "pompes", "lateral", "skater", "armcircles", "legfwd", "legside", "kneeup", "heelkick", "twist", "hip9090", "catcow", "wgs"])])];
  });
}

/* ============ PILATES ET REPRISE APRÈS BLESSURE ============
   Séances de reprise : courtes, par zone, chacune inspirée d'une étude (champ etude) ; jamais un avis médical. */
{
  const EN = LANGUE === "en";
  [["equilibre", 30, "Équilibre sur une jambe", "Single-leg balance", "Chevilles, pieds, hanches, proprioception", "Ankles, feet, hips, proprioception", "Debout sur une jambe, genou légèrement fléchi, regard droit devant. Pour progresser : ferme les yeux ou tiens-toi sur un coussin. Change de jambe à mi-temps.", "Stand on one leg, knee slightly bent, looking ahead. To progress: close your eyes or stand on a cushion. Switch legs halfway.", "Single leg balance"], ["alfredson", 40, "Descentes de talon sur marche", "Eccentric heel drops", "Mollets, tendon d’Achille", "Calves, Achilles tendon", "Avant des pieds sur une marche : monte sur les deux pointes, passe sur une jambe puis descends le talon lentement sous la marche (3 secondes). Remonte avec les deux pieds.", "Balls of your feet on a step: rise on both toes, shift onto one leg, then slowly lower the heel below the step (3 seconds). Come back up on both feet.", "Eccentric heel drops"], ["copenhague", 30, "Gainage Copenhague (genou)", "Copenhagen plank (knee)", "Adducteurs, aine, obliques", "Adductors, groin, obliques", "Sur le côté, avant-bras au sol, genou du dessus posé sur un banc ou une chaise : monte le bassin pour aligner le corps, puis redescends lentement. Change de côté à mi-temps.", "On your side, forearm on the floor, top knee on a bench or chair: lift your hips to align your body, then lower slowly. Switch sides halfway.", "Copenhagen plank"], ["extender", 40, "Extensions de genou, hanche fléchie", "Hamstring extender", "Ischio-jambiers", "Hamstrings", "Allongé sur le dos, tiens ta cuisse à la verticale avec les mains : tends lentement la jambe jusqu’à sentir un étirement, sans douleur, puis replie. Change de jambe à mi-temps.", "Lying on your back, hold your thigh vertical with your hands: slowly straighten the leg until you feel a stretch, without pain, then bend it back. Switch legs halfway.", "Hamstring extender"], ["poignetExc", 40, "Extension de poignet excentrique", "Eccentric wrist extension", "Avant-bras, extenseurs du poignet", "Forearm, wrist extensors", "Avant-bras posé sur la cuisse, paume vers le bas, une petite charge en main (une bouteille d’eau) : aide-toi de l’autre main pour monter le poignet, puis descends-le lentement seul en 3 secondes.", "Forearm resting on your thigh, palm down, a light weight in hand (a water bottle): use your other hand to lift the wrist, then lower it slowly on its own over 3 seconds.", "Eccentric wrist extension"], ["nuqueIso", 30, "Isométrie de la nuque", "Isometric neck hold", "Muscles du cou", "Neck muscles", "Main sur le front, pousse la tête contre la main sans bouger (à moitié de ta force) quelques secondes, puis relâche. Recommence à l’arrière et sur les côtés de la tête.", "Hand on your forehead, push your head into your hand without moving (at half your strength) for a few seconds, then relax. Repeat at the back and sides of your head.", "Isometric neck hold"], ["hundred", 30, "Le Hundred", "The Hundred", "Abdos profonds, respiration", "Deep abs, breathing", "Sur le dos, tête et épaules décollées, jambes levées : fais de petits battements rapides avec les bras tendus en respirant sur 5 temps à l’inspiration et 5 temps à l’expiration.", "On your back, head and shoulders lifted, legs raised: make small, quick pumps with straight arms, breathing in for 5 counts and out for 5.", "The hundred"], ["rollUp", 30, "Roll-up (enroulé)", "Roll-up", "Abdos, mobilité de la colonne", "Abs, spinal mobility", "Allongé, bras derrière la tête : enroule la colonne vertèbre par vertèbre pour venir t’asseoir et toucher tes pieds, puis déroule lentement jusqu’au sol.", "Lying down, arms overhead: curl up vertebra by vertebra to sit up and reach your feet, then roll down slowly to the floor.", "Roll up"], ["cercleJambe", 30, "Cercles de jambe", "Single leg circles", "Hanches, abdos, stabilité du bassin", "Hips, abs, pelvic stability", "Allongé sur le dos, une jambe tendue vers le plafond : dessine des cercles avec la jambe sans bouger le bassin. Change de sens puis de jambe.", "Lying on your back, one leg straight to the ceiling: draw circles with the leg without moving your pelvis. Change direction, then legs.", "Single leg circles"]].forEach(([id, duree, nomFr, nomEn, musFr, musEn, descFr, descEn, voix]) => {
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: EN ? musEn : musFr, mat: false };
    VOIX_SALLE[id] = voix;
  });
  const POSES_REPRISE = {
  equilibre: {v:"p",f:[[110,82,0,40,60,40,60,0,0,80,5]]},
  alfredson: {v:"p",f:[[120,84,0,60,90,60,90,0,0,0,0],[120,76,0,60,90,60,90,0,0,0,0]],a:[[166,92,168,106,166,120]],o:[["pad",[[104,142],[132,142]],8]]},
  copenhague: {v:"p",f:[[116,104,-68,-30,-95,-30,-95,85,90,85,90],[116,120,-80,-20,-95,-20,-95,80,95,80,95]],a:[[132,138,140,122,132,106]],o:[["banc",150,96,60]]},
  extender: {v:"p",f:[[120,128,-90,160,170,160,170,180,180,90,90],[120,128,-90,160,170,160,170,180,90,90,90]],a:[[150,40,170,52,176,70]]},
  poignetExc: {v:"p",f:[[110,82,0,0,110,0,0,0,0,0,0],[110,82,0,0,75,0,0,0,0,0,0]],a:[[146,86,152,98,146,110]],o:[["barre","mn",12]]},
  nuqueIso: {v:"p",f:[[110,82,0,182.6,65.9,0,0,0,0,0,0]]},
  hundred: {v:"p",f:[[110,128,-72,85,85,85,85,135,135,135,135,4,10,34],[110,128,-72,100,100,100,100,135,135,135,135,4,10,34]],a:[[60,96,64,108,60,120,1]]},
  rollUp: {v:"p",f:[[110,126,55,100,100,100,100,90,90,90,90,6,20,34],[110,128,-90,-90,-90,-90,-90,90,90,90,90]],a:[[40,110,70,60,120,58]]},
  cercleJambe: {v:"p",f:[[110,128,-90,90,90,90,90,172,172,90,90],[110,128,-90,90,90,90,90,145,145,90,90]],a:[[150,36,176,50,160,72,1]]}
};
  Object.assign(POSES, POSES_REPRISE);
  CATS.pilates = { titre: "Pilates", detail: EN ? "Deep core, posture, flexibility" : "Gainage profond, posture, souplesse", couleur: "#DB2777" };
  ["renfo", "yoga", "surf", "ski"].forEach(k => { const c = CATS[k]; delete CATS[k]; CATS[k] = c; });
  [["pilates", "pilates", "Pilates", "Pilates", "Échauffement : colonne, bassin, gainage", "Warm-up: spine, pelvis, core", ["catcow", "rollUp", "cercleJambe", "pont", "bird", "hundred", "enfant", "twist"]], ["renfoPilates", "pilates", "Renfo Pilates", "Pilates strength", "Centre du corps, posture, stabilité", "Core, posture, stability", ["hundred", "rollUp", "deadbug", "cercleJambe", "pont", "superman", "planchelat", "hollow"]], ["renfoPilatesMat", "pilates", "Renfo Pilates · matériel", "Pilates strength · equipment", "Élastique, gainage, posture", "Band, core, posture", ["bandRow", "bandPullApart", "bandChest", "bandWalk", "discRussian", "roue", "hollow", "hundred"]]].forEach(([k, g, tFr, tEn, dFr, dEn, exercices]) => {
    const seance = k.startsWith("renfo"), mat = k.endsWith("Mat"), titre = EN ? tEn : tFr, detail = EN ? dEn : dFr, couleur = CATS[g].couleur;
    ROUTINES[k] = seance ? { type: "seance", grp: g, mat, titre, titreFr: tFr, detail, couleur, exercices } : { cat: g, titre, titreFr: tFr, detail, couleur, exercices };
    const base = mat ? CONSEILLES[k.replace("Mat", "")] || [] : [];
    CONSEILLES[k] = [...new Set([...exercices, ...(mat ? MATOS : ["planche", "deadbug", "bird", "superman", "planchelat", "catcow", "enfantStat", "chien"]), ...base])];
  });
  [["repCheville", "Cheville", "Ankle", "Proprioception, mollets, mobilité", "Balance, calves, mobility", ["ankles", "calfraise", "equilibre", "mollet1", "soleaire", "molletMur"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repGenou", "Genou", "Knee", "Isométrie, quadriceps, contrôle du genou", "Isometrics, quads, knee control", ["pont", "chaise", "equilibre", "squat", "mollet1", "quadDebout"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repIschios", "Ischio-jambiers", "Hamstrings", "Allongement progressif, pont, équilibre", "Progressive lengthening, bridge, balance", ["pont", "extender", "pontuni", "bird", "rdl", "ischioCouche"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repAine", "Adducteurs et aine", "Adductors and groin", "Renforcement des adducteurs, hanches", "Adductor strengthening, hips", ["papillon", "lateral", "hydrant", "copenhague", "pont", "fenteLatTenue"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repDos", "Bas du dos", "Lower back", "Mobilité, gainage, fessiers", "Mobility, core, glutes", ["catcow", "bird", "deadbug", "pont", "planchelat", "genouxPoitrine"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repEpaule", "Épaule", "Shoulder", "Coiffe des rotateurs, omoplates, mobilité", "Rotator cuff, shoulder blades, mobility", ["armcircles", "rotEpaule", "scap", "bandRotExt", "bandPullApart", "brasCroise"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repAchille", "Tendon d’Achille et mollet", "Achilles tendon and calf", "Travail excentrique, mollets, chevilles", "Eccentric work, calves, ankles", ["ankles", "calfraise", "alfredson", "soleaire", "molletMur", "equilibre"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repCoude", "Coude et poignet", "Elbow and wrist", "Extenseurs du poignet, avant-bras, épaule", "Wrist extensors, forearm, shoulder", ["poignets", "poignetExc", "rotEpaule", "brasCroise", "triceps", "scap"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."], ["repNuque", "Nuque", "Neck", "Isométrie du cou, haut du dos, posture", "Neck isometrics, upper back, posture", ["nuqueIso", "nuqueFlex", "nuqueLat", "scap", "armcross", "grandissement"], "Renforcement général de la zone, à faire sans douleur et avec l’accord de ton médecin ou kiné. Ce n’est pas un soin.", "General strengthening for this area, to be done without pain and with your doctor’s or physio’s agreement. This is not treatment."]].forEach(([k, tFr, tEn, dFr, dEn, exercices, eFr, eEn]) => {
    ROUTINES[k] = { type: "seance", blessure: true, titre: EN ? tEn : tFr, titreFr: tFr, detail: EN ? dEn : dFr, etude: EN ? eEn : eFr, couleur: "#0E9F6E", exercices };
    CONSEILLES[k] = [...new Set([...exercices, "pont", "bird", "deadbug", "equilibre", "calfraise", "ankles", "catcow", "scap", "rotEpaule", "chaise", "planche", "planchelat", "genouxPoitrine", "ischioCouche", "molletMur", "brasCroise"])];
  });
}

/* ============ EXERCICES AJOUTÉS POUR LES PROGRAMMES ============ */
{
  const EN = LANGUE === "en";
  [["jumpingJack", 30, "Jumping jacks", "Jumping jacks", "Cardio, épaules, mollets, coordination", "Cardio, shoulders, calves, coordination", "Saute en écartant les jambes et en levant les bras au-dessus de la tête, puis reviens jambes serrées, bras le long du corps. Atterris en souplesse sur l’avant des pieds.", "Jump your feet apart while raising your arms overhead, then jump back with feet together and arms by your sides. Land softly on the balls of your feet.", "Jumping jacks"], ["pompesMur", 40, "Pompes contre le mur", "Wall push-ups", "Pectoraux, triceps, épaules, gainage", "Chest, triceps, shoulders, core", "Face à un mur, mains à plat à hauteur d’épaules, pieds reculés : corps gainé, plie les coudes pour approcher la poitrine du mur, puis repousse. Idéal pour débuter les pompes.", "Facing a wall, hands flat at shoulder height, feet stepped back: keep your body straight, bend your elbows to bring your chest towards the wall, then push back. Ideal to start push-ups.", "Wall push-ups"], ["assisDebout", 40, "Assis-debout depuis une chaise", "Chair sit-to-stand", "Quadriceps, fessiers, équilibre", "Quads, glutes, balance", "Assis au bord d’une chaise, pieds à plat écartés de la largeur des hanches, bras tendus devant : lève-toi sans t’aider des mains, puis rassieds-toi lentement en contrôlant la descente.", "Sitting at the edge of a chair, feet flat hip-width apart, arms out in front: stand up without using your hands, then sit back down slowly with control.", "Chair sit to stand"], ["donkeyKick", 40, "Donkey kick (fessiers)", "Donkey kicks", "Grand fessier, ischio-jambiers, gainage", "Gluteus maximus, hamstrings, core", "À quatre pattes, mains sous les épaules : garde le genou plié à 90° et pousse la plante du pied vers le plafond en serrant le fessier, sans creuser le dos. Change de jambe à mi-temps.", "On all fours, hands under shoulders: keep the knee bent at 90° and push the sole of your foot towards the ceiling by squeezing your glute, without arching your back. Switch legs halfway.", "Donkey kicks"], ["crunchInverse", 40, "Crunch inversé", "Reverse crunch", "Grand droit de l’abdomen (bas), transverse", "Lower abs, transversus abdominis", "Allongé sur le dos, bras le long du corps, genoux pliés au-dessus des hanches : enroule le bassin pour ramener les genoux vers la poitrine en décollant le bas du dos, puis redescends lentement.", "Lying on your back, arms by your sides, knees bent above your hips: curl your pelvis to bring your knees towards your chest, lifting your lower back off the floor, then lower slowly.", "Reverse crunch"], ["ours", 30, "Planche de l’ours", "Bear plank", "Abdos profonds, épaules, cuisses", "Deep core, shoulders, thighs", "À quatre pattes sur les orteils, mains sous les épaules et genoux sous les hanches : décolle les genoux de 3 cm du sol et tiens, dos plat, sans bouger le bassin. Respire calmement.", "On all fours on your toes, hands under shoulders and knees under hips: lift your knees 3 cm off the floor and hold, back flat, without moving your hips. Breathe calmly.", "Bear plank"]].forEach(([id, duree, nomFr, nomEn, musFr, musEn, descFr, descEn, voix]) => {
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: EN ? musEn : musFr, mat: false };
    VOIX_SALLE[id] = voix;
  });
  const POSES_NEUFS = {
  jumpingJack: {v:"f",f:[[120,86,0,150,150,-150,-150,22,22,-22,-22],[120,80,0,8,8,-8,-8,5,5,-5,-5]],a:[[160,30,192,48,172,70],[80,30,48,48,68,70]]},
  pompesMur: {v:"p",m:178,f:[[126,91,34,41.4,136.6,41.4,136.6,-17.3,-44.6,-17.3,-44.6],[117,88,22,85,90.3,85,90.3,-3.4,-39.8,-3.4,-39.8]],a:[[150,46,160,40,168,46]]},
  assisDebout: {v:"p",f:[[112,82,0,10,10,10,10,0,0,0,0],[104,108,6,70,70,70,70,83.8,-7.3,83.8,-7.3]],a:[[150,100,158,82,150,64]],o:[["banc",76,112,40]]},
  donkeyKick: {v:"p",f:[[75,110,62,0,0,0,0,-118,180,0,-90],[75,110,62,0,0,0,0,0,-90,0,-90]],a:[[40,96,28,72,36,50]]},
  crunchInverse: {v:"p",f:[[114,122,-104,90,90,90,90,-165,120,-165,120],[112,128,-90,90,90,90,90,180,90,180,90]],a:[[150,70,140,50,120,46]]},
  ours: {v:"p",f:[[76,104,64,1.9,-2.9,1.9,-2.9,-11,-76,-11,-76],[75,110,62,0,0,0,0,0,-90,0,-90]],a:[[66,128,66,118,66,108]]}
};
  Object.assign(POSES, POSES_NEUFS);
  // accessibles aussi hors programmes : ajoutés aux séances de renfo au poids du corps et à leurs conseils
  [["renfoHaut", ["pompesMur", "crunchInverse", "ours"]], ["renfoBas", ["assisDebout", "donkeyKick"]], ["renfoComplet", ["jumpingJack"]]].forEach(([k, l]) => {
    if (!ROUTINES[k]) return; ROUTINES[k].exercices.push(...l); CONSEILLES[k] = [...new Set([...(CONSEILLES[k] || []), ...l])]; });
}

/* ============ EXERCICES DE SALLE AJOUTÉS (séances par objectif) ============ */
{
  const EN = LANGUE === "en";
  [["rdlBarre", 45, "Soulevé de terre roumain barre", "Barbell Romanian deadlift", "Ischio-jambiers, fessiers, lombaires · barre", "Hamstrings, glutes, lower back · barbell", "Barre en main devant les cuisses, genoux légèrement fléchis : recule les hanches en gardant le dos plat et la barre contre les jambes, descends jusqu’à mi-tibias puis remonte en serrant les fessiers.", "Bar in front of your thighs, knees slightly bent: push your hips back with a flat back and the bar close to your legs, lower to mid-shin, then stand up squeezing your glutes.", "Romanian deadlift"], ["hackSquat", 45, "Hack squat", "Hack squat", "Quadriceps, fessiers · machine", "Quads, glutes · machine", "Dos et épaules contre le dossier, pieds largeur d’épaules sur la plateforme : descends en contrôlant jusqu’à cuisses parallèles, genoux dans l’axe des pieds, puis pousse dans toute la plante.", "Back and shoulders against the pad, feet shoulder-width on the platform: lower with control to parallel thighs, knees over toes, then push through the whole foot.", "Hack squat"], ["kickbackPoulie", 40, "Kickback fessier à la poulie", "Cable glute kickback", "Grand fessier · poulie basse", "Gluteus maximus · low cable", "Sangle à la cheville, mains sur le montant, buste légèrement penché : pousse la jambe tendue vers l’arrière en serrant le fessier, sans creuser le dos, puis reviens lentement. Change de jambe à mi-temps.", "Strap on your ankle, hands on the frame, torso slightly forward: push the straight leg back squeezing your glute, without arching your back, then return slowly. Switch legs halfway.", "Cable glute kickback"], ["adducteursMachine", 45, "Adducteurs à la machine", "Hip adduction machine", "Adducteurs, intérieur des cuisses · machine", "Adductors, inner thighs · machine", "Assis, coussins contre l’intérieur des genoux, jambes écartées : serre les cuisses en contrôlant jusqu’à ce que les coussins se rapprochent, puis rouvre lentement.", "Seated, pads against the inside of your knees, legs apart: squeeze your thighs together with control, then open slowly.", "Hip adduction machine"], ["curlPupitre", 40, "Curl au pupitre", "Preacher curl", "Biceps, brachial · pupitre, barre Z ou haltères", "Biceps, brachialis · preacher bench, EZ bar or dumbbells", "Arrière des bras posé sur le pupitre : monte la charge en pliant les coudes sans décoller les bras, puis redescends lentement jusqu’à presque tendre les bras.", "Back of your arms on the pad: curl the weight up without lifting your arms, then lower slowly until your arms are almost straight.", "Preacher curl"]].forEach(([id, duree, nomFr, nomEn, musFr, musEn, descFr, descEn, voix]) => {
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: EN ? musEn : musFr, mat: true };
    VOIX_SALLE[id] = voix;
  });
  const POSES_SALLE2 = {
  rdlBarre: {v:"p",f:[[90,84,72,0,0,0,0,12,-6,12,-6],[96,82,0,0,0,0,0,0,0,0,0]],a:[[112,96,92,94,70,98]],o:[["disc","mn"]]},
  hackSquat: {v:"p",f:[[116,110,-26,-10,-60,-10,-60,95,8,95,8],[128,84,-26,-10,-50,-10,-50,28,8,28,8]],a:[[172,70,176,92,172,114]],o:[["tube",[[150,145],[78,10]]],["pad",[[118,142],[176,142]]]]},
  kickbackPoulie: {v:"p",f:[[110,84,22,40,20,40,20,0,0,-58,-40],[110,84,22,40,20,40,20,0,0,-8,-8]],a:[[60,118,46,108,40,92]],o:[["cable","m",[20,138]],["tube",[[150,142],[150,40]]]]},
  adducteursMachine: {v:"f",u:"Vue de face",f:[[120,86,0,20,0,-20,0,12,8,-12,-8],[120,86,0,20,0,-20,0,40,0,-40,0]],a:[[190,112,182,128,166,136],[50,112,58,128,74,136]],o:[["pad",[[96,100],[144,100]]],["tube",[[120,145],[120,104]]]]},
  curlPupitre: {v:"p",f:[[100,104,-5,60,170,60,170,90,0,90,0],[100,104,-5,60,95,60,95,90,0,90,0]],a:[[170,104,176,84,164,64]],o:[["pad",[[118,82],[150,104]]],["tube",[[150,108],[150,145]]],["barre","m",20]]}
};
  Object.assign(POSES, POSES_SALLE2);
  [["legDay", "rdlBarre"], ["gluteDay", "kickbackPoulie"], ["armDay", "curlPupitre"]].forEach(([k, e]) => { if (ROUTINES[k]) { ROUTINES[k].exercices.push(e); CONSEILLES[k] = [...new Set([...(CONSEILLES[k] || []), e])]; } });
  CONSEILLES.legDay = [...new Set([...(CONSEILLES.legDay || []), "hackSquat", "adducteursMachine"])];
}

/* ============ EXERCICE AJOUTÉ POUR LE RETOUR AU CALME ============ */
{
  const EN = LANGUE === "en";
  [["relaxation", 90, "Respiration abdominale allongée", "Lying belly breathing", "Diaphragme, relâchement général", "Diaphragm, full-body relaxation", "Allongé sur le dos, genoux pliés, mains sur le ventre : inspire 4 secondes par le nez en gonflant le ventre, expire 6 secondes par la bouche en le laissant redescendre. Relâche la mâchoire et les épaules.", "Lying on your back, knees bent, hands on your belly: breathe in for 4 seconds through your nose, filling your belly, then out for 6 seconds through your mouth as it falls. Relax your jaw and shoulders.", "Belly breathing"]].forEach(([id, duree, nomFr, nomEn, musFr, musEn, descFr, descEn, voix]) => {
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: null, description: EN ? descEn : descFr, muscles: EN ? musEn : musFr, mat: false };
    VOIX_SALLE[id] = voix;
  });
  const POSES_CALME = {
  relaxation: {v:"p",f:[[112,128,-90,165.3,46.3,165.3,46.3,135,30,135,30]],a:[[100,104,100,96,100,88]]}
};
  Object.assign(POSES, POSES_CALME);
  if (ROUTINES.etComplet) { ROUTINES.etComplet.exercices.push("relaxation"); CONSEILLES.etComplet = [...new Set([...(CONSEILLES.etComplet || []), "relaxation"])]; }
}

/* ============ DONNÉES EN ANGLAIS ============
   Appliquées seulement si l'appli est en anglais ; les noms français restent dans nomFr / titreFr (voix française). */
if (LANGUE === "en") {
  const EX_EN = {"inchworm": ["Inchworm", "Hamstrings, calves, shoulders, core", "From standing, lower your hands to the floor, walk them out to a push-up position, then walk back."], "wgs": ["World’s greatest stretch", "Hip flexors, adductors, hamstrings, thoracic rotation", "Deep lunge, hand on the floor beside the front foot, rotate your torso and reach the arm to the ceiling. Stay on the same side: the other side comes right after."], "openbook": ["Active open book", "Thoracic spine, chest, shoulders", "Lying on your side, knees bent, open the top arm while following your hand with your eyes, then come back. Switch sides halfway."], "thread": ["Thread the needle", "Shoulders, upper back, thoracic rotation", "On all fours, thread one arm under your body with a twist, then open it up to the ceiling. Alternate."], "wipers": ["Windshield wipers", "Hip rotators, obliques, lower back", "Seated or lying, knees bent, swing your legs from side to side with control."], "catcow": ["Active cat-cow", "Whole spine, lower back, abs, traps", "On all fours, smoothly alternate between a rounded back and an arched back."], "cossack": ["Cossack squat", "Adductors, hips, quads, ankles", "Wide stance, sink down onto one leg while keeping the other straight. Alternate."], "shadow": ["Shadow boxing with pivots", "Shoulders, trunk, legs (sport-specific moves)", "Throw jab-cross combinations, pivoting on the back foot."], "dogpedal": ["Downward dog with pedaling", "Calves, Achilles tendon, hamstrings", "In downward dog, bend one knee then the other, alternating."], "scorpion": ["Scorpion", "Quads, hip flexors, lower back, abs", "Lying face down, swing one foot towards the opposite hand by rotating your hips. Alternate."], "hip9090": ["90/90 hip switches", "Hip rotators, glutes", "Seated with knees at 90°, rotate both knees from one side to the other, hands-free if you can."], "rdl": ["Single-leg Romanian deadlift", "Hamstrings, glutes, ankle stability", "On one leg, hinge forward with the free leg extended behind you. Stay on the same leg: the other leg comes right after."], "fente": ["Reverse lunge with arms up", "Quads, psoas, glutes", "Reverse lunge with your arms straight overhead. Alternate legs."], "pont": ["Dynamic glute bridge", "Glutes, hamstrings, lower back", "Lying on your back, raise and lower your hips, squeezing your glutes at the top."], "askip": ["A-skip", "Calves, hip flexors, coordination", "Skip with a high knee drive and an active foot strike, always with the same leg: the other leg comes right after."], "armcircles": ["Arm circles", "Shoulders, chest, upper back", "Standing, draw big circles with your arms forward, then backward halfway."], "armcross": ["Open and cross arms", "Chest, rear delts, traps", "Standing, open your arms wide and back, then cross them in front of you, in rhythm."], "scap": ["Scapular push-ups", "Shoulder blades, shoulders, core", "In a straight-arm plank, squeeze then spread your shoulder blades without bending your elbows."], "twist": ["Standing trunk rotations", "Obliques, thoracic spine, hips", "Standing with feet apart, turn your torso from side to side, letting your arms follow."], "tspin": ["Plank with T rotation", "Shoulders, obliques, thoracic rotation, core", "In a plank, rotate your torso and open one arm to the ceiling, then come back. Alternate sides."], "slips": ["Boxing slips", "Obliques, quads, trunk mobility", "Knees bent, guard up, slip your head left then right by bending your legs and rotating your torso."], "footwork": ["Light footwork", "Calves, ankles, coordination", "Small bounces on the balls of your feet, quick steps forward, back and to the sides, like a boxer."], "lateral": ["Lateral lunge", "Adductors, glutes, quads", "Take a big step to the side, bend the stepping leg while keeping the other straight, come back and alternate."], "bird": ["Bird dog", "Lower back, glutes, abs, trunk stability", "On all fours, extend one arm and the opposite leg, hold for a second, come back and alternate."], "sumo": ["Sumo squat with toe touch", "Adductors, hamstrings, glutes, calves", "Wide stance, squat down, grab your toes, straighten your legs keeping your hands on your feet, then sink back down."], "cobra": ["Cobra to downward dog", "Abs, chest, spine, calves, hamstrings", "From lying face down, push up to open your chest (cobra), then lift your hips into downward dog. Flow between both."], "legfwd": ["Front and back leg swings", "Hamstrings, hip flexors", "Standing, one hand on a wall, swing a straight leg forward and back. Switch legs halfway."], "legside": ["Side leg swings", "Adductors, abductors, hips", "Standing, hands on a wall, swing a straight leg out to the side and across. Switch legs halfway."], "heelkick": ["Butt kicks", "Hamstrings, quads", "On the spot, kick each heel up towards your glutes, alternating, knees under your hips."], "kneeup": ["High knees", "Hip flexors, quads, cardio", "On the spot, drive your knees up to hip height in rhythm, standing tall."], "lungetwist": ["Walking lunge with rotation", "Quads, glutes, hip flexors, obliques", "Step forward into a lunge, rotate your torso towards the front leg, then switch legs as you walk."], "calfraise": ["Calf raises", "Calves, ankles, Achilles tendon", "Standing, rise quickly onto your toes, then lower slowly."], "skater": ["Skater steps", "Glutes, abductors, ankles, balance", "Leap sideways from one leg to the other, absorb the landing and swing your arms."], "hydrant": ["Fire hydrant", "Glutes, hip rotators", "On all fours, lift one knee out to the side keeping a 90° angle, then make circles. Alternate."], "ankles": ["Ankle circles", "Ankles, calves", "On one leg, draw big circles with your toes. Switch feet halfway."], "squat": ["Squat", "Quads, glutes, hamstrings", "Feet shoulder-width apart, sit your hips back until your thighs are parallel to the floor, then stand up."], "fentesalt": ["Alternating forward lunges", "Quads, glutes, hamstrings, balance", "Take a big step forward, lower until both knees are at 90°, push back and alternate legs."], "pontuni": ["Single-leg glute bridge", "Glutes, hamstrings, lower back", "Lying on your back, one leg straight in the air, push through the other foot to lift your hips and squeeze your glutes. Switch legs halfway."], "mollet1": ["Single-leg calf raises", "Calves, Achilles tendon, ankles", "On one leg, rise onto your toes then lower slowly. Switch legs halfway."], "chaise": ["Wall sit", "Quads, glutes, calves", "Back against a wall, slide down until your thighs are parallel to the floor and hold."], "planche": ["Plank", "Deep abs, back, shoulders, glutes", "On your forearms and toes, body in a straight line from head to heels, abs and glutes tight."], "planchelat": ["Side plank", "Obliques, glutes, shoulders", "On one forearm, body aligned sideways, hips high, free arm to the ceiling. Switch sides halfway."], "climbers": ["Mountain climbers", "Abs, hip flexors, shoulders, cardio", "In a push-up position, drive your knees towards your chest alternately, at a good pace."], "squatsaute": ["Jump squats", "Quads, glutes, calves, power", "Squat down then jump as high as you can. Land softly and repeat."], "deadbug": ["Dead bug", "Deep abs, hip flexors, stability", "On your back, arms up and knees at 90°. Extend one arm and the opposite leg without lifting your lower back, then alternate."], "pompes": ["Push-ups", "Chest, triceps, shoulders, core", "Hands under your shoulders, body straight, lower your chest close to the floor then push back up."], "pompesserrees": ["Close-grip push-ups", "Triceps, chest, shoulders", "Hands close together under your chest, elbows tucked, lower then push back up."], "burpees": ["Burpees", "Full body, cardio, power", "From standing, hands to the floor, jump your feet back to a plank, bring them in, then jump with arms up."], "russian": ["Russian twists", "Obliques, abs, hip flexors", "Seated, torso leaning back, feet off the floor, rotate your torso bringing your hands from one side to the other."], "superman": ["Superman", "Lower back, glutes, upper back", "Lying face down, lift your arms, chest and legs at the same time, hold for a second then relax."], "planchetouch": ["Plank with shoulder taps", "Abs, obliques, shoulders, stability", "In a push-up position, tap your shoulder with the opposite hand without moving your hips, then alternate."], "enfant": ["Active child’s pose", "Back, shoulders, hips, ankles", "Kneeling, sitting on your heels, walk your hands far forward and lower your forehead to the floor. Breathe, then sit up and repeat."], "cascade": ["Waterfall forward fold", "Hamstrings, lower back, neck", "Standing, knees soft, let your torso and arms hang towards the floor, head relaxed, then roll up slowly vertebra by vertebra."], "paddle": ["Surf paddling", "Shoulders, lats, lower back, neck", "Lying face down, chest lifted, mimic paddling: big alternating arm circles, legs together."], "popup": ["Surf pop-up", "Shoulders, triceps, hips, legs, abs", "Lying face down, hands under your chest: push up, bring your feet under you in one move and rise into a low surf stance. Lie back down and repeat."], "surfsquat": ["Surfer squat", "Quads, glutes, adductors, balance", "Feet wide and slightly staggered, squat low with arms open for balance, then rise. Switch front foot halfway."], "skisquat": ["Skier tuck", "Quads, glutes, lower back, abs", "Knees bent, torso leaning forward, arms straight ahead as if holding poles. Hold the position with small bounces."], "skihop": ["Skier side hops", "Calves, quads, glutes, ankles, coordination", "Feet together, hop from side to side over an imaginary line, absorbing each landing with bent knees."], "grandissement": ["Reach tall", "Back, shoulders, sides, calves", "Standing, interlace your fingers, raise your arms overhead and stretch tall on your toes. Breathe deeply, then relax."], "nuqueFlex": ["Chin to chest", "Neck, upper back", "Standing, hands behind your head, let the weight of your arms gently bring your chin to your chest. No pulling, just the weight."], "nuqueLat": ["Side neck stretch", "Traps, side of the neck", "Standing, tilt your head to the side and rest your hand on top of it, without pulling. Keep the other shoulder low. Switch sides halfway."], "brasCroise": ["Cross-body shoulder stretch", "Back of the shoulder, upper back", "Bring one straight arm across your chest and hold it with the other arm above the elbow. Keep the shoulder low. Switch arms halfway."], "triceps": ["Triceps stretch", "Triceps, side of the back, shoulder", "Raise one arm, bend the elbow and place the hand behind your head. With the other hand, gently push the elbow back. Switch arms halfway."], "dosMains": ["Chest opener", "Chest, front of the shoulder", "Standing, clasp your hands behind your back, arms straight, and gently lift them while opening your chest. Look ahead, shoulders down."], "poignets": ["Wrist stretch", "Forearms, wrists", "Arm straight in front, palm facing forward, gently pull your fingers back with the other hand. Switch hands halfway."], "murPecs": ["Wall chest stretch", "Chest, front of the shoulder", "Standing next to a wall, forearm flat on the wall with the elbow at shoulder height. Gently move your torso forward until you feel the stretch. Switch arms halfway."], "genouxPoitrine": ["Knee to chest", "Lower back, glutes, hips", "Lying on your back, pull one knee to your chest and hold it with both hands, the other leg straight on the floor. The other leg comes right after."], "torsionAllongee": ["Lying spinal twist", "Lower back, obliques, hips", "Lying on your back, arms out in a T, let your bent knees drop to one side, looking the other way. Switch sides halfway."], "lateralDebout": ["Standing side bend", "Sides, obliques, lats", "Standing, one arm raised, bend your torso sideways without leaning forward. Breathe into the stretched side. Switch sides halfway."], "flexionAssise": ["Seated forward fold", "Hamstrings, lower back", "Seated with legs straight, lean forward with a long back and reach for your feet or ankles. Knees slightly soft."], "figure4": ["Figure-four stretch", "Glutes, piriformis, hips", "Lying on your back, cross one ankle over the opposite knee and pull the bottom thigh towards you. Switch legs halfway."], "papillon": ["Butterfly stretch", "Adductors, groin, hips", "Seated, soles of the feet together, knees open. Keep a long back and gently press the knees down or lean forward."], "quadDebout": ["Standing quad stretch", "Quads, hip flexors", "Standing, grab your ankle behind you and bring the heel to your glutes, knees together, hips forward. Switch legs halfway."], "ischioCouche": ["Lying hamstring stretch", "Hamstrings, calves", "Lying on your back, raise one straight leg and gently pull it towards you holding the back of the thigh. Switch legs halfway."], "molletMur": ["Wall calf stretch", "Calves (gastrocnemius), Achilles tendon", "Hands on the wall, one leg straight behind, heel down. Move your hips towards the wall. Switch legs halfway."], "soleaire": ["Bent-knee calf stretch", "Soleus, Achilles tendon, ankles", "Hands on the wall, back knee slightly bent, heel down. Lower your hips towards the floor. Switch legs halfway."], "straddle": ["Seated straddle stretch", "Adductors, hamstrings, lower back", "Seated with legs wide in a V, long back. Slowly lean forward walking your hands out in front, without forcing."], "fenteLatTenue": ["Held side lunge", "Adductors, groin, hips", "Feet wide apart, sink onto one bent leg keeping the other straight, foot flat. Switch sides halfway."], "fenteBasse": ["Low lunge hip stretch", "Hip flexors, quads", "One knee on the floor, the other foot in front. Lift your torso, squeeze the back-leg glute and push your hips forward. Switch legs halfway."], "enfantStat": ["Child’s pose", "Back, shoulders, hips, ankles", "Kneeling, sitting on your heels, walk your hands far forward and let your forehead rest on the floor. Breathe into your back."], "chien": ["Downward dog", "Calves, hamstrings, shoulders, back", "Hands and feet on the floor, hips high in an inverted V. Push the floor away and let your heels sink. Bend one knee then the other to loosen up."], "goblet": ["Goblet squat", "Quads, glutes, core · kettlebell, dumbbell or plate", "Hold the weight against your chest, elbows in. Squat deep with a straight back, then drive up through your heels."], "kbSwing": ["Kettlebell swing", "Glutes, hamstrings, back, shoulders · kettlebell", "Feet apart, hip hinge: swing the kettlebell between your legs then snap your hips forward. The arms guide, the power comes from the hips."], "kbPress": ["Single-arm kettlebell press", "Shoulders, triceps, core · kettlebell", "Kettlebell in the rack position, core tight: press it overhead to a straight arm, then lower with control. Switch arms halfway."], "dbPress": ["Dumbbell bench press", "Chest, shoulders, triceps · bench, dumbbells", "Lying on the bench, feet on the floor: lower the dumbbells to chest level then press to straight arms."], "dbRow": ["One-arm dumbbell row", "Lats, rhomboids, biceps · bench, dumbbell", "One hand on the bench, flat back: pull the dumbbell to your hip keeping the elbow close. Switch arms halfway."], "dbShoulder": ["Dumbbell shoulder press", "Shoulders, triceps · dumbbells", "Standing, dumbbells at shoulder height: press overhead without arching your back, then lower."], "dbLunge": ["Dumbbell reverse lunges", "Quads, glutes, hamstrings · dumbbells", "A dumbbell in each hand, step back and lower until your knee nearly touches the floor, then return. Alternate legs."], "dbCurl": ["Dumbbell curl", "Biceps, forearms · dumbbells", "Standing, elbows tucked: curl the dumbbells to your shoulders then lower slowly."], "dbRDL": ["Dumbbell Romanian deadlift", "Hamstrings, glutes, lower back · dumbbells", "Dumbbells in front of your thighs, legs almost straight: push your hips back with a flat back, lower below the knees then stand up."], "dbLateral": ["Lateral raises", "Shoulders (deltoids) · dumbbells", "Dumbbells by your sides: raise your arms out to shoulder height, elbows slightly bent, then lower slowly."], "bulgare": ["Bulgarian split squat", "Quads, glutes, balance · bench, dumbbells", "Back foot on the bench, dumbbells in hand: lower straight down on the front leg then rise. Switch legs halfway."], "hipThrust": ["Bench hip thrust", "Glutes, hamstrings · bench, plate", "Upper back on the bench, plate on your hips: drive through your heels to lift your hips, squeeze at the top, then lower."], "stepUp": ["Bench step-ups", "Quads, glutes, balance · bench", "Place one foot on the bench and step up driving through that leg, opposite knee up, then step down. Switch legs halfway."], "dips": ["Bench dips", "Triceps, chest, shoulders · bench", "Hands on the edge of the bench behind you, legs straight in front: bend your elbows to 90° then push back up."], "ezCurl": ["EZ bar curl", "Biceps, forearms · EZ bar", "Standing, hands on the angled grips, elbows fixed: curl the bar to your chest then lower with control."], "ezSkull": ["Skull crushers", "Triceps · EZ bar, bench", "Lying on the bench, bar at arm’s length: bend only your elbows to lower the bar towards your forehead, then extend."], "ezRow": ["EZ bar bent-over row", "Lats, traps, biceps · EZ bar", "Bent over, flat back: pull the bar to your lower belly squeezing your shoulder blades, then lower."], "ezBench": ["EZ bar bench press", "Chest, triceps, shoulders · EZ bar, bench", "Lying on the bench, lower the bar to your lower chest then press to straight arms."], "poulieTirage": ["Lat pulldown", "Lats, biceps · high pulley", "Seated, thighs locked in: pull the bar to your upper chest driving your elbows down, then let it up slowly."], "poulieTriceps": ["Triceps pushdown", "Triceps · high pulley", "Standing, elbows against your ribs: push the bar down to straight arms, then let it rise to chest height."], "poulieCrunch": ["Cable crunch", "Abs · high pulley", "Kneeling facing the pulley, rope by your forehead: curl your torso towards your knees contracting your abs, then return."], "poulieBucheron": ["Cable wood chop", "Obliques, shoulders, core · high pulley", "From shoulder to opposite hip, pull diagonally while rotating your torso, arms almost straight. Switch sides halfway."], "bandRow": ["Band seated row", "Lats, biceps · resistance band", "Seated, band around your feet: pull towards your belly squeezing your shoulder blades, then return."], "bandChest": ["Band chest press", "Chest, triceps · resistance band", "Band behind your back, hands at chest height: press your arms forward then return."], "bandWalk": ["Banded side steps", "Glute medius, hips · resistance band", "Band around your ankles or knees, knees bent: take side steps without bringing your feet together."], "bandPullApart": ["Band pull-apart", "Rear delts, upper back · resistance band", "Arms straight in front, band between your hands: pull your arms apart squeezing your shoulder blades, then return."], "roue": ["Ab wheel rollout", "Abs, shoulders, core · ab wheel", "Kneeling, hands on the wheel: roll forward keeping a flat back and tight abs, then roll back."], "discRussian": ["Plate Russian twists", "Obliques, abs · weight plate", "Seated, torso leaning back, feet off the floor, plate in your hands: rotate from right to left."], "discWood": ["Plate wood chop", "Obliques, shoulders, hips · weight plate", "Standing, plate above one shoulder: bring it down diagonally to the opposite hip while pivoting. Switch sides halfway."], "tractions": ["Pull-ups", "Lats, biceps, forearms · pull-up bar", "Wide grip, hanging with straight arms: pull up until your chin clears the bar, then lower slowly."], "chinups": ["Chin-ups", "Biceps, lats · pull-up bar", "Palms facing you, hands shoulder-width: pull up until your chin clears the bar, then lower with control."], "relevesJambes": ["Hanging leg raises", "Lower abs, hip flexors · pull-up bar", "Hanging from the bar, raise your straight legs to horizontal without swinging, then lower slowly."], "pike": ["Pike push-ups", "Shoulders, triceps", "Hips high in an inverted V: bend your elbows to bring your head towards the floor between your hands, then push back."], "hollow": ["Hollow body hold", "Deep abs", "Lying on your back, lower back pressed down, arms straight overhead, straight legs lifted: hold the position."], "lancer": ["Throwing motion", "Shoulders, rotator cuff, trunk, hips", "Throwing action without a ball: arm cocked behind your head, step in, then throw forward and release. Start gently and speed up gradually."], "pasChasse": ["Defensive shuffles", "Glutes, adductors, quads, ankles", "Low stance, arms up like a defender: shuffle right then left without crossing your feet."], "sautTir": ["Jump shots", "Calves, quads, shoulders, core", "Two run-up steps, take off on one leg, opposite knee up and arm cocked: mimic the shot in the air, then land softly on both feet."], "rotEpaule": ["90/90 shoulder rotations", "Rotator cuff, shoulders", "Arms out at shoulder height, elbows bent at 90°: rotate your forearms down and up without moving your elbows, slowly."], "bandRotExt": ["Band external rotation", "Rotator cuff, rear delts · resistance band", "Elbow at shoulder height and bent at 90°, band anchored low in front of you: rotate your forearm up without moving the elbow, then lower slowly. Switch arms halfway."], "pedalage": ["Air cycling", "Hips, quads, hamstrings, abs", "Lying on your back, legs in the air: pedal slowly in big circles, lower back pressed to the floor."], "squatBarre": ["Barbell back squat", "Quads, glutes, core · barbell, rack", "Bar on your upper back, feet shoulder-width: sit your hips back until your thighs are at least parallel, back straight, then stand up."], "presseCuisses": ["Leg press", "Quads, glutes · leg press", "Back flat against the pad, feet hip-width on the platform: lower to 90° at the knees then press without locking your knees."], "legExt": ["Leg extension", "Quads · machine", "Seated, pad above your ankles: extend your legs to horizontal, hold a second, then lower slowly."], "legCurl": ["Lying leg curl", "Hamstrings · machine", "Lying face down, pad behind your ankles: curl your heels towards your glutes without lifting your hips, then lower slowly."], "molletsMachine": ["Machine calf raise", "Calves · machine", "Shoulders under the pads, balls of your feet on the step: rise as high as you can on your toes then lower below the step to stretch."], "abducteurs": ["Hip abduction machine", "Glute medius, hips · machine", "Seated, pads against the outside of your knees: push your thighs apart with control, then return without letting the weights touch."], "souleveTerre": ["Deadlift", "Glutes, hamstrings, back, traps · barbell", "Bar over mid-foot, flat back, straight arms: push through the floor keeping the bar close to your legs until standing, then lower with control."], "rowPoulie": ["Seated cable row", "Lats, rhomboids, biceps · low pulley", "Seated, feet braced, back straight: pull the handle to your belly button squeezing your shoulder blades, then extend your arms without rounding your back."], "pullover": ["Straight-arm pulldown", "Lats, long head of triceps · high pulley", "Standing, torso slightly leaning, arms almost straight: sweep the bar down to your thighs keeping your elbows fixed, then let it rise slowly."], "facePull": ["Face pull", "Rear delts, rotator cuff, traps · pulley, rope", "Rope at face height: pull towards your forehead spreading your hands, elbows high, then return with straight arms."], "benchBarre": ["Barbell bench press", "Chest, triceps, front delts · barbell, bench, rack", "Lying down, shoulder blades squeezed, feet on the floor: lower the bar to your lower chest then press to straight arms. With heavy weights, use a spotter."], "inclineHalteres": ["Incline dumbbell press", "Upper chest, shoulders, triceps · incline bench, dumbbells", "Bench inclined at 30-45°: lower the dumbbells to upper-chest level then press up bringing them together."], "chestPress": ["Machine chest press", "Chest, triceps · machine", "Seated, handles at chest height: press forward to straight arms, then return slowly without lifting your back off the pad."], "pecDeck": ["Pec deck (butterfly)", "Chest · machine", "Seated, arms open on the pads: bring your arms together in front of you squeezing your chest, then open slowly."], "crossover": ["Cable crossover", "Chest · high pulleys", "Standing between both pulleys, arms open, elbows slightly bent: bring your hands together in front of your hips in an arc, then open."], "militaire": ["Overhead press", "Shoulders, triceps, core · barbell", "Standing, core tight, bar at chin level: press overhead to straight arms without arching, then lower."], "oiseau": ["Machine reverse fly", "Rear delts, upper back · machine", "Seated facing the machine, arms straight in front: open your arms back squeezing your shoulder blades, then return."], "shrugs": ["Dumbbell shrugs", "Traps · dumbbells", "Standing, dumbbells by your sides: lift your shoulders to your ears, hold a second, then relax without rolling them."], "curlMarteau": ["Hammer curl", "Biceps, forearms · dumbbells", "Standing, palms facing each other, elbows tucked: curl the dumbbell to your shoulder then lower. Alternate arms."], "extNuque": ["Overhead triceps extension", "Triceps · dumbbell", "Dumbbell held with both hands overhead: lower it behind your neck by bending your elbows, then extend."], "shoulderMachine": ["Machine shoulder press", "Shoulders, triceps · machine", "Seated, back against the pad, handles at shoulder height: press overhead without locking your elbows, then lower slowly."]};
  for (const [id, [nom, muscles, description]] of Object.entries(EX_EN)) if (EXERCICES[id]) Object.assign(EXERCICES[id], { nomFr: EXERCICES[id].nom, nom, muscles, description });
  const RT_EN = {"boxe": ["Boxing", "Shoulders, thoracic spine, hips, trunk"], "course": ["Running", "Hips, legs, ankles"], "renfoCourse": ["Running strength", "Legs, glutes, calves, core"], "renfoBoxe": ["Boxing strength", "Chest, shoulders, triceps, abs, explosive legs"], "haut": ["Upper body", "Strength: shoulders, back, chest, arms"], "bas": ["Lower body", "Strength: hips, glutes, thighs, calves"], "complet": ["Upper and lower body", "Strength: full body"], "yoga": ["Yoga", "Gentle warm-up: back, hips, breathing"], "surf": ["Surf", "Warm-up: shoulders, back, hips, pop-up"], "ski": ["Ski", "Warm-up: legs, ankles, hips"], "renfoSurf": ["Surf strength", "Shoulders, back, core, legs"], "renfoSki": ["Ski strength", "Thighs, glutes, calves, core"], "renfoHaut": ["Upper body strength", "Chest, shoulders, triceps, back, abs"], "renfoBas": ["Lower body strength", "Thighs, glutes, hamstrings, calves"], "renfoComplet": ["Full body strength", "Full body"], "tabata": ["Tabata", "Timer: work, rest, reps and rounds adjustable"], "etNuque": ["Neck and traps", "Neck, traps, shoulders"], "etEpaules": ["Shoulders and arms", "Shoulders, triceps, wrists"], "etPecs": ["Chest and upper back", "Chest, shoulders, back"], "etDos": ["Back and lower back", "Back, sides, lower back"], "etHanches": ["Hips and glutes", "Glutes, hips, lower back"], "etCuisses": ["Thighs and hip flexors", "Quads, hip flexors"], "etIschios": ["Back of the thighs", "Hamstrings, lower back"], "etMollets": ["Calves and ankles", "Calves, Achilles tendon, ankles"], "etAdduct": ["Adductors and groin", "Inner thighs, hips"], "etComplet": ["Full body", "Head to toe, in 8 stretches"], "renfoCourseMat": ["Running strength · equipment", "Single-leg work, glutes, core"], "renfoBoxeMat": ["Boxing strength · equipment", "Power, chest, back, trunk rotation"], "renfoSurfMat": ["Surf strength · equipment", "Back, shoulders, core, legs"], "renfoSkiMat": ["Ski strength · equipment", "Thighs, glutes, core, balance"], "renfoHautMat": ["Upper body strength · equipment", "Chest, back, shoulders, arms, abs"], "renfoBasMat": ["Lower body strength · equipment", "Thighs, glutes, hamstrings"], "renfoCompletMat": ["Full body strength · equipment", "Full body"], "handball": ["Handball", "Shoulders, footwork, jumps"], "cyclisme": ["Cycling", "Back, hips, legs"], "renfoHandball": ["Handball strength", "Jumps, lateral footwork, shoulders, core"], "renfoCyclisme": ["Cycling strength", "Thighs, glutes, back, core"], "renfoHandballMat": ["Handball strength · equipment", "Power, protected shoulders, trunk rotation"], "renfoCyclismeMat": ["Cycling strength · equipment", "Thighs, glutes, posterior chain, back"], "legDay": ["Leg day", "Thighs, glutes, hamstrings, calves"], "chestDay": ["Chest day", "Chest, front delts, triceps"], "backDay": ["Back day", "Back, traps, biceps"], "shoulderDay": ["Shoulder day", "Shoulders and traps"], "armDay": ["Arm day", "Biceps, triceps, forearms"], "pushDay": ["Push day", "Chest, shoulders, triceps"], "pullDay": ["Pull day", "Back, rear delts, biceps"], "gluteDay": ["Glute day", "Glutes, hamstrings, hips"], "fullBody": ["Full body", "Legs, chest, back, shoulders, abs"], "absDay": ["Abs day", "Abs, obliques, core"], "coherEffort": ["After training", "Full session: catch your breath, cyclic sighing, coherence", "From free to guided breathing: catch your breath, slow down with cyclic sighing, then settle at 6 breaths per minute."], "coherFocus": ["Focus and stress", "Full session: box breathing, cyclic sighing", "Before a competition, an exam or a tense moment: box breathing holds your attention, cyclic sighing brings you down."], "coherSoir": ["End of the day", "Full session: cyclic sighing, extended exhale", "To unwind in the evening. Evidence on sleep itself is limited: it is a relaxation aid."], "coherReso": ["Find your pace", "Full session: 5 paces, from 6.7 to 4.6 breaths per minute", "Inspired by the resonance frequency protocol (Lehrer and Gevirtz, 2014). Without a heart sensor nothing is measured: simply choose the pace that feels most comfortable."], "coherExpress": ["Express", "Coherence 5-5", "Short format of coherent breathing."], "coherClassique": ["Classic coherence", "Coherence 5-5", "The reference format: 6 breaths per minute for 5 minutes."], "coherSoupir": ["Cyclic sighing", "Cyclic sighing", "The format tested in the Balban et al. (2023) study: 5 minutes a day."], "coherCarree": ["Box breathing", "4-4-4-4", "A focus technique, with a modest effect on mood."], "coherRecup": ["Extended exhale", "Inhale 4 s, exhale 6 s", "Slow pace with a longer exhale, simple and comfortable."]};
  const BL_EN = {"Respiration libre": ["Free breathing", "Breathe naturally through your nose, one hand on your belly. Let your breath slow down on its own.", "Natural breathing, no counting: settling the breath before and after."], "Cohérence cardiaque 5-5": ["Coherent breathing 5-5", "Inhale for 5 seconds, exhale for 5 seconds, no pause, through the nose. Your belly rises as you inhale.", "6 breaths per minute (0.1 Hz): the pace at which the effect on heart rate variability is usually greatest (Lehrer and Gevirtz, 2014). Slow breathing increases heart rate variability (meta-analysis by Laborde et al., 2022, 223 studies)."], "Expiration allongée 4-6": ["Extended exhale 4-6", "Inhale for 4 seconds through your nose, exhale slowly for 6 seconds, lips slightly parted.", "A slow pace often felt as more calming. No proven advantage over 5-5 for heart rate variability (Meehan and Shaffer, 2024)."], "Soupir cyclique": ["Cyclic sighing", "Inhale through your nose, add a second short inhale to fill your lungs, then exhale slowly and fully through your mouth.", "5 min a day for 4 weeks: greater gain in positive mood than meditation (Balban et al., 2023, 108 adults, preliminary study). The timed pace here is the app’s choice."], "Respiration carrée 4-4-4-4": ["Box breathing 4-4-4-4", "Inhale 4 s, hold 4 s, exhale 4 s, stay empty 4 s. Shorten the holds if you feel uncomfortable.", "Tested by Balban et al. (2023): improves mood, but no more than meditation. Limited evidence, mainly useful for focus."], "__rythme": ["Pace {n} breaths/min", "Breathe at this pace without forcing and notice how you feel: calmer, more at ease? Remember the one that suits you best.", "Resonance frequency averages around 6 breaths per minute, with differences between people (Lehrer and Gevirtz, 2014)."]};
  for (const [k, [titre, detail, etude]] of Object.entries(RT_EN)) {
    const r = ROUTINES[k]; if (!r) continue;
    r.titreFr = r.titre; r.titre = titre;
    r.detail = r.souffle ? detail + " · " + Math.round(r.blocs.reduce((t, b) => t + b.duree, 0) / 60) + " min" : detail;
    if (etude) r.etude = etude;
    (r.blocs || []).forEach(b => {
      const m = b.titre.match(/^Rythme ([\d,]+)/), e = m ? BL_EN.__rythme : BL_EN[b.titre];
      if (!e) return;
      b.titreFr = b.titre; b.titre = m ? e[0].replace("{n}", m[1].replace(",", ".")) : e[0]; b.consigne = e[1]; b.resume = e[2];
    });
  }
  const CATS_EN = {"boxe": ["Boxing", "Shoulders, thoracic spine, hips, trunk"], "course": ["Running", "Hips, legs, ankles"], "handball": ["Handball", "Shoulders, rotator cuff, footwork, jumps"], "cyclisme": ["Cycling", "Hips, legs, back"], "renfo": ["Strength", "Upper body, lower body or full body"], "yoga": ["Yoga", "Flexibility, back, hips, breathing"], "surf": ["Surf", "Shoulders, back, hips, pop-up"], "ski": ["Ski", "Legs, ankles, hips, balance"]};
  for (const [k, [titre, detail]] of Object.entries(CATS_EN)) if (CATS[k]) Object.assign(CATS[k], { titre, detail });
}

