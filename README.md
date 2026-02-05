# Project Monorepo

This project is structured as a Monorepo using npm workspaces.

## Structure
- **apps/web**: Next.js Application (Frontend + TypeScript Backend/API).
- **apps/ai-service**: Python Service for LLM Logic and Data Processing.

## Getting Started

### Prerequisites
- Node.js
- Python 3.x

### Installation
From the root directory:
```bash
npm install
```

### Running the App
You can run the workspaces individually.

**Web (Frontend + API):**
```bash
npm run dev --workspace=@repo/web
# or
cd apps/web
npm run dev
```

**AI Service:**
```bash
cd apps/ai-service
# Activate venv
pip install -r requirements.txt
uvicorn main:app --reload
```
