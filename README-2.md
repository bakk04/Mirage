# 🔮 MIRAGE AI Companion — Feuille de Route « Ultra-Avancée »

> **Statut actuel du projet :**  
> ✅ Interface UI/UX & Design terminée (React 19 + Tailwind CSS + WebGL Orb).  
> ✅ Environnement backend Python 3.11 opérationnel avec accélération GPU Apple Silicon M4 (MPS).  
> ✅ Dépendances installées (PyTorch 2.14, timm, OpenCV, FastAPI, Whisper, Google GenAI, scikit-learn).  
> ✅ Architecture backend, mémoire tampon circulaire et module Grad-CAM validés.  
> ✅ Benchmark ConvNeXt V2-Nano validé : **10.74 ms / 93 FPS** sur GPU M4.  
>
> 🎯 **Ce document détaille EXCLUSIVEMENT les étapes restantes pour amener MIRAGE au niveau « Ultra-Avancé ».**

---

## 🗺️ Vue d'ensemble des 6 étapes restantes

```
[Étape 1] Mini-Dataset ➔ [Étape 2] Fine-tuning CNN ➔ [Étape 3] Évaluation & Grad-CAM
       ↓
[Étape 4] Pont WebSocket Frontend-Backend ➔ [Étape 5] Multimodalité & APIs ➔ [Étape 6] Rapport & Démo
```

---

## 🚀 ÉTAPE 1 — Préparation du Mini-Dataset (50–150 Mo)

Le CNN est la composante académique maîtresse du projet. Il nécessite un jeu de données propre et équilibré.

### Actions à réaliser :
1. **Sélection des 10 classes du quotidien** :
   - `personne`, `tasse`, `clavier`, `souris`, `smartphone`, `livre`, `bouteille`, `stylo`, `montre`, `ordinateur_portable` (ou un sous-ensemble d'**Imagenette 160px**).
2. **Collecte / Répartition** :
   - ~150 à 250 images par classe au format JPEG/PNG.
   - Répartition automatique : **70% train**, **15% val**, **15% test**.
3. **Arborescence cible** (déjà générée par `scripts/download_data.py`) :
   ```text
   datasets/
   ├── train/   (70%)
   ├── val/     (15%)
   └── test/    (15%)
   ```
4. **Commande de vérification** :
   ```bash
   ./venv/bin/python scripts/download_data.py
   ```

---

## 🧠 ÉTAPE 2 — Fine-tuning du CNN (ConvNeXt V2-Nano)

Entraîner le CNN moderne **ConvNeXt V2-Nano** (15.6M paramètres) avec accélération matérielle Metal (MPS).

### Actions à réaliser :
1. **Lancer l'entraînement avec le script optimisé** :
   ```bash
   ./venv/bin/python ai/cnn/train.py --epochs 30 --batch-size 32 --lr 1e-4 --patience 5
   ```
2. **Spécifications d'optimisation incluses** :
   - **Optimiseur** : Adam (`lr = 1e-4`).
   - **Data Augmentation** : Redimensionnement 224×224, RandomHorizontalFlip, ColorJitter.
   - **Early Stopping** : Arrêt automatique si la loss de validation ne s'améliore plus après 5 époques.
   - **Stockage optimisé** : Sauvegarde uniquement du meilleur checkpoint dans `models/best_convnextv2_nano.pt` (~60 Mo).

---

## 📊 ÉTAPE 3 — Évaluation Complète & Explicabilité Grad-CAM (Partie Notée)

Produire les métriques scientifiques rigoureuses exigées pour la notation.

### Actions à réaliser :
1. **Lancer l'évaluation sur le jeu de test** :
   ```bash
   ./venv/bin/python ai/cnn/evaluate.py --checkpoint models/best_convnextv2_nano.pt
   ```
2. **Métriques générées automatiquement** :
   - **Accuracy, Précision, Rappel, F1-score** (par classe et moyenne pondérée).
   - **Matrice de confusion** pour identifier les confusions types (ex: souris vs smartphone).
   - **Benchmark matériel** : Latence moyenne (ms) et débit (FPS) sur la puce Apple Silicon M4.
3. **Explicabilité visuelle (Grad-CAM)** :
   - Générer les heatmaps d'attention visuelle sur au moins 3 cas concrets :
     ```bash
     ./venv/bin/python -c "from ai.cnn.gradcam import ConvNeXtGradCAM; print('Génération heatmaps')"
     ```
   - Vérifier que le réseau focalise bien ses activations sur l'objet et non sur le fond.

---

## ⚡ ÉTAPE 4 — Connexion Temps Réel Frontend ↔ Backend (WebSocket Bridge)

Relier l'interface React / Vite existante au serveur FastAPI pour donner vie au compagnon.

### Actions à réaliser :
1. **Activer le WebSocketBridge dans le frontend** :
   - Dans le fichier `src/lib/mirageBridge.ts`, brancher la classe `WebSocketBridge` sur l'URL `ws://localhost:8000/ws`.
2. **Protocole d'échange temps réel bidirectionnel** :
   - **Frontend ➔ Backend** :
     - `frame` : flux vidéo caméra capturé à intervalle régulier (base64 / blob).
     - `text` : requêtes de l'utilisateur saisies ou dictées.
   - **Backend ➔ Frontend** :
     - `detection` : `{ label: "tasse", confidence: 0.94 }` (met à jour la StatusPill et l'Orbe).
     - `answer` : réponse empathique générée par Gemini.
     - `memory` : synchronisation du journal des événements récents.
     - `image` : création conceptuelle affichée dans l'état `ImagineState`.
3. **Lancer le backend en direct** :
   ```bash
   ./venv/bin/uvicorn backend.main:app --reload --port 8000
   ```

---

## 🌐 ÉTAPE 5 — Synergie Multimodale & Activation des APIs (.env)

Transformer l'application en un assistant compagnon autonome ultra-avancé en renseignant vos clés dans `.env`.

### 1. Activer votre fichier d'environnement :
```bash
cp .env.example .env
```

### 2. Clés et rôles dans l'expérience utilisateur :
| Clé API | Rôle dans MIRAGE AI | Obligatoire ? |
|---|---|---|
| **`GEMINI_API_KEY`** | **Cerveau multimodal** : combine ce que voit le CNN + la mémoire des 30 derniers événements + la parole pour formuler une réponse naturelle et contextuelle. | **Oui** (Gratuit sur Google AI Studio) |
| **`HF_TOKEN`** | **Moteur créatif (FLUX.1-schnell)** : génère en quelques secondes une ré-imagination futuriste de la scène sans faire chauffer le Mac. | Recommandé (Gratuit) |
| **`ELEVENLABS_API_KEY`** | **Voix ultra-naturelle** : synthèse vocale humaine haute fidélité (avec fallback automatique sur `speechSynthesis` du navigateur). | Optionnel |
| **`OPENAI_API_KEY`** | **Whisper Cloud** : transcription vocale ultra-rapide alternative au Whisper local embarqué. | Optionnel |

---

## 🏆 ÉTAPE 6 — Rapport Académique, Démo de Secours & Soutenance

Finaliser les livrables pour garantir la note maximale.

### 1. Rapport technique (`docs/rapport.md`) :
- **Architecture** : Justification du choix de ConvNeXt V2-Nano (architecture CNN moderne à convolutions 7×7 et GRN).
- **Entraînement** : Courbes de perte et d'exactitude (train vs validation).
- **Résultats** : Tableau comparatif, matrice de confusion, temps de calcul et FPS sur M4.
- **Interprétabilité** : Analyse des cartes d'activation Grad-CAM.
- **Limites & Éthique** : Confidentialité de la caméra locale, biais potentiels du dataset.

### 2. Démo de secours (Plan B garanti) :
- Enregistrer une courte vidéo de démonstration (1 à 2 minutes) montrant le fonctionnement complet caméra + voix + créativité.
- Grâce au module `ai/agent/creative.py`, le système intègre déjà un fallback SVG local instantané qui empêche tout plantage même en cas de coupure internet pendant la présentation.

---

## 📋 Checklist Finale avant Rendu

- [ ] `datasets/train`, `val`, `test` configurés.
- [ ] Entraînement terminé avec checkpoint `models/best_convnextv2_nano.pt`.
- [ ] Rapport d'évaluation et figures Grad-CAM enregistrés dans `experiments/` et `docs/`.
- [ ] Clé `GEMINI_API_KEY` renseignée dans `.env`.
- [ ] Frontend et Backend synchronisés via WebSocket.
- [ ] Dépôt Git propre (< 100 Mo, vérifié sans gros fichiers binaires).
