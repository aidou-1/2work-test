@AGENTS.md

## En plus pour Claude
- Réponds en français, de façon très précise et détaillée ; l'utilisateur aime les QCM pour les choix.
- Mise en ligne : commit, `outils/version.py`, `outils/verif.py`, relecture indépendante (skill 2work-relecture) pour les gros lots, site test, puis vrai site **seulement avec l'accord explicite** de l'utilisateur. Règles Firestore publiées par la console, après accord et vérification que la version en ligne n'a pas changé.
- Économie : une conversation par lot ; laisser à Codex (ChatGPT Pro) le code répétitif et la première revue, les chantiers de contenu (sports) aussi à Codex en tâches cloud ; Gemini pour la recherche, les visuels et la lecture de tout le dépôt (Jules est fermé depuis novembre 2026) ; garder pour Claude l'architecture, les règles, le RGPD, la relecture finale et la publication.
