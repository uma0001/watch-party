# 🎬 Watch Party

> A real-time, millisecond-synchronized YouTube video streaming platform with live floating reactions, role-based playback control, and party chat.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-v4-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

---

## ✨ Features

- **⚡ Real-Time Timestamp Sync**: Zero-drift video synchronization using server extrapolation so all viewers see the exact same frame simultaneously.
- **🎈 Floating Live Stream Reactions**: 1-tap emoji reactions (🔥, ❤️, 😂, 👏, 🎉, 🍿, 🚀, 💯) burst and float live across the video screen for all room members.
- **👑 Role-Based Control System**:
  - **Host**: Master controls to change videos, assign roles, transfer room ownership, and kick participants.
  - **Moderator**: Full playback control (Play, Pause, Seek, Skip ±10s, Load Video).
  - **Participant**: Protected viewer mode with interactive floating reactions and chat.
- **🔗 Smart YouTube URL Parser**: Supports standard YouTube videos, YouTube Shorts, YouTube Music, embed links, and raw 11-character video IDs.
- **💬 Party Chat & Emoji Picker**: Real-time room chat with custom scrollbars and an animated emoji picker.
- **🖥️ Fullscreen & Skip ±10s Controls**: Integrated Fullscreen toggle and quick 10-second forward/backward skip buttons.
- **🔄 Socket Auto-Reconnection**: Resilient client hook automatically re-joins active rooms upon network recovery.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Motion
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Server**: Express.js + Socket.IO
- **Transpiler**: TSX + ESBuild

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/watch-party-app.git
cd watch-party-app
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Build & Run Production Bundle
```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```
watch-party-app/
├── server/                   # Backend Express & Socket.IO Architecture
│   ├── handlers/             # Modular Socket Event Handlers (Room, Playback, Role, Chat)
│   ├── managers/             # State Managers (RoomManager Singleton)
│   ├── models/               # Domain Models (Room, Participant)
│   └── types/                # Server Error & Payload Types
├── src/                      # Frontend React Application
│   ├── components/           # UI Components (VideoPlayer, PlaybackControls, ChatPanel, etc.)
│   ├── hooks/                # Custom React Hooks (useRoom, useSocket)
│   ├── types/                # Shared TypeScript Interfaces
│   └── utils/                # YouTube Parser & Time Formatting Utilities
├── server.ts                 # Server Entry Point & Vite Middleware Integration
├── vercel.json               # Vercel Deployment Configuration
├── vite.config.ts            # Vite Build & Alias Configuration
└── package.json              # Project Dependencies & Scripts
```

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub.
2. Go to **[Vercel.com](https://vercel.com)** and click **Import Project**.
3. Select your repository. Vercel auto-detects `vite` and `dist`.
4. Click **Deploy**!

> **Note**: For persistent real-time WebSockets, deploy the Node.js server to [Render](https://render.com) or [Railway](https://railway.app) and set `VITE_SOCKET_URL` to your live server URL.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
