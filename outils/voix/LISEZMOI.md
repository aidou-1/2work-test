# Voix 2 WORK (phrases enregistrées)

La « voix 2 WORK » (au choix dans Réglages → Voix ; par défaut, c'est la voix de base du téléphone) est générée à l'avance avec Kokoro (licence Apache 2.0) : voix `ff_siwis` en français, `am_michael` en anglais.
Chaque phrase dite par l'appli est découpée en morceaux (points, virgules, deux-points…) ; chaque morceau a son fichier
`voix/<langue>/<nom>.mp3`, listé dans `voix/<langue>.json`. Le nom est calculé de la même façon en JS (`nomVoixFichier`, js/seance.js)
et en Python (`nom`, generer.py). Une phrase dont un morceau manque est lue par la synthèse vocale du téléphone, ou seulement affichée
si l'utilisateur écoute sa musique. Les consignes de posture (consignes.js et celles ajoutées par les sports) sont récoltées aussi.
Les symboles et unités (×, –, %, /10, °, s, m, min, km) sont dits en toutes lettres (`oral`, generer.py) ; le nom du fichier reste celui du texte affiché.

Après avoir ajouté des exercices ou des phrases :
1. Servir l'appli en local et exécuter `recolte.js` dans la page (Playwright), en français puis en anglais → `phrases.json`.
2. `pip install kokoro-onnx soundfile` et télécharger `kokoro-v1.0.onnx` (2 fois plus rapide que la version int8 sur processeur) et `voices-v1.0.bin`
   (https://github.com/thewh1teagle/kokoro-onnx/releases, version model-files-v1.0) ; ou donner leurs chemins dans KOKORO_MODELE et KOKORO_VOIX.
3. `python3 -I generer.py phrases.json ../../voix fr` puis `... en` : seuls les morceaux manquants sont générés, les listes .json sont réécrites.
