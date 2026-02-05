# Project Monorepo

This project is structured with a Next.js frontend, a TypeScript Express backend, and a Python AI service.

## Project Structure
- **apps/web**: Next.js Frontend.
- **backend**: TypeScript Express Backend (Port 8000). Handles data and bridges to AI service.
- **ai_service**: Python FastAPI Service (Port 8001). Handles AI/ML processing logic.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.8+

### 1. TypeScript Backend
The backend is responsible for API routing and communicating with the AI service.
```bash
cd backend
npm install
npm run dev
```

### 2. Python AI Service
A simple FastAPI "Hello World" service to get you started with Python processing.
```bash
cd ai_service
# Recommended: Create and activate a virtual environment
# python -m venv venv
# venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend (Web)
```bash
cd apps/web
npm install
npm run dev
```

## API Endpoints
- **GET** `http://localhost:8000/api/ai/status`: Check health of Backend and AI Service.
- **POST** `http://localhost:8000/api/process`: Endpoint used by the frontend to process data via the AI service.
- **POST** `http://localhost:8000/api/data/upload-excel`: Upload and parse Excel files.
