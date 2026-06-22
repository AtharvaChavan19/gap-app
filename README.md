# 🌿 Gap Detection System

An AI-powered system designed to detect and map gaps (missing crops) in agricultural fields using aerial imagery and KML boundary files.

---

## ⚡ Quick Start

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies & run
pip install -r requirements.txt
python run.py
```
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
* **Model weights**: Already included at `backend/models/best.pt`.

### 2. Frontend Setup (React Native / Expo)
```bash
cd frontend
npm install
```

#### ⚙️ Configure local IP address:
For physical devices (Expo Go) to connect to your backend, you must use your machine's local IP address instead of `localhost`.
1. Run `ipconfig` (Windows) or `ifconfig` (macOS/Linux) to find your IPv4 address (e.g., `192.168.1.15`).
2. Create/edit `frontend/.env` and add:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://<YOUR_MACHINE_IP>:8000
   ```

#### 📱 Start the App:
```bash
npx expo start
# OR
npm start
```
Scan the QR code with your phone's camera (iOS) or Expo Go app (Android). Ensure both devices are on the **same Wi-Fi network**.

---

## 📁 Key File Locations

* **FastAPI Server**: `backend/main.py`
* **AI Service (YOLOv8 + KML Parse)**: `backend/services/gap_detection_service.py`
* **Mobile Views/Routes**: `frontend/src/app/`
  - `index.tsx` - Home screen
  - `gap-detection.tsx` - File upload & process screen
  - `results.tsx` - Dynamic map and analytics screen
