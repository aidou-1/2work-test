# 2 WORK

Application web d'échauffement, de séances et de retour au calme (made by Aidou).

- `index.html` : l'application complète.
- `videos/` : une vidéo par exercice (`<identifiant>.mp4`). Les exercices sans vidéo affichent leur dessin.
- `vignettes/` : une image fixe par vidéo (`<identifiant>.webp`, 288 px de large) pour les listes. Pour une nouvelle vidéo : `ffmpeg -ss 2 -i videos/ID.mp4 -frames:v 1 -vf scale=288:-2 -quality 72 vignettes/ID.webp`.
- `fonts/` : polices Barlow et Barlow Condensed (licence SIL OFL, voir `fonts/OFL.txt`), hébergées avec l'appli pour n'appeler aucun service externe.

Données : tout reste dans le stockage local du téléphone (aucun compte, aucun serveur, aucun traceur). Voir « Réglages → Confidentialité » dans l'appli.
- `manifest.webmanifest`, `sw.js`, `icons/` : appli installable sur l'écran d'accueil et utilisable hors ligne. **À chaque mise en ligne, change le numéro de version `V` en haut de `sw.js`** pour que les téléphones reçoivent la nouvelle version.

## Fonctions

- Barre de navigation : Accueil, Progrès, Programmes, Outils, Réglages.
- Outils : bibliothèque d'exercices, séance express, minuteurs (chrono, compte à rebours, EMOM, AMRAP), tests de forme, suivi du corps, calculateurs (1RM, allures).
- Séance : chrono calé sur l'heure réelle, reprise d'une séance interrompue, commandes sur l'écran verrouillé (réglage « Écouter ma musique en même temps » coupé), voix de secours.
- Partage : « Défier un ami » envoie une séance par lien (`?defi=…`) ; bouton d'avis (adresse facultative dans `AVIS_EMAIL`, `index.html`).
- Rappels : agenda (.ics) et notifications les jours planifiés (service worker).
- Fond : `fonds/chaud.webp` (partout) et `fonds/vert.webp` (Outils), animés en CSS. Écrans de lancement iPhone dans `icons/lancement/`.
- Notifications dans l'appli (bandeaux personnalisés) et notifications système (rappel du jour, série en danger à 20 h).
- Quick start, avatar et vitalité (profil), anneau du chrono, repères de mouvement sur les vidéos, ceinture cardio Bluetooth (Web Bluetooth : Chrome et Edge, pas Safari).

- `js/` : le code de l'appli en huit fichiers lus dans l'ordre (donnees, seance, progres, catalogue, profil, anatomie, evenements, outils).
