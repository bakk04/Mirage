"""Download / organize mini-dataset for MIRAGE ConvNeXt V2-Nano CNN training.

Creates the standard directory layout:
datasets/
  train/
  val/
  test/
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"

DEFAULT_CLASSES = [
    "personne",
    "tasse",
    "clavier",
    "souris",
    "smartphone",
    "livre",
    "bouteille",
    "stylo",
    "montre",
    "ordinateur_portable",
]


def setup_dataset_structure():
    """Crée l'arborescence des dossiers train, val, test pour chaque classe."""
    print(f"Création de la structure dans {DATASETS_DIR}...")
    splits = ["train", "val", "test"]

    for split in splits:
        for cls_name in DEFAULT_CLASSES:
            target_dir = DATASETS_DIR / split / cls_name
            target_dir.mkdir(parents=True, exist_ok=True)

    print("✓ Structure de dossiers créée avec succès :")
    for split in splits:
        print(f"  - datasets/{split}/ ({len(DEFAULT_CLASSES)} classes prêtes)")


if __name__ == "__main__":
    setup_dataset_structure()
