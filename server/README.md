# Server (Node.js)

Features:
- Express API
- SSE `/events` for QR/status/ai_status
- whatsapp-web.js session with LocalAuth
- Gemini auto-reply (toggle with POST /controls/ai)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install deps:
   - PowerShell: `npm install`
3. Run:
   - Dev: `npm run dev`

## Endpoints
- GET `/events` (SSE)
- GET `/status` -> `{ connected, aiEnabled }`
- POST `/controls/ai` -> body `{ enabled: boolean }`
