# Business Social Hub

A practical MVP for a business social platform with:
- social profiles and follower/friend system
- product marketplace and price negotiation
- public/private group discussions
- comments, likes, and post feed
- video section and live activity feed
- moderator/admin controls
- matrix-inspired analytics dashboard
- notifications and challenge tracking
- real-time chat via Socket.IO

## Stack

- Frontend: React + Vite + Tailwind-inspired CSS
- Backend: Node.js + Express + Socket.IO
- Data: in-memory mock data for rapid MVP development

## Folder structure

- `server/` – Express API and real-time chat backend
- `client/` – React frontend dashboard and social UI

## Run locally

### 1) Install server dependencies

```bash
cd server
npm install
```

### 2) Install client dependencies

```bash
cd ../client
npm install
```

### 3) Start backend

```bash
cd ../server
npm run dev
```

### 4) Start frontend

```bash
cd ../client
npm run dev
```

Then open the React app in the browser, usually at `http://localhost:5173`.

## Prototype notes

This is intentionally built as a strong MVP skeleton rather than a final production-ready system. It includes realistic feature areas and architecture patterns for:
- authentication and roles
- market negotiation flow
- group chat
- moderation actions
- admin analytics
- realtime notifications

## Future expansion

The next production steps would be:
- PostgreSQL database + Prisma/Sequelize
- AWS S3 or Cloudinary for videos and images
- real login with OAuth/JWT refresh tokens
- moderation queue workflow
- meeting hosting integration
- deployment pipeline and CI/CD
