from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import uvicorn
import json
import logging
from gpt_runtime import GPTRunTime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

import os

# Configuration
# Read from environment variable or fallback to localhost
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api/ai/analyze-response")

# Initialize LLM
gpt = GPTRunTime()

class ProcessData(BaseModel):
    data: dict

class SimulationRequest(BaseModel):
    employeeNik: str
    response: str

@app.get("/")
async def root():
    return {"message": "Hello World from Python AI Service with LLM"}

@app.post("/process")
async def process_data(payload: ProcessData):
    return {
        "status": "success",
        "message": "Data processed by Python AI",
        "result": payload.data
    }

# --- AI ANALYSIS ENDPOINT ---
@app.post("/analyze-response")
async def analyze_response(payload: SimulationRequest):
    logger.info(f"Received analysis request for Employee {payload.employeeNik}: {payload.response}")
    
    # 1. Try AI Logic with LLM First
    status = "unknown"
    reason = ""
    proposedDate = ""
    
    # THE PROMPT
    system_prompt = (
        "Anda adalah AI asisten yang bertugas mengkategorikan jawaban dari karyawan mengenai undangan asesmen.\n"
        "Kategorikan jawaban menjadi salah satu dari: 'accepted', 'rejected', atau 'reschedule'.\n"
        "Aturan Khusus untuk 'reschedule':\n"
        "- Jika karyawan meminta reschedule, mereka WAJIB memberikan tanggal dan waktu.\n"
        "- Jika mereka meminta reschedule TAPI tidak memberikan tanggal atau waktu yang spesifik, tetap set status 'reschedule', "
        "tapi berikan pesan balasan di field 'replyMessage' untuk meminta tanggal dan waktu secara sopan dalam bahasa Indonesia.\n"
        "Berikan jawaban dalam format JSON murni tanpa markdown: {\"status\": \"...\", \"reason\": \"...\", \"proposedDate\": \"...\", \"replyMessage\": \"...\"}.\n"
        "Status harus salah satu dari: 'accepted', 'rejected', 'reschedule', 'unknown'.\n"
        "Reason adalah alasan singkat dalam bahasa Indonesia.\n"
        "ProposedDate adalah tanggal atau waktu yang diusulkan jika ada, jika tidak ada kosongkan.\n"
        "ReplyMessage diisi HANYA jika status adalah 'reschedule' dan tanggal/waktu tidak ada. Jika sudah ada tanggal/waktu atau status bukan 'reschedule', kosongkan (\"\").\n"
        "Utamakan bahasa Indonesia yang sopan."
    )
    
    llm_response_text = gpt.generate_response(system_prompt, f"Jawaban karyawan: {payload.response}")
    
    replyMessage = ""
    
    if llm_response_text:
        try:
            # Try to parse JSON from LLM
            # Remove potential markdown formatting
            clean_json = llm_response_text.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
            elif clean_json.startswith("```"):
                clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
            
            ai_data = json.loads(clean_json.strip())
            status = ai_data.get("status", "unknown")
            reason = ai_data.get("reason", "")
            proposedDate = ai_data.get("proposedDate", "")
            replyMessage = ai_data.get("replyMessage", "")
            logger.info(f"LLM Success: {status} - {reason}")
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}. Falling back to keyword matching.")
            llm_response_text = None # Trigger fallback
    
    # 2. Fallback to Keyword Matching if LLM fails or returns nothing
    if not llm_response_text or status == "unknown":
        message = payload.response.lower()
        
        # Extended keywords for Indonesian and English fallback
        rejection_words = ['reject', 'no', 'cancel', 'unable', 'cannot', 'tolak', 'tidak bisa', 'batal', 'halangan', 'maaf']
        reschedule_words = ['reschedule', 'change date', 'postpone', 'jadwal ulang', 'ganti tanggal', 'tunda', 'undur', 'minggu depan', 'pindah jam']
        acceptance_words = ['accept', 'yes', 'confirm', 'ok', 'sure', 'setuju', 'bisa', 'siap', 'konfirmasi', 'oke', 'baik', 'hadir']
        
        if any(word in message for word in rejection_words):
            status = "rejected"
            reason = "AI mendeteksi kata kunci penolakan"
        elif any(word in message for word in reschedule_words):
            status = "reschedule"
            proposedDate = ""  # Let backend detect missing date
            reason = "AI mendeteksi kata kunci penjadwalan ulang"
            replyMessage = "Mohon maaf, silakan berikan tanggal dan waktu yang diusulkan untuk penjadwalan ulang."
        elif any(word in message for word in acceptance_words):
            status = "accepted"
            reason = "AI mendeteksi kata kunci persetujuan"
        
        logger.info(f"Fallback Matching Result: {status}")

    # 3. Prepare payload for the Backend
    backend_payload = {
        "employeeNik": payload.employeeNik,
        "response": payload.response,
        "aiStatus": status,
        "reason": reason,
        "proposedDate": proposedDate,
        "replyMessage": replyMessage
    }
    
    try:
        # 4. Send to Backend
        response = requests.post(BACKEND_URL, json=backend_payload)
        
        return {
            "ai_service_analysis": {
                "determined_status": status,
                "reason": reason,
                "proposed_date": proposedDate,
                "reply_message": replyMessage,
                "method": "llm" if llm_response_text else "fallback"
            },
            "backend_response_code": response.status_code,
            "backend_response": response.json()
        }
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Backend server (localhost:8000) is not reachable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # In Railway, the port is provided as an environment variable
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
