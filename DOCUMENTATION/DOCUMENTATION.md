# Assessment Planning Platform - Technical Documentation

Welcome to the technical documentation for the Assessment Planning Platform. This guide is intended for developers and engineers to understand the architecture, tech stacks, directory structure, and main API endpoints of the system.

## 1. System Architecture & Tech Stack

The project uses a **Monorepo** architecture (managed via npm workspaces), allowing the frontend, backend, and AI service to reside in the same repository.

### Frontend (`/apps/web`)
- **Framework**: Next.js 16 (App/Pages router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Real-time Communication**: Socket.IO Client

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time Engine**: Socket.IO (for notifications and data mutation broadcasting)
- **File Handling**: Multer & ExcelJS (for parsing Excel uploads)
- **API Documentation**: Swagger UI (`swagger-jsdoc`, `swagger-ui-express`)

### AI Service (`/apps/ai_service`)
- **Runtime/Language**: Python 3
- **Framework**: FastAPI
- **Server**: Uvicorn
- **AI/LLM Engine**: OpenAI GPT via custom `GPTRunTime`
- **Purpose**: Parses and analyzes employee responses (accept, reject, reschedule) based on natural language processing.

---

## 2. Default Login Database

The system uses a PostgreSQL database managed via Prisma. By default, there is a master admin account provisioned during setup:

- **Username (nik_user)**: `admin`
- **Password**: `password123`
- **Email**: `admin@telkom.co.id`
- **Role**: `ADMIN`
- **Talent Solution Level**: `0` (Super Admin)

*(Note: Users and passwords are created within the `backend/prisma` and `backend/scripts` directories.)*

---

## 3. Important Directories

Understanding the monorepo structure is crucial for navigating the codebase effectively.

### Root Directory
- `package.json`: Manages the monorepo workspaces (`apps/*` and `backend`).

### Frontend (`/apps/web`)
Contains the user interface and client-side logic.
- `/src` or `/app`/`/pages`: Contains the Next.js routes and components.
- `package.json`: Frontend specific dependencies and scripts.

### Backend (`/backend`)
The core API server that manages database operations and business logic.
- `/prisma`: Contains the `schema.prisma` file which defines the database models and relationships.
- `/src/controllers`: Business logic for handling requests (e.g., `aiController.ts`, `webhookController.ts`).
- `/src/routes`: Express route definitions mapped to controllers (`index.ts` is the main router).
- `/src/services`: Service layer for complex business rules like `employeeStatusService.ts`.
- `/src/middleware`: Custom Express middleware (e.g., CORS, multer uploads).
- `/src/socket.ts`: Manages Socket.IO connections for real-time frontend updates.

### AI Service (`/apps/ai_service`)
A microservice dedicated to AI tasks.
- `main.py`: The FastAPI application entry point defining endpoints.
- `gpt_runtime.py`: The wrapper for interacting with the GPT API.

---

## 4. Employee (Recipient) Statuses

In the database, every recipient (employee) possesses an `availability_status` representing their position in the notification lifecycle. These statuses are:

1. **No Invitation**: The default status when an employee is first imported. They have not yet been sent a WhatsApp broadcast.
2. **Pending**: The WhatsApp broadcast was triggered, but the message has either failed, was rejected by the provider, or has not yet successfully reached the user's device.
3. **Sent**: The WhatsApp message was successfully delivered to the user's device.
4. **Accepted**: The user has replied confirming they will attend the assessment.
5. **Rejected**: The user has explicitly stated they cannot attend.
6. **Reschedule Requested**: The user requested to change the date, either explicitly passing a date (e.g., "Besok") or asking for a new date.

---

## 5. Important API Endpoints

### Backend Express APIs (Base URL: `http://localhost:8000`)
*(Available interactively via Swagger UI at `http://localhost:8000/api-docs`)*

**Authentication & Users**
- `POST /api/auth/login`: Authenticate a user and receive a token.

**AI & Processing**
- `POST /api/ai/process`: Process generic data through the AI service.

**Data & Batch Management**
- `GET /api/data/`: Retrieve assessment data.
- `POST /api/upload-excel`: Upload and parse an Excel file.

### Webhooks & Notifications (OCA Integration)

The backend receives webhooks from OCA (Omnichannel Assistant) when a user responds to a broadcast or when a message changes delivery status.

**1. Message Webhook**
- **Endpoint**: `POST /api/webhooks/whatsapp`
- **Description**: Triggered when the recipient replies to the WhatsApp message. Triggers the AI service analysis.
- **Expected Payload Formats**:
```json
{
  "from": "6281234567890",
  "to": "6280987654321",
  "timestamp": "2023-10-27T10:00:00Z",
  "message": {
    "content": {
      "text": "IYA",
      "type": "text"
    }
  }
}
```

**2. Delivery Status Webhook**
- **Endpoint**: `POST /api/webhooks/delivery`
- **Description**: Triggered by OCA to update the delivery status of a broadcast message. Used to change employee status from `Pending` to `Sent`.
- **Expected Payload Formats**:
```json
{
  "msgid": "msg-12345",
  "phone_number": "6281234567890",
  "status": "delivered",
  "timestamp": "2023-10-27T10:00:05Z",
  "error": {
    "code": "optional error code",
    "reason": "optional reason"
  }
}
```

### AI Service FastAPI (Base URL: `http://localhost:8001`)

- `POST /analyze-response`: 
  - **Payload**: `{ "employeeNik": "string", "response": "string" }`
  - **Description**: Uses GPT to classify natural language responses into: `'accepted'`, `'rejected'`, or `'reschedule'`. Extracts dates into `DD/MM/YYYY`.

---

## 6. Installation & Setup Guide

If you are setting up this project on a new PC, please follow these exact steps sequentially.

### Prerequisites

Before cloning the repository, ensure your PC has the following software installed:
1. **Node.js** (v18 or higher): Needed for the Frontend and Backend. [Download Node.js](https://nodejs.org/)
2. **Python** (v3.9 or higher): Needed for the AI Service. [Download Python](https://www.python.org/downloads/)
3. **PostgreSQL**: The relational database. Ensure it is running on your machine (default port 5432). [Download PostgreSQL](https://www.postgresql.org/download/)
4. **Git**: Version control to clone the repository. [Download Git](https://git-scm.com/downloads)

### Step 1: Clone the Repository
Open your terminal or command prompt and clone the repository:
```bash
git clone <repository_url>
cd tes_nextjs
```

### Step 2: Database Setup (PostgreSQL)
1. Open pgAdmin or your terminal's psql tool.
2. Create a new database for the project (e.g., `assessment_db`).
3. Make sure you know your PostgreSQL username and password (e.g., `postgres` / `password123`).

### Step 3: Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Create an environment variables file `.env` inside the `/backend` folder. It should contain at minimum:
   ```env
   PORT=8000
   DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>?schema=public"
   JWT_SECRET="your_secure_jwt_secret"
   FRONTEND_URL="http://localhost:3000"
   ```
   *(Make sure to replace `<DB_USER>`, `<DB_PASSWORD>`, and `<DB_NAME>` with your actual PostgreSQL credentials.)*
4. Generate the Prisma Client and sync the database schema:
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```
5. Seed the database to create the default Admin account (if you have a seed script, otherwise run the `create_admin.ts` script):
   ```bash
   npx ts-node scripts/create_admin.ts
   ```

### Step 4: Frontend Setup
1. Open a new terminal window. Navigate to the frontend folder:
   ```bash
   cd apps/web
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Create an `.env.local` file inside `/apps/web` (if necessary) pointing to your backend:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000/api"
   ```

### Step 5: AI Service Setup
1. Open another new terminal window. Navigate to the AI service folder:
   ```bash
   cd apps/ai_service
   ```
2. Create a Python Virtual Environment:
   - On **Windows**:
     ```bash
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - On **Mac/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create an `.env` file in `/apps/ai_service` with your OpenAI API Key and Backend URL:
   ```env
   OPENAI_API_KEY="sk-your-openai-api-key"
   BACKEND_URL="http://localhost:8000/api/ai/analyze-response"
   PORT=8001
   ```

---

## 7. Running the Project Locally

Once the setup is complete, you will need to run three separate servers. Open three separate terminal windows in your project root:

**Terminal 1: Run Backend Server**
```bash
cd backend
npm run dev
```
*(Runs on http://localhost:8000. You can visit http://localhost:8000/api-docs for Swagger)*

**Terminal 2: Run Frontend Server**
```bash
cd apps/web
npm run dev
```
*(Runs on http://localhost:3000. You can log in using `admin` / `password123`)*

**Terminal 3: Run AI Service**
```bash
cd apps/ai_service
# Make sure virtual environment is activated
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Mac/Linux

python main.py
```
*(Runs on http://localhost:8001)*

With all three running, the system will be fully operational locally!
