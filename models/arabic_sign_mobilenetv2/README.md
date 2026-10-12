# Arabic Sign Language MobileNetV2 — pending a verified checkpoint

## Status: no asset installed

MobileNetV2 is an architecture, not an Arabic Sign Language model. No verified, redistributable Arabic-specific MobileNetV2 checkpoint with complete class mapping, preprocessing contract, and usable license was found during this preparation. Therefore this directory intentionally contains no fake, ImageNet-only, or unverified weight file.

## Official architecture baseline (not an Arabic-sign model)

`imagenet_baseline/mobilenet_v2-b0353104.pth` is the official TorchVision `MobileNet_V2_Weights.IMAGENET1K_V1` checkpoint, downloaded from `https://download.pytorch.org/models/mobilenet_v2-b0353104.pth`.

- Size: 13.6 MB (14 MB on disk)
- SHA-256: `b03531047ffacf1e2488318dcd2aba1126cde36e3bfe1aa5cb07700aeeee9889`
- Provenance: PyTorch/TorchVision MobileNetV2 implementation; BSD-3-Clause source license.
- Input: RGB, resize 256 then center-crop 224, normalized by ImageNet mean `[0.485, 0.456, 0.406]` and standard deviation `[0.229, 0.224, 0.225]`.
- Output: 1,000 ImageNet categories.

It is deliberately **not configured** in `arabicSignRecognitionService`: it cannot return Arabic-sign labels. It is retained only to make the upstream architecture and fine-tuning starting point reproducible.

## What is available

- **Architecture:** MobileNetV2. `torchvision` supplies ImageNet-pretrained base weights, but those classify ImageNet labels, **not Arabic signs**.
- **Candidate training data:** ArSL2018, reported by its Kaggle distribution as 54,049 images across 32 Arabic sign/letter classes from 40 participants (63.14 MB listed there). Another dataset, ArSL21L, reports 14,202 images of 32 letter signs from 50 participants.
- **Candidate source code only:** JomanaMekheimar/ArSL---Arabic-Sign-Language describes a PyTorch MobileNetV2 system for 31 Arabic characters under MIT, but explicitly excludes its dataset and trained weights. It is not an installable checkpoint.
- **Archive requiring further provenance review:** Zenodo record 10.5281/zenodo.14715281 distributes a 15.6 MB project archive claiming 31-class static-letter recognition. The landing page does not declare a license or expose a sufficiently verifiable standalone checkpoint/class map; it was deliberately not imported.

## Required training/fine-tuning outcome

Produce and document all of the following before integration:

1. A chosen regional/dialect scope and an explicit label map (`classes.json`) in model-output order.
2. A MobileNetV2 checkpoint fine-tuned on the selected Arabic-sign dataset; record framework version, dataset version/license, split, augmentation, metrics, and checksum.
3. A preprocessing contract: hand-crop versus full frame, RGB order, input resolution, normalization, and tensor layout. The existing placeholder assumes `[1, 3, 224, 224]`, but this must match the trained model rather than be assumed.
4. A held-out evaluation including people/backgrounds not used in training and real-time webcam testing on the target device.
5. An export/inference format compatible with the selected runtime (PyTorch backend, ONNX Runtime, or TensorFlow Lite). The React client cannot run the current PyTorch-oriented service directly.

## Intended integration boundary

Use `src/services/arabicSignRecognitionService.ts` for browser-facing status/results and a future backend endpoint or browser-compatible runtime for actual inference. Keep the model binary, labels, license, source record, and checksum in this directory; keep service implementation separate under `src/services/` (frontend) or `backend/` (server).

This project currently recognizes neither Arabic signs nor English signs with MobileNetV2.

## References

- ArSL2018 distribution: https://www.kaggle.com/zssash/arabic-sign-language-image-classification/data
- ArSL21L dataset: https://github.com/MoyoG/ArSL21L
- Candidate code (weights excluded): https://github.com/JomanaMekheimar/ArSL---Arabic-Sign-Language
- Zenodo archive under review: https://doi.org/10.5281/zenodo.14715281
