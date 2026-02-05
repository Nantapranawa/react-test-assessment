from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from io import BytesIO
import numpy as np
import json

class NaNEncoder(json.JSONEncoder):
    def encode(self, o):
        if isinstance(o, float):
            if np.isnan(o) or np.isinf(o):
                return "null"
        return super().encode(o)
    
    def iterencode(self, o, _one_shot=False):
        for chunk in super().iterencode(o, _one_shot=_one_shot):
            yield chunk

app = FastAPI()

# --- CORS SETTINGS (Crucial for FE/BE communication) ---
# This allows your Next.js app (running on port 3000) to talk to this Python app.
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from Python Backend!"}

@app.get("/api/data")
def get_data():
    return {"users": ["Alice", "Bob", "Charlie"]}

@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload and parse Excel file"""
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Parse Excel file using pandas
        df = pd.read_excel(BytesIO(contents))
        
        # Replace NaN with None
        df = df.fillna(value='')
        
        # Convert dataframe to list of dictionaries
        data = []
        for _, row in df.iterrows():
            record = {}
            for col in df.columns:
                val = row[col]
                # Handle NaN, inf, and other non-serializable values
                if isinstance(val, (float, np.floating)):
                    if np.isnan(val) or np.isinf(val):
                        record[col] = None
                    else:
                        record[col] = float(val)
                elif isinstance(val, (int, np.integer)):
                    record[col] = int(val)
                elif pd.isna(val):
                    record[col] = None
                else:
                    record[col] = str(val) if val != '' else None
            data.append(record)
        
        columns = df.columns.tolist()
        
        return {
            "success": True,
            "columns": columns,
            "data": data,
            "row_count": len(data)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
