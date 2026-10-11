"""Grad-CAM (Gradient-weighted Class Activation Mapping) for ConvNeXt V2-Nano.

Enables visual explainability by highlighting the image regions that contributed
most to the CNN prediction.
"""

from pathlib import Path
from typing import Optional, Tuple
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from ai.cnn.model import TRANSFORM_INFERENCE, get_device


class ConvNeXtGradCAM:
    """Implémentation Grad-CAM légère adaptée à ConvNeXt V2."""

    def __init__(self, model: torch.nn.Module, target_layer: Optional[torch.nn.Module] = None):
        self.model = model
        self.device = next(model.parameters()).device
        self.gradient = None
        self.activations = None

        # Si target_layer non fourni, cibler la dernière étape/stage de ConvNeXt
        if target_layer is None:
            if hasattr(model, "stages"):
                target_layer = model.stages[-1]
            elif hasattr(model, "features"):
                target_layer = model.features[-1]
            else:
                # fallback sur le dernier module d'extraction
                modules = [m for m in model.children() if not isinstance(m, (torch.nn.Linear, torch.nn.Dropout))]
                target_layer = modules[-1] if modules else model

        self.target_layer = target_layer
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_in, grad_out):
            self.gradient = grad_out[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_cam(self, image_pil: Image.Image, target_class: Optional[int] = None) -> Tuple[np.ndarray, int, float]:
        """Génère la heatmap Grad-CAM et la superpose sur l'image d'origine."""
        self.model.eval()
        input_tensor = TRANSFORM_INFERENCE(image_pil.convert("RGB")).unsqueeze(0).to(self.device)

        # Forward pass
        output = self.model(input_tensor)
        probabilities = F.softmax(output, dim=1)[0]

        if target_class is None:
            target_class = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[target_class].item())

        # Backward pass
        self.model.zero_grad()
        loss = output[0, target_class]
        loss.backward()

        # Calcul des poids d'importance via global average pooling des gradients
        # ConvNeXt activations shape: (B, C, H, W) ou (B, H, W, C)
        act = self.activations
        grad = self.gradient

        if act.dim() == 4 and act.shape[1] != grad.shape[1]:
            # Permute si format channels_last
            act = act.permute(0, 3, 1, 2)
            grad = grad.permute(0, 3, 1, 2)

        weights = torch.mean(grad, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * act, dim=1).squeeze().cpu().detach().numpy()

        # ReLU pour ne garder que les activations positives
        cam = np.maximum(cam, 0)
        if np.max(cam) > 0:
            cam = cam / np.max(cam)

        # Redimensionnement de la heatmap aux dimensions de l'image
        orig_w, orig_h = image_pil.size
        heatmap = cv2.resize(cam, (orig_w, orig_h))
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)

        orig_np = np.array(image_pil.convert("RGB"))
        orig_bgr = cv2.cvtColor(orig_np, cv2.COLOR_RGB2BGR)

        # Superposition 60% image originale + 40% heatmap
        overlay = cv2.addWeighted(orig_bgr, 0.6, heatmap_colored, 0.4, 0)
        overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)

        return overlay_rgb, target_class, confidence
