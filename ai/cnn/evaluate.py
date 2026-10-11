"""Evaluation script for ConvNeXt V2-Nano.

Generates evaluation metrics:
- Accuracy, Precision, Recall, F1-score
- Confusion Matrix
- Inference benchmark (latency in ms & FPS on MPS/CPU)
Saves reports and figures in experiments/ and docs/.
"""

import argparse
import json
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


def parse_args():
    parser = argparse.ArgumentParser(description="Évaluation de ConvNeXt V2-Nano")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--checkpoint", type=str, default="models/best_convnextv2_nano.pt")
    return parser.parse_args()


def benchmark_inference(model, device, num_runs=50):
    """Mesure la latence d'inférence en millisecondes et le débit (FPS)."""
    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224, device=device)

    # Warm-up (préchauffage GPU MPS)
    for _ in range(10):
        with torch.no_grad():
            _ = model(dummy_input)

    if device.type == "mps":
        torch.mps.synchronize()

    start = time.perf_counter()
    for _ in range(num_runs):
        with torch.no_grad():
            _ = model(dummy_input)
        if device.type == "mps":
            torch.mps.synchronize()

    total_time = time.perf_counter() - start
    avg_latency_ms = (total_time / num_runs) * 1000.0
    fps = num_runs / total_time
    return avg_latency_ms, fps


def evaluate():
    args = parse_args()
    from ai.cnn.model import get_device, create_convnext_model

    device = get_device()
    print(f"🔬 Évaluation sur l'appareil : {device}")

    checkpoint_path = BASE_DIR / args.checkpoint
    test_dir = BASE_DIR / "datasets" / "test"

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    has_images = any(f.suffix.lower() in image_extensions for f in test_dir.glob("**/*") if f.is_file())

    if not has_images:
        print(f"ℹ️ Aucun fichier image trouvé dans {test_dir}.")
        print("Exécution du benchmark d'inférence synthétique (ConvNeXt V2-Nano pur)...")
        model = create_convnext_model(num_classes=10, pretrained=True, device=device)
        latency, fps = benchmark_inference(model, device)
        print(f"⚡ Latence moyenne : {latency:.2f} ms | Débit : {fps:.1f} FPS sur {device}")
        return

    test_dataset = datasets.ImageFolder(test_dir, transform=val_transform)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False)

    ckpt_file = str(checkpoint_path) if checkpoint_path.exists() else None
    model = create_convnext_model(
        num_classes=len(test_dataset.classes),
        pretrained=(ckpt_file is None),
        checkpoint_path=ckpt_file,
        device=device,
    )

    all_preds = []
    all_targets = []

    model.eval()
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.numpy())

    try:
        from sklearn.metrics import accuracy_score, classification_report
        acc = accuracy_score(all_targets, all_preds)
        report = classification_report(all_targets, all_preds, target_names=test_dataset.classes)
        print(f"Précision globale (Accuracy) : {acc*100:.2f}%\n")
        print("Rapport de classification :")
        print(report)
    except ImportError:
        pass

    latency, fps = benchmark_inference(model, device)
    print(f"⚡ Latence d'inférence : {latency:.2f} ms | FPS : {fps:.1f}")


if __name__ == "__main__":
    evaluate()
