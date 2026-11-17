# Skillskart - AI Powered Roadmap SaaS

Skillskart is a dynamic, interactive platform that provides career-wise and language-wise learning roadmaps. It uses AI to generate roadmaps and React Flow for visualization.

## Features

- **Interactive Roadmaps**: Visualize learning paths using React Flow.
- **AI Roadmap Generator**: Generate custom roadmaps using Groq SDK (LLama 3).
- **Admin Panel**: Manage content, roadmaps, and users.
- **User Dashboard**: Track your progress through different roadmaps.
- **Authentication**: Secure login and registration.

## Tech Stack

- **Frontend**: React, Vite, React Flow, Tailwind CSS (Vanilla CSS focus).
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **AI Performance**: Groq SDK.

---

##⚙️Setup Instructions

### 1. Prerequisite
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Groq API Key](https://console.groq.com/) (For AI features)

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd your_backend_directory_path
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your credentials:
   - `PORT`: Set your preferred port (default: 5555).
   - `MONGO_URI`: Your MongoDB connection string.
   - `GROQ_API_KEY`: Your Groq Cloud API key.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd your_frontend_directory_path
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## Launching the Project

### Start Backend
From the `backend` directory:
```bash
npm run dev
```
The server will run on `http://localhost:5555`.

### Start Frontend
From the `frontend` directory:
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (default Vite port).

---

## Admin Setup

To access the Admin Panel, you need an account with an `isAdmin` role.

1. Register a normal account through the UI.
2. Run the promotion script from the `backend` directory:
   ```bash
   node scripts/promoteToAdmin.js <your_email>
   ```

---

## Seeding Data (Optional)
If you want to populate the database with initial roadmap data:
```bash
cd backend
node scripts/seedData.js
```

---

##📄License
This project is licensed under the ISC License.

---

## Free deployment (Vercel + Render + MongoDB Atlas)

This repository is prepared for a low-cost/free deployment using MongoDB Atlas (free database), Render (free Node/Express API), and Vercel (free React/Vite frontend). Render's free service may sleep after inactivity.

### 1. Create the free database

1. Create a free MongoDB Atlas cluster.
2. Create a database user and copy the connection string.
3. In **Network Access**, allow `0.0.0.0/0` so Render can connect. Use a strong database password.

### 2. Deploy the backend to Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render will detect `render.yaml`.
3. Set `MONGO_URI`, `GROQ_API_KEY`, and a temporary `CORS_ORIGIN` when prompted. Use `http://localhost:5173` initially; update it after Vercel is live.
4. Deploy and open `https://<your-render-service>.onrender.com/health`. It should return `{ "status": "ok" }`.

`PORT` is supplied by Render. `USE_MOCK_PAYMENT=true` keeps the demo payment flow free and does not process real money.

### 3. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Use build command `npm run build` and output directory `dist`.
4. Add this environment variable:

   ```text
   VITE_API_URL=https://<your-render-service>.onrender.com
   ```

5. Deploy. Copy the Vercel URL, set Render's `CORS_ORIGIN` to that exact URL (for example, `https://skillskart.vercel.app`), and redeploy the backend.

### 4. Seed roadmaps and create an admin

With the production `MONGO_URI` in a local, uncommitted `backend/.env`, run:

```bash
cd backend
npm install
node scripts/seedData.js
node scripts/promoteToAdmin.js your-email@example.com
```

Never commit `backend/.env`. Use the checked-in `.env.example` files as templates; put deploy-time secrets in Render/Vercel environment settings.
