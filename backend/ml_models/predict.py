import os
import sys
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import json
import io
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf

tf.get_logger().setLevel('ERROR')

# Limit CPU threading overhead
try:
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.threading.set_intra_op_parallelism_threads(2)
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
from recommendations import recommendations_db

MODEL_PATH = os.path.join(BASE_DIR, "my_plant_disease_model.h5")

CLASS_NAMES = [
    'pepper_bell_bacterial_spot', 'pepper_bell_healthy',
    'potato_early_blight', 'potato_healthy', 'potato_late_blight',
    'tomato_bacterial_spot', 'tomato_early_blight', 'tomato_healthy',
    'tomato_late_blight', 'tomato_leaf_mold', 'tomato_septoria_leaf_spot',
    'tomato_spider_mites_two_spotted_spider_mite', 'tomato_target_spot',
    'tomato_tomato_mosaic_virus', 'tomato_tomato_yellowleaf_curl_virus'
]

model = None
def get_model():
    global model
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    return model

try:
    image_bytes = sys.stdin.buffer.read()
    if not image_bytes:
        print(json.dumps({"error": "Empty image input received"}))
        sys.exit(1)

    # Open image, handle EXIF orientation, and convert to RGB (handles RGBA PNGs and Grayscale)
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)
    img = img.convert('RGB')
    img = img.resize((128, 128))

    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    clf_model = get_model()
    predictions = clf_model.predict(img_array, verbose=0)

    max_idx = int(np.argmax(predictions[0]))
    raw_confidence = float(predictions[0][max_idx] * 100)
    label_id = CLASS_NAMES[max_idx]

    is_low_confidence = raw_confidence < 40.0
    disease_formatted = label_id.replace("_", " ").title()

    category = "Unknown"
    if "healthy" in label_id:
        category = "Healthy"
    elif "bacterial" in label_id:
        category = "Bacterial"
    elif "virus" in label_id:
        category = "Viral"
    else:
        category = "Fungal"

    recommendation = recommendations_db.get(label_id, {})
    treatment = f"Irrigation: {recommendation.get('irrigation', 'Ensure appropriate soil moisture.')}\nFertilization: {recommendation.get('fertilization', 'Apply balanced nutrients as needed.')}\nPest Control: {recommendation.get('pest_control', 'Monitor regularly for pest activity.')}"
    prevention = recommendation.get('prevention', 'Maintain clean tools, proper spacing, and good soil drainage.')

    result = {
        "disease": disease_formatted if not is_low_confidence else f"{disease_formatted} (Uncertain)",
        "label_id": label_id,
        "category": category,
        "confidence": round(raw_confidence, 2),
        "low_confidence": is_low_confidence,
        "advice": {
            "treatment": treatment,
            "prevention": prevention
        }
    }

    if is_low_confidence:
        result["warning"] = "Low confidence detection. Please provide a clearer, well-lit photo of a single plant leaf."

    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)