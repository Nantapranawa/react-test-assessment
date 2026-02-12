from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import uvicorn

app = FastAPI()

# Configuration
BACKEND_URL = "http://localhost:8000/api/ai/analyze-response"

class ProcessData(BaseModel):
    data: dict

class SimulationRequest(BaseModel):
    employeeNik: str
    response: str

@app.get("/")
async def root():
    return {"message": "Hello World from Python AI Service"}

@app.post("/process")
async def process_data(payload: ProcessData):
    # This is a placeholder for actual AI logic
    return {
        "status": "success",
        "message": "Data processed by Python AI",
        "result": payload.data
    }

# --- SIMULATION ENDPOINT ---
# This endpoint simulates the AI Service "thinking" and then telling the Backend what to do.
@app.post("/simulate/respond")
async def simulate_response(payload: SimulationRequest):
    print(f"Received simulation request for Employee {payload.employeeNik}: {payload.response}")
    
    # 1. AI Logic happens HERE in Python
    # We analyze the text to determine the intent/status
    message = payload.response.lower()
    status = "unknown"
    reason = ""
    proposedDate = ""
    
    if any(word in message for word in ['reject', 'no', 'cancel', 'unable', 'cannot']):
        status = "rejected"
        reason = "AI detected rejection keywords in message"
    elif any(word in message for word in ['reschedule', 'change date', 'postpone']):
        status = "reschedule"
        proposedDate = "AI detected reschedule request"
    elif any(word in message for word in ['accept', 'yes', 'confirm', 'ok', 'sure']):
        status = "accepted"
    
    # 2. Prepare payload for the Backend
    # Now we send the *result* of our analysis, not just the raw text
    backend_payload = {
        "employeeNik": payload.employeeNik,
        "response": payload.response,   # Original message
        "aiStatus": status,             # AI Determined Status
        "reason": reason,
        "proposedDate": proposedDate
    }
    
    try:
        # 3. Send to Backend
        # We are hitting the endpoint: /api/ai/analyze-response
        response = requests.post(BACKEND_URL, json=backend_payload)
        
        # 4. Return result
        return {
            "ai_service_analysis": {
                "determined_status": status,
                "reason": reason
            },
            "backend_response_code": response.status_code,
            "backend_response": response.json()
        }
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Backend server (localhost:8000) is not reachable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
