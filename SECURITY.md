# 🔒 Politique de Sécurité — TrashDunk

La sécurité, l'intégrité de vos fichiers et le respect de votre vie privée sont au cœur de la conception de **TrashDunk**. Ce document décrit nos engagements de sécurité, les versions prises en charge ainsi que la procédure pour signaler une vulnérabilité de manière responsable.

---

## 🛡️ Engagements de sécurité fondamentaux

TrashDunk a été conçu selon le principe de **défense en profondeur et de sécurité par défaut** :

1. **Aucune suppression définitive non consentie** :
   - TrashDunk ne procède **jamais** à une suppression destructrice (`remove_file` / `shred`).
   - Tous les tirs réussis transitent exclusivement par l'API native de la Corbeille Windows (`IFileOperation` / `trash-rs`).
   - Tout fichier envoyé au panier reste **intégralement restaurable** à tout moment depuis la Corbeille de Windows.
   - En cas de tir manqué, d'abandon ou d'appui sur `Échap`, les fichiers cibles restent **100 % intacts** à leur emplacement d'origine.

2. **Zéro télémétrie & Mode hors-ligne strict** :
   - L'application ne requiert **aucune connexion Internet**.
   - Aucun nom de fichier, chemin, statistique de tir ou métadonnée n'est collecté, journalisé à distance ou transmis à des serveurs tiers.

3. **Moindre privilège (Least Privilege)** :
   - TrashDunk s'exécute dans l'espace utilisateur standard et ne nécessite **aucune élévation de privilèges administrateur (UAC)** au quotidien.
   - L'enregistrement du menu contextuel Windows est confiné à la ruche de l'utilisateur actuel (`HKEY_CURRENT_USER\Software\Classes`).

---

## 📦 Versions prises en charge

Seules les versions les plus récentes de TrashDunk bénéficient des correctifs de sécurité :

| Version | Prise en charge |
| :--- | :---: |
| **v1.1.x** (Dernière version) | ✅ Oui |
| **v1.0.x** | ⚠️ Recommandation de mise à niveau |
| **< v1.0.0** (Pré-releases) | ❌ Non |

---

## 🚨 Signaler une vulnérabilité

Si vous découvrez une faille de sécurité, un comportement inattendu lié à la suppression de fichiers ou un problème d'intégrité, nous vous remercions de **ne pas créer d'issue publique** afin de protéger les utilisateurs.

### Procédure de signalement :
1. **Signalement privé via GitHub (Méthode recommandée)** :
   - Rendez-vous sur l'onglet **Security** du dépôt GitHub : [dxne-dev/Trash-Dunk/security](https://github.com/Dxne-Dev/Trash-Dunk/security).
   - Cliquez sur **« Report a vulnerability »** pour ouvrir un rapport confidentiel (Draft Advisory).

2. **Par e-mail** :
   - Envoyez les détails de votre découverte à l'adresse du mainteneur : **alassanemomo244@gmail.com**.
   - Précisez en objet : `[VULNÉRABILITÉ] TrashDunk - Description courte`.

### Informations utiles à inclure :
Pour nous aider à reproduire et corriger rapidement le problème, veuillez inclure :
- La version exacte de TrashDunk utilisée (ex. `v1.1.0`).
- La version de votre système d'exploitation Windows (ex. Windows 11 23H2 x64).
- Les étapes détaillées pour reproduire le scénario (PoC).
- L'impact potentiel identifié (ex. risque de perte de fichier, blocage d'interface, élévation de privilèges).

---

## ⏱️ Délais de traitement & Divulgation coordonnée

- **Accusé de réception** : Nous nous engageons à répondre sous **48 heures** suivant votre signalement.
- **Analyse et triage** : Une évaluation technique et un calendrier prévisionnel de correctif vous seront partagés sous **5 jours ouvrés**.
- **Publication du correctif** : Dès qu'un correctif est validé, une nouvelle release corrective (patch) sera publiée avec mention et remerciements au chercheur (sauf demande d'anonymat).

---

Merci de contribuer à la sécurité et à la fiabilité de TrashDunk ! 🏀
