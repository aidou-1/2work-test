# 2 WORK : règles pour les agents de code (Claude, Codex, Gemini / Antigravity)

Fichier unique et partagé : `CLAUDE.md` et `GEMINI.md` l'importent. Toute règle commune se change **ici**.

## Le projet
- **2 WORK** : application web (PWA) gratuite, sans publicité et hors ligne pour l'échauffement, l'entraînement guidé à la voix et la récupération. Téléphone d'abord (390 px de large).
- **Vrai site** : https://aidou-1.github.io/2work/ (branche `main`). **Site test** : https://aidou-1.github.io/2work-test/.
- **Code** : JavaScript « vanilla » avec des fonctions globales, sans bundler et sans dépendance payante ni CDN. Tout est dans le dépôt (polices dans `fonts/`, vidéos dans `videos/`).
- **Ordre des scripts** : voir la fin d'`index.html`. Un script ne peut appeler une fonction d'un script chargé après lui qu'au moment de l'exécution, jamais au chargement. Le CSS est dans `index.html`.
- **Firebase** (projet `app-2work`, offre gratuite Spark, base en Europe) : utilisé seulement pour les clubs, le compte et la sauvegarde facultative.
  - `js/serveur.js` est le seul module Firebase.
  - `firestore.rules` doit toujours correspondre à ce module.

## Règles absolues
1. **Ne jamais perdre de données utilisateur** : clés `localStorage`, historique, sauvegarde. Toute migration doit garder l'ancien format lisible.
2. **Ne jamais pousser sur `main`.** Travaille sur une branche et ouvre une pull request. C'est l'éditeur, avec Claude, qui met sur le site test puis sur le vrai site.
3. **Ne jamais modifier la console Firebase ni publier les règles.** Propose les changements de `firestore.rules` dans la pull request.
4. **Aucun service payant** : pas d'offre Blaze, pas de Cloud Functions, pas d'API payante.
5. **Ne jamais citer de source, programme ou marque commerciale** dans le code ou les textes, et ne jamais recopier le texte d'une source externe. On transpose des principes, avec ses propres mots.
6. **Données personnelles (RGPD)** :
   - ne collecter que le strict nécessaire ;
   - case décochée par défaut pour tout accord ;
   - mettre à jour les pages Confidentialité et CGU dans `js/profil.js` (FR et EN) dès qu'une donnée change ;
   - mineurs : compte à partir de 10 ans, accord parental sous 15 ans, 18 ans pour être coach.
7. **Contact public** : 2workbyaidou@gmail.com. Aucune autre adresse ni identité dans le dépôt.

## Avant chaque pull request
- `python3 outils/version.py` : nouvelle version partout, avec `?v=` sur les scripts et le cache de `sw.js`.
- `python3 outils/verif.py` doit afficher « Aucun problème ».
- `node --check` sur chaque fichier JS modifié.
- Tester au format téléphone, par exemple avec Playwright `devices["Pixel 7"]`, en thème clair et en thème sombre, sans erreur dans la console.

## Conventions
- **Textes** :
  - en français, avec la version anglaise via `L("fr", "en")` ;
  - les textes fixes d'`index.html` se traduisent dans `UI_EN` (`js/donnees.js`) ;
  - une nouveauté visible s'explique dans `js/guide.js` (MAJ, GUIDE, INFOS).
- **Code** :
  - compact, sans répétition ;
  - réutiliser les fonctions existantes : `seanceBlocs`, `blocHtml`, `ouvrirFeuilleInfo`, `stocker`, `lire`… ;
  - un commentaire court en français explique le **pourquoi**, jamais sur la même ligne qu'une instruction qui suit.
- **Thèmes** :
  - l'attribut `data-style` (`socle` par défaut, `fonderie`, `papier`, absent = classique) se combine avec `data-theme` (`light` ou `dark`) ;
  - toujours utiliser les variables CSS (`--bg`, `--surface`, `--ink`, `--brand`…), jamais une couleur en dur pour un fond ou un texte.
- **Accessibilité** :
  - cibles tactiles d'au moins 44 px ;
  - contraste suffisant ;
  - `prefers-reduced-motion` respecté.
- **Pendant la séance** : lisibilité avant tout (minuteur énorme, un seul geste principal).

## Contenu sportif (fichiers `js/<sport>.js`, `js/sport.js`, `js/catalogue.js`)
- **Modèle de qualité** : l'onglet boxe (`js/boxe.js`).
- **Structure d'une séance** : mobilité → bloc principal → gainage / rotation → retour au calme.
- **Contenu** :
  - les filières énergétiques propres au sport ;
  - la force qui part du sol quand le geste l'exige ;
  - la périodisation en blocs, avec un affûtage avant compétition.
- **Réglages** :
  - durées 20 / 35 / 50 min ;
  - toujours une version au poids du corps ;
  - intensité au ressenti sur 10.
- **Sécurité** :
  - prévention des blessures typiques du sport ;
  - progressions sûres ;
  - sources publiques reconnues (fédérations, études), citées dans la pull request.
- **Nouvel exercice** : il n'a pas encore de vidéo. Le signaler dans la pull request.
