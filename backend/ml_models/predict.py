import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image
import io
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
from recommendations import recommendations_db

MODEL_PATH = os.path.join(BASE_DIR, "my_plant_disease_model.h5")

CLASS_NAMES = [
'pepper_bell_bacterial_spot','pepper_bell_healthy',
'potato_early_blight','potato_healthy','potato_late_blight',
'tomato_bacterial_spot','tomato_early_blight','tomato_healthy',
'tomato_late_blight','tomato_leaf_mold','tomato_septoria_leaf_spot',
'tomato_spider_mites_two_spotted_spider_mite','tomato_target_spot',
'tomato_tomato_mosaic_virus','tomato_tomato_yellowleaf_curl_virus'
]

model = load_model(MODEL_PATH, compile=False)

try:
    # Receive image from Node.js
    image_bytes = sys.stdin.buffer.read()

    img = Image.open(io.BytesIO(image_bytes)).resize((128,128))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array, verbose=0)

    confidence = float(np.max(predictions) * 100)
    label_id = CLASS_NAMES[np.argmax(predictions)]

    # Format disease name
    disease_formatted = label_id.replace("_", " ").title()
    
    # Determine category
    category = "Unknown"
    if "healthy" in label_id:
        category = "Healthy"
    elif "bacterial" in label_id:
        category = "Bacterial"
    elif "virus" in label_id:
        category = "Viral"
    else:
        category = "Fungal" # Fallback

    recommendation = recommendations_db.get(label_id, {})
    treatment = f"Irrigation: {recommendation.get('irrigation', '')}\nFertilization: {recommendation.get('fertilization', '')}\nPest Control: {recommendation.get('pest_control', '')}"
    prevention = recommendation.get('prevention', 'No specific prevention available.')

    result = {
        "disease": disease_formatted,
        "category": category,
        "confidence": round(confidence, 2),
        "advice": {
            "treatment": treatment,
            "prevention": prevention
        }
    }

    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)