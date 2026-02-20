# Assessment Planning Platform

A monorepo for Assessment Management with Next.js frontend, Express backend, and AI Service.

## 🚀 Local Hosting URLs
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation (Swagger)**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **Prisma Studio**: [http://localhost:5555](http://localhost:5555)

## 📁 Project Structure
- `/apps/web`: Next.js Frontend
- `/backend`: Express.js & Prisma (PostgreSQL)
- `/apps/ai_service`: Python AI Processing

## 🛠️ Quick Start

### 1. Backend & Database
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend
```bash
cd apps/web
npm install
npm run dev
```

### 3. AI Service
```bash
cd apps/ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
