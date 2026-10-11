"""Training script for ConvNeXt V2-Nano on the MIRAGE mini-dataset.

Features:
- Adam optimizer with lr=1e-4
- Apple Silicon GPU (MPS) acceleration
- Early stopping to prevent overfitting
- Saves only the best checkpoint in models/
"""

import argparse
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


def parse_args():
    parser = argparse.ArgumentParser(description="Entraînement de ConvNeXt V2-Nano")
    parser.add_argument("--epochs", type=int, default=30, help="Nombre max d'époques")
    parser.add_argument("--batch-size", type=int, default=32, help="Taille des batches")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--patience", type=int, default=5, help="Patience pour early stopping")
    return parser.parse_args()


def train():
    args = parse_args()
    from ai.cnn.model import get_device, create_convnext_model

    device = get_device()
    print(f"🚀 Démarrage de l'entraînement sur : {device}")

    # Transforms avec augmentation légère pour l'entraînement
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    data_dir = BASE_DIR / "datasets"
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"

    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    has_train_images = any(f.suffix.lower() in image_extensions for f in train_dir.glob("**/*") if f.is_file())

    if not has_train_images:
        print(f"⚠️ Aucun fichier image (.jpg, .png, etc.) trouvé dans {train_dir}.")
        print("Veuillez d'abord préparer ou télécharger les données d'entraînement dans datasets/train/<classe>/.")
        return

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform) if val_dir.exists() else None

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False) if val_dataset else None

    num_classes = len(train_dataset.classes)
    model = create_convnext_model(num_classes=num_classes, pretrained=True, device=device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)

    models_dir = BASE_DIR / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    best_val_loss = float("inf")
    patience_counter = 0

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = correct / total

        print(f"Époque {epoch}/{args.epochs} - Train Loss: {epoch_loss:.4f} - Train Acc: {epoch_acc*100:.2f}%")

        if val_loader:
            model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    val_loss += loss.item() * images.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_correct += (preds == labels).sum().item()
                    val_total += labels.size(0)

            epoch_val_loss = val_loss / val_total
            epoch_val_acc = val_correct / val_total
            print(f"          - Val Loss: {epoch_val_loss:.4f} - Val Acc: {epoch_val_acc*100:.2f}%")

            if epoch_val_loss < best_val_loss:
                best_val_loss = epoch_val_loss
                patience_counter = 0
                best_model_path = models_dir / "best_convnextv2_nano.pt"
                torch.save({"state_dict": model.state_dict(), "classes": train_dataset.classes}, best_model_path)
                print(f"⭐ Meilleur modèle sauvegardé dans {best_model_path}")
            else:
                patience_counter += 1
                if patience_counter >= args.patience:
                    print(f"⏹️ Early stopping déclenché après {epoch} époques.")
                    break


if __name__ == "__main__":
    train()
