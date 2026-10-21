# 🏀 TrashDunk

> **Supprimer un fichier devrait être un sport.**

**TrashDunk** est un utilitaire Windows additif et ludique qui transforme la suppression de fichier en véritable session de shoot de basket.
Un verbe « **Dunk it 🏀** » s'intègre directement dans le menu contextuel du clic droit de l'Explorateur Windows. Visez la zone verte de la jauge : **un panier réussi envoie le fichier à la corbeille, un tir manqué le laisse intact sur votre bureau !**

---

## 🎯 Déroulement du geste (Workflow)

```
[Fichier sur le bureau]
          │
          ▼  (Clic droit)
   [Menu « Dunk it 🏀 »]
          │
          ▼
   [Apparition du Parquet & Ballon]
          │
          ▼  (Traction / Timing)
   [Jauge d'adresse oscillante]
       ┌──┴──┐
       ▼     ▼
 [Zone Verte] [À côté]
       │         │
    (Swish!)  (Brick / Air ball)
       │         │
   Fichier     Fichier
  Corbeille    Intact
```

### Règles du terrain :
- **Swish (écart ≤ 2%) :** Le tir parfait ! Le fichier file directement dans la corbeille Windows.
- **2 Swishs d'affilée = Mode COLD :** Effet gel intégral de l'écran, craquelures de glace et explosion avec le sticker collector **COLD** ❄️.
- **Air ball / Brick :** Le ballon rebondit sur l'anneau ou passe à côté. **Aucun fichier n'est touché**.
- **Touche Échap :** Annulation immédiate en un éclair à tout moment.

---

## 🚀 Deux versions disponibles

### 1. Version Démo Web / GitHub Pages
Testez immédiatement le jeu, la physique du ballon, les combos et les bruitages directement dans votre navigateur web sans rien installer :
👉 **[Accéder à la démo en ligne TrashDunk](https://dxne-dev.github.io/Trash-Dunk/)**

*(Vous pouvez aussi cliquer sur le bouton **« ▶ Voir la Démo »** pour visionner l'animation complète du workflow).*

### 2. Version Native Windows (Tauri & .NET)
- Intégration dans le menu contextuel clic droit de Windows (`HKEY_CURRENT_USER\Software\Classes\*\shell\TrashDunk`).
- Rendu visuel 100% fidèle avec les effets de shaders, particules, confettis et sticker COLD.
- Suppression réelle vers la corbeille native via l'API Win32 Recycle Bin.

---

## 🛠️ Installation & Lancement en local

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (pour compiler la version native desktop)

### Cloner le projet
```bash
git clone https://github.com/Dxne-Dev/Trash-Dunk.git
cd Trash-Dunk
```

### 1. Lancer la version Web en développement
```bash
npm install
npm run dev
```
Rendez-vous sur `http://localhost:5173`.

### 2. Compiler pour GitHub Pages
```bash
npm run build
```
Le site statique optimisé est généré dans le dossier `dist/`.

### 3. Lancer l'application Native Desktop (Tauri)
```bash
npx tauri dev
```

### 4. Compiler l'exécutable Windows `.exe`
```bash
npx tauri build
```
L'exécutable final se trouvera dans `src-tauri/target/release/TrashDunk.exe`.

---

## 🔒 Sécurité & Intégrité
- **Additif, jamais destructif :** TrashDunk n'écrase jamais la fonction native "Supprimer" de Windows.
- **Corbeille native :** Tout fichier dunké est envoyé à la corbeille Windows standard et peut être restauré à tout moment.
- **100% Hors-ligne :** Aucun upload, aucune télémétrie, tout s'exécute en local sur votre machine.

---

## 📜 Licence
MIT © [Dxne-Dev](https://github.com/Dxne-Dev)
