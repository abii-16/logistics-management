# KrishiBundle

AI-powered cooperative logistics platform for small farmers, built for the ARCNIGHT 2026 hackathon demo.

## What Is Included

- Next.js 15 frontend with farmer, driver, and admin dashboards
- FastAPI backend with mockable AI extraction, clustering, bidding, recommendations, and notifications
- Supabase-ready schema and environment placeholders
- Seeded demo data so the full pitch flow works without API keys

## Project Structure

```text
frontend/   Next.js app
backend/    FastAPI app
database/   Supabase SQL schema
```

## Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Open `http://localhost:8000/docs`.

## API Keys

Paste keys into the `.env` files when ready. The app uses demo data until keys and real integrations are enabled.

