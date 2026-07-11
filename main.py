from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from datetime import datetime, timezone
from dotenv import load_dotenv
from twilio.rest import Client
import shutil, os, uuid, tempfile
import random

# Load env FIRST before anything else
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("aeroguard_best.pt")

# Twilio config — reads from .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")
TWILIO_WHATSAPP_TO = os.getenv("TWILIO_WHATSAPP_TO")

# Initialize client after loading env
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_whatsapp_alert(detection_count, highest_confidence, timestamp, lat, lng):
    message = (
        f"🚨 *AEROGUARD AI — SPILL ALERT*\n"
        f"{'─' * 30}\n\n"
        f"An oil spill has been detected in an active pipeline corridor.\n\n"
        f"*📊 Detection Summary*\n"
        f"▸ Spills identified: {detection_count}\n"
        f"▸ Confidence score: {highest_confidence}%\n"
        f"▸ Detection time: {timestamp}\n\n"
        f"*📍 Incident Location*\n"
        f"▸ Region: Niger Delta, Nigeria\n"
        f"▸ Coordinates: {lat:.4f}°N, {lng:.4f}°E\n\n"
        f"*⚡ Required Action*\n"
        f"Dispatch field response team immediately.\n"
        f"Contain spill before emulsification occurs.\n\n"
        f"─────────────────────────\n"
        f"_Powered by AeroGuard AI_\n"
        f"_Automated Environmental Monitor_"
    )
    twilio_client.messages.create(
        body=message,
        from_=TWILIO_WHATSAPP_FROM,
        to=TWILIO_WHATSAPP_TO
    )

@app.get("/")
def root():
    return {"message": "AeroGuard AI backend is running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    temp_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    results = model(temp_path, conf=0.25)[0]
    os.remove(temp_path)

    detections = []
    for box in results.boxes:
        confidence = float(box.conf[0])
        bbox = box.xyxy[0].tolist()
        detections.append({
            "confidence": round(confidence, 3),
            "bbox": [round(x, 1) for x in bbox]
        })

    detections.sort(key=lambda x: x["confidence"], reverse=True)

    highest_confidence = detections[0]["confidence"] * 100 if detections else 0.0
    status = "Alert" if len(detections) > 0 else "Clear"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Fire WhatsApp alert on detection
    lat = 4.88 + (random.uniform(-0.4, 0.4))
    lng = 6.03 + (random.uniform(-0.4, 0.4))

    if status == "Alert" and highest_confidence >= 50:
        try:
            send_whatsapp_alert(len(detections), round(highest_confidence, 1), timestamp, lat, lng)
        except Exception as e:
            print(f"WhatsApp alert failed: {e}")

    return {
        "status": status,
        "detection_count": len(detections),
        "highest_confidence": round(highest_confidence, 1),
        "detections": detections,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }