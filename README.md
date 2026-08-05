# MediPro AI - Production-Grade AI Healthcare SaaS Platform

**MediPro AI** is an enterprise-grade AI healthcare SaaS application engineered to transform complex medical documents (blood reports, prescriptions, X-rays, lab reports, discharge summaries) into simple, patient-friendly explanations.

Built with **React + TypeScript + Vite + Tailwind CSS + Lucide Icons** on the frontend, **FastAPI (Python)** on the backend, **MongoDB** for database persistence, and the complete **Azure Cloud AI Suite** (Vision, Language, OpenAI, Speech, Search RAG, Blob Storage).

---

## 🌟 Key Architecture Features

### 1. 🛡️ Zero-Trust Security & Patient Consent System
- **Patient Encrypted Vault**: Every patient owns an isolated medical storage partition.
- **Strict Admin Restriction**: Administrators can view account metadata (email, storage MB, status) but **CANNOT** open, view, or search patient medical files by default.
- **Consent-Based Request Workflow**: An admin must send a formal Access Request with a mandatory reason.
- **Patient Decision & Expiration**: Patient receives an in-app notification and can **Approve** (with 24h expiration) or **Reject**. Access can be **Revoked** at any time.
- **Immutable Security Audit Log**: Every file view, download, upload, access request, approval, rejection, and deletion event is logged immutably with timestamp and IP address.

### 2. ⚡ Full Azure AI Cloud Suite Integration
- **Azure AI Vision (Document Intelligence OCR)**: Extracts raw text and multi-page tables from scanned PDFs, handwritten notes, and images.
- **Azure AI Language (Text Analytics for Health)**: Categorizes clinical medical entities (medications, lab values, dosages, conditions, reference ranges).
- **Azure OpenAI (GPT-4)**: Generates empathetic plain-English report summaries, simplified explanations, candidate questions for doctors, and side-by-side progression tracking.
- **Azure AI Search (Grounded RAG System)**: Indexes document vectors to ensure the AI Chatbot answers questions **strictly from the patient's own uploaded medical files**, preventing hallucinations and providing grounded source citations.
- **Azure AI Speech (TTS & STT)**: Synthesizes text summaries into natural neural voice output.

### 3. 🔄 Hybrid Resilient Fallback Engine
- When Azure credentials (`AZURE_OPENAI_KEY`, `AZURE_VISION_KEY`, etc.) and MongoDB are configured in `.env`, live cloud APIs are invoked.
- If credentials are absent during evaluation or local testing, the application seamlessly switches to intelligent fallback mock generators for OCR, NLP entities, AI summaries, TTS audio, and database storage, ensuring 100% out-of-the-box execution without crashing.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion |
| **Backend** | FastAPI (Python 3.10+), Pydantic v2, PyJWT, Passlib (Bcrypt) |
| **Database** | MongoDB (Motor AsyncIO client) |
| **Storage** | Azure Blob Storage (or encrypted local storage fallback) |
| **AI Engine** | Azure AI Vision, Azure AI Language, Azure OpenAI, Azure AI Search RAG, Azure AI Speech |
| **PDF Generation** | ReportLab (Python) |
| **DevOps** | Docker, Docker-Compose |

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup (React Vite)

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend Web Application will be available at: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Deployment

To launch the entire platform (Frontend + Backend + MongoDB) using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 One-Click Instant Evaluation Logins

The application includes built-in one-click demo login buttons in the Authentication Modal:

1. **Patient Demo**: `sarah.patient@example.com` / `PatientPass123!`
2. **Admin Demo**: `admin@medipro.ai` / `AdminSecret123!`

---

## 🔒 Responsible AI & Medical Safety Notice

Every AI summary, chat response, report comparison, and PDF export includes an explicit medical safety notice:

> **DISCLAIMER**: MediPro AI provides educational summaries only. It does not diagnose medical conditions, prescribe treatments, or replace professional healthcare advice. Always consult a qualified medical professional regarding your lab results and health.
