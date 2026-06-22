# 🎓 BRACU Routine Builder

A full-stack MERN application for building BRACU (BRAC University) class schedules with automatic paired-day theory logic, lab spanning, conflict detection, and PNG export.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Paired-Day Theory Scheduling**: Sunday↔Tuesday, Monday↔Wednesday, Thursday↔Saturday
- **Lab Spanning**: Labs automatically span 2 consecutive time slots
- **Conflict Detection**: Real-time blocking of overlapping classes
- **Live Course Catalog**: Auto-fills sections, faculty, rooms and exam dates from the USIS feed (cached 7 days, manual refresh available)
- **Exam Schedule Tracker**: Separate exam table that flags date clashes (2+ exams on the same day)
- **Customizable Time Slots**: Edit, add, or remove slots in-app — the grid adapts automatically
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
| PNG Export | html-to-image |

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
MONGODB_URI=mongodb://localhost:27017/routinemaker
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

Default slots (fully customizable in-app via the **Time Slots** editor):

| Slot | Time |
|------|------|
| 1 | 08:00 AM – 09:20 AM |
| 2 | 09:30 AM – 10:50 AM |
| 3 | 11:00 AM – 12:20 PM |
| 4 | 12:30 PM – 01:50 PM |
| 5 | 02:00 PM – 03:20 PM |
| 6 | 03:30 PM – 04:50 PM |
| 7 | 05:00 PM – 06:20 PM |

## 📐 Scheduling Rules

- **Theory**: occupies one slot, always booked on its paired days (Sun↔Tue, Mon↔Wed, Thu↔Sat)
- **Lab**: spans 2 consecutive slots; valid starts are every other slot (e.g. 1, 3, 5)
- **Friday**: weekend — no classes (theory or lab) are scheduled
- Conflicts are blocked with clear error messages

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routine` | Fetch all classes |
| POST | `/api/routine` | Create a new class |
| PUT | `/api/routine/:id` | Update a class |
| DELETE | `/api/routine/:id` | Delete a class (cascades to its labs + exam) |
| DELETE | `/api/routine` | Clear all classes |
| GET / POST | `/api/exams` | List / create exams |
| PUT / DELETE | `/api/exams/:id` | Update / delete an exam |
| GET / POST / DELETE | `/api/courses` | Manage custom courses (MongoDB) |
| GET | `/api/courses/catalog` | Fetch the cached USIS course catalog |
| GET | `/api/courses/catalog/search?q=` | Search the catalog |
| POST | `/api/courses/catalog/refresh` | Force-refresh the catalog cache |
| GET / PUT | `/api/settings/timeslots` | Get / update time slots |
| POST | `/api/settings/timeslots/reset` | Reset time slots to defaults |
| GET | `/api/health` | Health check |

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
│   ├── routes/                # API routes
│   └── utils/                 # USIS catalog cache
│
└── README.md
```
