# Chantier « sports un par un » : consignes pour Codex (ChatGPT) ou tout agent de code

Une tâche = un sport = une branche = une pull request. Suivre `AGENTS.md`.

## Procédure pour un sport
1. **Lire** :
   - `js/<sport>.js` ;
   - le moteur commun `js/sport.js` ;
   - la partie du sport dans `js/catalogue.js` (`ECHS`, `RENFOS`) ;
   - le modèle `js/boxe.js`.
2. **Chercher des sources publiques** (fédérations, études, recommandations officielles) sur 3 points :
   - les blessures les plus fréquentes ;
   - les qualités physiques clés ;
   - la structure d'une saison.
3. **Auditer chaque séance et chaque exercice** :
   - **réalisme** : le geste sert-il vraiment le sport ?
   - **complétude** : manque-t-il une qualité clé ?
   - **sécurité** : progressions sûres, contre-indications ;
   - **volumes et repos** : cohérents avec le niveau (débutant, intermédiaire, avancé).
4. **Corriger dans le même fichier**, en gardant :
   - les identifiants existants (les utilisateurs ont un historique dessus) ;
   - la structure mobilité → bloc principal → gainage / rotation → retour au calme ;
   - les durées 20 / 35 / 50 min ;
   - une version au poids du corps ;
   - l'intensité au ressenti sur 10.
5. **Vérifier** :
   - `python3 outils/version.py`, puis `python3 outils/verif.py` doit afficher « Aucun problème » ;
   - `node --check js/<sport>.js`.
6. **Pull request** en français, avec :
   - le rapport d'audit : ce qui était juste, faux ou manquant, et ce qui a changé ;
   - les sources ;
   - la liste des nouveaux exercices, qui n'ont pas encore de vidéo.

## Ordre conseillé
foot, course, basket, handball, tennis, volley, natation, cyclisme, padel, escalade, ski, surf, pilates, cardio.
La boxe est le modèle : on n'y touche pas.

## Texte à donner à l'agent (remplacer FOOT par le sport)
> Lis AGENTS.md et outils/consignes-sports.md, puis applique la procédure au sport FOOT (fichier js/foot.js). Une seule pull request, en français, avec le rapport d'audit et les sources.
