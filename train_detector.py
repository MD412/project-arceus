from ultralytics import YOLO

# This script is a template for fine-tuning the YOLOv8 object detector.
#
# Prerequisites:
# 1. Ensure you have collected and annotated your "Hall of Failures" images
#    as described in training_data/README.md.
# 2. Ensure the annotated data is split into `train` and `valid` sets inside
#    the `training_data/annotated_data/images` and `labels` directories.
#    (Roboflow can do this automatically during export).
#
# How to run:
# pip install ultralytics
# python train_detector.py
#

def train_new_detector():
    """
    Fine-tunes a pretrained YOLOv8 model on our custom card dataset.
    """
    print("🚀 Starting detector fine-tuning process...")

    # Load a pretrained YOLOv8 model. 'yolov8n.pt' is the smallest and fastest.
    model = YOLO('yolov8n.pt')

    # Train the model using the `data.yaml` dataset configuration.
    # See https://docs.ultralytics.com/tasks/detect/#train for all available arguments.
    results = model.train(
        data='training_data/data.yaml',
        epochs=25,
        imgsz=640,
        pretrained=True,
        lr0=3e-3,
        warmup_epochs=3,
        patience=5,
        name='yolov8n_pokemon_cards_v2' # The output directory for the new model
    )

    print("✅ Training complete!")
    print("📈 Final metrics:", results.metrics)
    print("➡️ Your new model is saved in the `runs/detect/yolov8n_pokemon_cards_v2/weights/` directory.")
    print("   Look for `best.pt` and `last.pt`.")

if __name__ == '__main__':
    train_new_detector() 