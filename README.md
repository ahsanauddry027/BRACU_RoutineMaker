# 📅 University Class Routine Builder

A full-stack MERN application for building university class schedules with automatic paired-day theory logic, lab spanning, conflict detection, and PNG export.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Paired-Day Theory Scheduling**: Sunday↔Tuesday, Monday↔Wednesday, Thursday↔Saturday
- **Lab Spanning**: 3-hour labs automatically span 2 consecutive time slots
- **Conflict Detection**: Real-time blocking of overlapping classes
- **Color Coding**: Consistent colors per course across the entire grid
- **PNG Export**: Download your complete routine as a high-quality image
- **Auto-Save**: All changes persist to MongoDB automatically
- **Offline Fallback**: Works locally when the server is unavailable

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| PNG Export | html2canvas |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ 
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or a MongoDB Atlas URI)

### 1. Clone & Install

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 2. Configure Environment

Edit `server/.env` if needed:

```env
MONGODB_URI=mongodb://localhost:27017/routine_builder
PORT=5000
```

### 3. Start the App

Open two terminals:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The app will be available at **http://localhost:5173**

## 📋 Time Slots

| Slot | Time |
|------|------|
| 1 | 08:00 AM – 09:30 AM |
| 2 | 09:30 AM – 11:00 AM |
| 3 | 11:00 AM – 12:30 PM |
| 4 | 12:30 PM – 02:00 PM |
| 5 | 02:00 PM – 03:30 PM |
| 6 | 03:30 PM – 05:00 PM |
| 7 | 05:00 PM – 06:30 PM |

## 📐 Scheduling Rules

- **Theory**: 1.5 hours, always on paired days (Sun↔Tue, Mon↔Wed, Thu↔Sat)
- **Lab**: 3 hours (2 consecutive slots), any day of the week
- **Friday**: Labs only — no theory classes allowed
- Conflicts are blocked with clear error messages

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routine` | Fetch all classes |
| POST | `/api/routine` | Create a new class |
| PUT | `/api/routine/:id` | Update a class |
| DELETE | `/api/routine/:id` | Delete a class |
| DELETE | `/api/routine` | Clear all classes |

## 📁 Project Structure

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── constants/         # Schedule constants
│   │   ├── utils/             # Color & conflict helpers
│   │   └── api/               # Axios API wrappers
│   └── ...config files
│
├── server/                    # Express backend
│   ├── config/                # DB connection
│   ├── models/                # Mongoose schemas
│   └── routes/                # API routes
│
└── README.md
```
