"""Download and verify pre-trained weights for ConvNeXt V2-Nano.

Uses timm to cache the model weights cleanly without storing binary files in Git.
"""

import sys
from pathlib import Path

# Ajouter la racine du projet au sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))


def download_convnext_weights():
    print("[1/2] Importation des bibliothèques Deep Learning...")
    try:
        import torch
        import timm
    except ImportError as e:
        print(f"Erreur: Dépendances manquantes ({e}). Assurez-vous d'avoir activé le venv.")
        sys.exit(1)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"[2/2] Téléchargement du modèle pré-entraîné 'convnextv2_nano' vers le cache sur {device}...")

    model = timm.create_model("convnextv2_nano", pretrained=True, num_classes=10)
    model.to(device)
    model.eval()

    # Test d'inférence avec un tenseur factice (dummy input) pour valider le chargement
    dummy_input = torch.randn(1, 3, 224, 224, device=device)
    with torch.no_grad():
        output = model(dummy_input)

    print(f"✓ Succès ! ConvNeXt V2-Nano chargé et validé. Forme de sortie: {output.shape} sur {device}.")


if __name__ == "__main__":
    download_convnext_weights()
