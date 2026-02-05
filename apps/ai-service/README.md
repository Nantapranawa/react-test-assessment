# AI Engine Service

This service handles LLM logic and heavy data processing.

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running
```bash
uvicorn main:app --reload --port 8000
```
