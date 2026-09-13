

---

```markdown
# AeroGuard AI 🛰️
**Automated Oil Spill Detection from Aerial Imagery**

AeroGuard AI uses a fine-tuned YOLOv8 computer vision 
model to detect oil spills from drone or satellite 
imagery in real time. When a spill is detected, the 
system automatically alerts a field agent via WhatsApp 
and plots the incident location on a live Niger Delta map.

Built by a student team from the University of Benin.

---

## Model Performance

| Metric | Value |
|--------|-------|
| mAP@50 | 82.8% |
| Precision | 78.3% |
| Recall | 79.8% |
| Inference Speed | 6.1ms |
| Training Epochs | 50 |
| Training Images | 354 |

---

## Tech Stack

- **Model:** YOLOv8n (Ultralytics)
- **Backend:** FastAPI (Python)
- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **Map:** Leaflet.js
- **Alerts:** Twilio WhatsApp API

---

## Project Structure

```
aeroguard-ai/
├── backend/
│   ├── main.py            
│   ├── requirements.txt   
│   └── .env.example       
├── frontend/
│   ├── index.html         
│   ├── app.js             
│   └── styles.css         
└── training/
    ├── train.ipynb        
    └── label_fix.py       
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/emmex43/Aeroguard-AI.git
cd aeroguard-ai
```

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Download model weights

Download `aeroguard_best.pt`, 


already available inside the `backend/` folder.

### 4. Set up environment variables

```bash
cp .env.example .env
```

Fill in your Twilio credentials in `.env`:

```
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+your_number
```

### 5. Run the backend

```bash
uvicorn main:app --reload
```

### 6. Open the dashboard

Open `frontend/index.html` in your browser.

---

## Training Data

| Dataset | Images | Source |
|---------|--------|--------|
| oil-spill by wwj | 253 | [Roboflow](https://universe.roboflow.com/wwj-bjihs/oil-spill-ed2aj) |
| oil-spill by khalid ALHilali | 218 | [Roboflow](https://universe.roboflow.com/khalid-alhilali/oil-spill-eojff) |

Both datasets licensed under CC BY 4.0.

---

## API

### POST /detect
Upload an image for oil spill detection.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "status": "Alert",
  "detection_count": 1,
  "highest_confidence": 88.1,
  "detections": [
    {
      "confidence": 0.881,
      "bbox": [150.5, 200.0, 400.0, 450.5]
    }
  ],
  "timestamp": "2026-07-11T00:30:07Z"
}
```

---

## Known Limitations

- Optimized for water-based spills — soil and 
  mangrove detection needs more training data
- Daylight imagery only — night detection 
  not yet supported
- Dataset size is small (354 images) — 
  more Niger Delta specific data needed

---

## Contributing

Contributions are welcome especially in:

- Niger Delta aerial imagery (labeled or unlabeled)
- Model accuracy improvements
- Soil and mangrove spill detection data
- Any ideas that make this better

Open an issue or submit a pull request.

---

## License

MIT License — free to use, modify, and distribute.

---

## Team

**Akhabue Ehime and Micheal Efe** — University of Benin, Nigeria

akhabueemmanuel43@gmail.com

---

## Acknowledgements

- [Ultralytics](https://github.com/ultralytics/ultralytics)
- [Roboflow Universe](https://universe.roboflow.com)
- [Twilio](https://twilio.com)
- [Leaflet.js](https://leafletjs.com)
- [FastAPI](https://fastapi.tiangolo.com)
```

---

Replace `yourusername` and `your-drive-link-here` before pushing. That's it.
