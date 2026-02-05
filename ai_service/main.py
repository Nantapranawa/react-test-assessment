from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ProcessData(BaseModel):
    data: dict

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
