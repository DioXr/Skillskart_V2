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
