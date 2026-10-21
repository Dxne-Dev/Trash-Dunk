# 🏀 TrashDunk

> **Supprimer un fichier devrait être un sport.**

**TrashDunk** est un utilitaire Windows additif et ludique qui transforme la suppression de fichier en véritable session de shoot de basket.
Un verbe « **Dunk it 🏀** » s'intègre directement dans le menu contextuel du clic droit de l'Explorateur Windows. Visez la zone verte de la jauge : **un panier réussi envoie le fichier à la corbeille, un tir manqué le laisse intact sur votre bureau !**

---

## 🎯 Déroulement du geste (Workflow)

```
[Fichier dans l'Explorateur]
          │
          ▼  (1. Clic droit -> Verbe Shell)
   [Menu « Dunk it 🏀 »]
          │
          ▼  (2. Apparition immédiate sur le Parquet)
   [File d'attente & Ballon prêt au tir]
          │
          ▼  (3. Traction / Timing de la Jauge)
   [Jauge d'adresse oscillante]
       ┌──┴──┐
       ▼     ▼
 [Zone Verte ≤ 2%] [À côté > 15%]
       │               │
  (SWISH ! 🗑️)     (AIR BALL ❌)
       │               │
  Déplacé vers      Fichier
   Corbeille        Intact
```

### Étape 1 : Le déclenchement depuis l'Explorateur Windows
On sélectionne un fichier, clic droit ➔ **Dunk it 🏀** :

| Fenêtre Explorateur Windows | Verbe Shell Enregistré |
| :--- | :--- |
| ![Explorer](https://img.shields.io/badge/Windows_Explorer-Bureau-202a37?style=for-the-badge&logo=windows) | `HKEY_CLASSES_ROOT\*\shell\TrashDunk` |
| 📄 `rapport_final_v12_DEFINITIF.docx` | **🏀 Dunk it** (`Ctrl + Maj + D`) |
| 📊 `Copie de budget_2024.xlsx` | ✂️ Couper / 📋 Copier |
| 🖼️ `photo_VACANCES_plage.jpg` | 🗑️ Supprimer (inchangé) |

---

### Étape 2 : L'arrivée sur le Parquet & Le Shoot

<div align="center">

```
========================================================================================
🏀 TRASHDUNK ARENA   |  Score: 249  |  Streak: 3 ×2  |  Cible: 43%  |  Corbeille: [ 03 ]
========================================================================================

                 [ PANIER / CORBEILLE NATIVE ]
                        +---------+
                        |  [43%]  |  <-- Cible Swish
                        +----+----+
                             |
                           \===/  <-- Filet Sunset Glow
                            \ /
                             v

             ( T I R   E N   C O U R S )
                 .  '  °  ^  °  '  .
              °                       °
            .                           .
           🏀 [PSD_logo_vectorisé.psd]     🗑️ Corbeille (3 dunks)
           (125.4 Mo)
 ______________________________________________________________________________________
  TIMING : [   AIR BALL   |==== PANIER ====|   SWISH (43%)   |==== REBOND ====|   0   ]
           [ 0%           |                |      [|||]      |                | 100%  ]
 --------------------------------------------------------------------------------------
                  ▲ Glissez vers le bas pour charger · Relâchez pour tirer ▲
========================================================================================
```

</div>

### Règles & Célébrations :
* **Swish (écart ≤ 2 %) :** Filet transpercé, le fichier va directement dans la corbeille native Windows.
* **2 swishs d'affilée = Mode COLD :** L'écran gèle instantanément, craquelures de glace et explosion finale avec le sticker collector **COLD** ❄️.
* **3 paniers réussis = Sunset Glow :** Parquet et anneau illuminés d'un dégradé fluorescent rouge / rose / orange avec multiplicateur de score.
* **Air ball (écart > 15 %) :** Le ballon rate le panier. **Le fichier n'est pas touché et reste sur le bureau.**
* **Sécurité Échap :** Annule immédiatement la session sans aucune suppression.

---

## 🚀 Deux versions disponibles

### 1. Version Démo Web / GitHub Pages
Testez immédiatement le jeu, la physique du ballon, les combos et les bruitages directement dans votre navigateur web sans rien installer :
👉 **[Accéder à la démo en ligne TrashDunk](https://dxne-dev.github.io/Trash-Dunk/)**

### 2. Version Native Windows (Tauri & .NET)
- Intégration dans le menu contextuel clic droit de Windows (`HKEY_CURRENT_USER\Software\Classes\*\shell\TrashDunk`).
- Rendu visuel 100% fidèle avec les effets de shaders, particules, confettis et sticker COLD.
- Suppression réelle vers la corbeille native via l'API Win32 Recycle Bin (`trash::delete`).
- Binaire autonome disponible directement dans le dossier [`dist-desktop/TrashDunk.exe`](./dist-desktop/TrashDunk.exe).

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

### 3. Lancer l'application Native Desktop (Tauri)
```bash
npx tauri dev
```

### 4. Compiler l'exécutable Windows `.exe`
```bash
npx tauri build
```
L'exécutable final se trouvera dans `src-tauri/target/release/TrashDunk.exe` (ou dans `dist-desktop/`).

---

## 🔒 Sécurité & Intégrité
- **Additif, jamais destructif :** TrashDunk n'écrase jamais la fonction native "Supprimer" de Windows.
- **Corbeille native :** Tout fichier dunké est envoyé à la corbeille Windows standard et peut être restauré à tout moment.
- **100% Hors-ligne :** Aucun upload, aucune télémétrie, tout s'exécute en local sur votre machine.

---

## 📜 Licence
MIT © [Dxne-Dev](https://github.com/Dxne-Dev)
