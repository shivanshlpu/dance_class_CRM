# DanceFlow CRM

A multi-tenant-ready Dance Studio Management CRM with WhatsApp automation and a rule-based AI assistant.

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env  # Edit with your MongoDB URI
npm install
npm run dev
```

Default owner account: `owner@danceflow.com` / `owner123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack
- **Frontend:** React + Vite, TailwindCSS, Framer Motion, React Query, React Hook Form + Zod
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT, bcrypt, Socket.io
- **WhatsApp:** OpenWA (embedded, v4.76.0)

## Environment Variables
See `backend/.env.example` for all required environment variables.
