
#  Phyto – Plant Disease Detection System

Phyto is a full‑stack web application that detects plant diseases from leaf images using a deep learning model. Users upload a plant leaf image and receive the predicted disease along with a confidence score.

---

##  Features

- Upload plant leaf images
- Detect plant diseases using a trained CNN model
- Return prediction and confidence score
- Node.js backend integrated with Python ML model
- Simple web interface for testing predictions

---

##  Architecture

Frontend → Backend API → ML Bridge → Python Model → Prediction → Frontend

1. User uploads image from frontend.
2. Frontend sends image to backend API.
3. Backend passes image buffer to Python using child_process.
4. Python loads TensorFlow model and predicts disease.
5. Result is returned as JSON.
6. Frontend displays prediction and confidence.

---

## Technologies Used

Frontend
- React
- Vite
- HTML
- CSS
- JavaScript

Backend
- Node.js
- Express.js
- express-fileupload

Machine Learning
- TensorFlow
- Keras
- NumPy
- Pillow

---

## Installation

### Clone repository

git clone https://github.com/yourusername/phyto.git
cd phyto

---

### Install Backend Dependencies

cd backend
npm install

---

### Install Python Dependencies

pip install tensorflow numpy pillow

---

### Install Frontend Dependencies

cd ../frontend
npm install

---

## Running the Project

### Start Backend

cd backend
npm start

Backend runs on:
http://localhost:5000

---

### Start Frontend

cd frontend
npm run dev

Frontend runs on:
http://localhost:5173

---

## API Endpoint

POST /api/v1/plants/analyze

Request:
multipart/form-data

image : plant_leaf.jpg

Response Example:

{
  "status": "success",
  "data": {
    "class": "tomato_late_blight",
    "confidence": 94.2,
    "timestamp": "2026-03-07T10:20:00Z"
  }
}

---

## Common Issues

Model loading error

Ensure the model file exists in:

backend/ml_models/my_plant_disease_model.h5

The file must not be empty.

---

## Author

Rohith William G

---

## License

This project is for educational purposes.
