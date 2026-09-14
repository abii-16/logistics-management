# KrishiBundle Deployment Guide

This guide details how to deploy the KrishiBundle platform (Next.js Frontend & FastAPI Backend) to production.

---

## 🏗️ Architecture Summary

1. **Database & Auth (Supabase)**: Already deployed on Supabase Cloud.
2. **Backend (FastAPI)**: Deployed to **Render** (or Railway / Fly.io).
3. **Frontend (Next.js)**: Deployed to **Vercel**.

---

## 1. Deploy the Backend (FastAPI) on Render

[Render](https://render.com/) is the easiest platform to deploy Python web apps.

### Step-by-Step:
1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`ARCHNIGHT`).
4. Configure the service settings:
   * **Name**: `krishibundle-backend`
   * **Root Directory**: `backend`
   * **Language**: `Python`
   * **Branch**: `main`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. Expand the **Advanced** section to add **Environment Variables**:
   * Add all keys from your `backend/.env` file:
     * `SUPABASE_URL` = (Your Supabase URL)
     * `SUPABASE_KEY` = (Your Supabase Service/Anon Key)
     * `DATABASE_URL` = (Your Supabase Postgres connection string if using direct SQL)
     * `GEMINI_API_KEY` = (Your Gemini API Key if using live voice extraction)
6. Click **Create Web Service**. 
7. Once deployed, Render will provide a public URL (e.g. `https://krishibundle-backend.onrender.com`). Copy this URL.

---

## 2. Deploy the Frontend (Next.js) on Vercel

[Vercel](https://vercel.com/) is the native hosting platform for Next.js apps.

### Step-by-Step:
1. Create a free account on [Vercel](https://vercel.com/).
2. Click **Add New** $\rightarrow$ **Project**.
3. Connect your GitHub repository (`ARCHNIGHT`).
4. Configure the project settings:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend` (Click Edit, select the `frontend` folder, and save)
5. Expand the **Environment Variables** section and add the following keys:
   * `NEXT_PUBLIC_API_BASE_URL` = `https://krishibundle-backend.onrender.com` (Your Render FastAPI URL)
   * `NEXT_PUBLIC_SUPABASE_URL` = (Your Supabase project URL)
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Your Supabase Anon Key)
6. Click **Deploy**. Vercel will automatically build the Next.js routes and provide your production URL.

---

## 3. Configure CORS on Backend (Important)

To allow the Vercel frontend to query the FastAPI backend securely:
1. Ensure your backend code has CORS middleware enabled. (Our backend is already pre-configured to allow CORS requests from standard domains, but you can refine `backend/main.py` if needed to add your custom Vercel domain).
