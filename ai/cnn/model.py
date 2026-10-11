"""ConvNeXt V2-Nano CNN model module for MIRAGE AI.

Optimized for Apple Silicon (MPS - Metal Performance Shaders).
Uses timm library for lightweight, state-of-the-art vision classification.
"""

from typing import Dict, List, Optional, Tuple, Union
import torch
import torchvision.transforms as T
from PIL import Image

# 10 classes courantes par défaut (objets du quotidien / mini-dataset MIRAGE)
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

# Pipeline de prétraitement standard ConvNeXt (ImageNet stats)
TRANSFORM_INFERENCE = T.Compose([
    T.Resize(256, interpolation=T.InterpolationMode.BICUBIC),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def get_device() -> torch.device:
    """Sélectionne automatiquement MPS (Metal) sur Apple Silicon M4 ou CPU."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def create_convnext_model(
    num_classes: int = len(DEFAULT_CLASSES),
    pretrained: bool = True,
    checkpoint_path: Optional[str] = None,
    device: Optional[torch.device] = None,
) -> torch.nn.Module:
    """Instancie le CNN ConvNeXt V2-Nano via timm."""
    import timm

    target_device = device or get_device()
    model = timm.create_model(
        "convnextv2_nano",
        pretrained=pretrained if checkpoint_path is None else False,
        num_classes=num_classes,
    )

    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=target_device)
        state_dict = checkpoint.get("state_dict", checkpoint)
        model.load_state_dict(state_dict)

    model.to(target_device)
    model.eval()
    return model


class VisionPredictor:
    """Gestionnaire d'inférence léger pour la caméra en temps réel."""

    def __init__(
        self,
        class_names: Optional[List[str]] = None,
        checkpoint_path: Optional[str] = None,
        pretrained: bool = True,
    ):
        self.classes = class_names or DEFAULT_CLASSES
        self.device = get_device()
        self.model = create_convnext_model(
            num_classes=len(self.classes),
            pretrained=pretrained,
            checkpoint_path=checkpoint_path,
            device=self.device,
        )

    @torch.no_grad()
    def predict(self, image: Union[Image.Image, torch.Tensor]) -> Dict[str, Union[str, float, Dict[str, float]]]:
        """Effectue une prédiction sur une image PIL ou tenseur."""
        if isinstance(image, Image.Image):
            tensor = TRANSFORM_INFERENCE(image.convert("RGB")).unsqueeze(0).to(self.device)
        else:
            tensor = image.to(self.device)
            if tensor.ndim == 3:
                tensor = tensor.unsqueeze(0)

        outputs = self.model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        conf, pred_idx = torch.max(probabilities, dim=0)

        best_index = int(pred_idx.item())
        best_label = self.classes[best_index] if best_index < len(self.classes) else f"class_{best_index}"

        return {
            "label": best_label,
            "confidence": float(conf.item()),
            "index": best_index,
            "all_scores": {
                self.classes[i] if i < len(self.classes) else f"class_{i}": float(probabilities[i].item())
                for i in range(len(probabilities))
            },
        }
