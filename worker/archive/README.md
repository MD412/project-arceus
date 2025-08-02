---
license: mit
tags:
- computer-vision
- object-detection
- yolo
- pokemon-cards
---

# Pokemon Card Detection Model

This is a YOLOv8 model trained to detect Pokemon cards in images.

## Model Details

- **Base Model**: YOLOv8s
- **Task**: Object Detection
- **Domain**: Pokemon Trading Cards
- **Framework**: Ultralytics YOLOv8

## Usage

```python
from ultralytics import YOLO

# Load the model
model = YOLO('pokemon_cards_trained.pt')

# Run inference
results = model('path/to/your/image.jpg')
```

## Training Data

This model was trained on a custom dataset of Pokemon card images.

## Performance

The model is optimized for detecting Pokemon cards in various lighting conditions and angles.
