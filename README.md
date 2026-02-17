<p align="center">
  <img src="https://img.shields.io/badge/🛡️-CoastalGuard-0B3C5D?style=for-the-badge&labelColor=1B6B93" alt="CoastalGuard" />
</p>

<h1 align="center">CoastalGuard</h1>

<p align="center">
  <strong>Smart Coastal Safety Network — Real-Time SOS Communication for Fishermen & Maritime Authorities</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Capacitor-8.1-119EFF?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

<p align="center">
  A multi-channel, offline-first emergency communication system designed for Indian fishermen operating in the Chennai–Sri Lanka (Palk Strait) maritime region. One APK serves both <strong>Fisherman</strong> and <strong>Authority</strong> roles with real-time SOS delivery via WebSockets.
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Demo Accounts](#-demo-accounts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌊 Overview

**CoastalGuard** is a role-based, real-time coastal safety platform built to protect fishermen navigating dangerous maritime boundaries. The system provides:

- **Instant SOS alerts** with GPS coordinates broadcast to all connected authorities
- **Multi-channel delivery** (Internet → Satellite → AIS) with automatic failover
- **Offline-first architecture** — SOS is cached locally and auto-transmitted when connectivity is restored
- **International maritime boundary monitoring** with real-time distance warnings
- **Weather & sea condition advisories** from Open-Meteo API

The same application serves both fishermen and maritime authorities through role-based dashboards, ensuring a unified deployment model suitable for government-scale rollouts.

---

## ✨ Key Features

### 🚨 SOS Emergency System
- **One-tap SOS trigger** with GPS, timestamp, and fisherman identity
- **Multi-channel fallback**: Internet (REST) → Satellite (SMS) → AIS (Distress)
- **Offline caching** via IndexedDB with automatic retry every 30 seconds
- **Real-time delivery tracking** showing channel attempts and status

### 📡 Real-Time Communication
- **WebSocket-powered** instant alert delivery via Socket.IO
- **Room-based RBAC** — fishermen and authorities join separate rooms
- **Missed alert recovery** — server tracks disconnection timestamps and delivers queued alerts on reconnection
- **Cross-device sync** — acknowledge/resolve actions propagated to all connected clients

### 🗺️ Maritime Safety Features
- **Interactive Leaflet map** with live alert markers and fisherman tracking
- **International Maritime Boundary Line (IMBL)** distance monitoring
- **Border proximity alerts** with configurable warning thresholds
- **Fish zone identification** and safe navigation corridors

### 🌤️ Weather Intelligence
- **Real-time sea conditions** from Open-Meteo Marine API
- **Wave height, wind speed, and swell data** with fishing advisories
- **Offline caching** for weather data with fallback support

### 📱 Progressive Web App (PWA)
- **Installable** on mobile devices with native app experience
- **Service Worker** for offline support and push notifications
- **Audio alerts** and vibration patterns for emergency notifications
- **Android deployment** via Capacitor for Google Play distribution

### 🌐 Multilingual Support
- **English and Tamil** language support via translation context
- **Offline translation dictionary** — no external API dependency

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FISHERMAN DEVICE (PWA)                     │
│                                                              │
│  ┌──────────┐   ┌────────────────┐   ┌──────────────────┐  │
│  │   GPS    │──▶│  SOS ENGINE    │──▶│  Delivery Status │  │
│  │  Module  │   │ (Orchestrator) │   │  UI Tracker      │  │
│  └──────────┘   │                │   └──────────────────┘  │
│                 │  ┌───────────┐ │                          │
│  ┌──────────┐   │  │  Network  │ │                          │
│  │  User    │──▶│  │  Detector │ │                          │
│  │ Identity │   │  └─────┬─────┘ │                          │
│  └──────────┘   │        │       │                          │
│                 │  ┌─────▼─────┐ │                          │
│                 │  │  Channel  │ │                          │
│                 │  │  Router   │ │                          │
│                 │  └─────┬─────┘ │                          │
│                 └────────┼───────┘                          │
│                          │                                   │
│           ┌──────────────┼──────────────┐                   │
│           ▼              ▼              ▼                    │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐               │
│  │  INTERNET    │ │SATELLITE │ │   AIS    │               │
│  │  Channel     │ │ Channel  │ │ Channel  │               │
│  │  Priority: 1 │ │Priority:2│ │Priority:3│               │
│  └──────┬───────┘ └────┬─────┘ └────┬─────┘               │
└─────────┼──────────────┼────────────┼───────────────────────┘
          │              │            │
          ▼              ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│                   SOCKET.IO SERVER (Node.js)                  │
│                                                              │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────────────┐ │
│  │  REST    │  │  WebSocket │  │  Room-Based Broadcast   │ │
│  │  API     │  │  Events    │  │  • authority room       │ │
│  │  /api/   │  │  sos:send  │  │  • fisherman room       │ │
│  └──────────┘  └────────────┘  └─────────────────────────┘ │
│                                                              │
│  In-Memory Store: sosAlerts, connectedUsers, lastSeen       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  AUTHORITY DASHBOARD                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Alert Feed  │  │  Real-time   │  │  Channel Status  │  │
│  │  (Live)      │  │  Map View    │  │  Monitor         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  RealtimeSOSBanner │ MissedAlerts │ WebSocket Ack/Resolve   │
└──────────────────────────────────────────────────────────────┘
```

> 📄 For detailed architecture diagrams and data models, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19.2 + Vite 7.3 | SPA with hot module replacement |
| **Styling** | Tailwind CSS 4.1 | Utility-first responsive design |
| **Mapping** | Leaflet + React-Leaflet | Interactive maritime maps |
| **Real-time** | Socket.IO Client 4.8 | WebSocket communication |
| **Backend** | Express + Socket.IO 4.7 | REST API + WebSocket server |
| **Mobile** | Capacitor 8.1 | Native Android deployment |
| **PWA** | Service Worker + Manifest | Offline support & installability |
| **Routing** | React Router DOM 7.13 | Client-side navigation |
| **i18n** | Custom Translation Context | English/Tamil support |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A modern web browser (Chrome, Edge, Firefox)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YeshwanthRajSelvaraj/coastalguard.git
cd coastalguard

# 2. Install client dependencies
npm install

# 3. Install server dependencies
cd server && npm install && cd ..

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# 5. Start both client and server concurrently
npm run dev:full
```

### Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start Vite dev server (client only) on `:5173` |
| `npm run server` | Start Socket.IO server on `:3001` |
| `npm run dev:full` | Start client + server concurrently |
| `npm run server:dev` | Start server with `--watch` (auto-restart) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
coastalguard/
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service Worker
│
├── src/
│   ├── App.jsx                    # Root component with routing
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx          # Shared login → role-based redirect
│   │   ├── FishermanSignup.jsx    # Fisherman registration
│   │   ├── AuthoritySignup.jsx    # Authority registration
│   │   ├── FishermanDashboard.jsx # GPS, SOS, fish zones, weather
│   │   └── PoliceDashboard.jsx    # Alert feed, map, channel monitor
│   │
│   ├── components/
│   │   ├── MapView.jsx            # Leaflet map with alerts & IMBL
│   │   ├── RealtimeSOSBanner.jsx  # Fullscreen emergency overlay
│   │   ├── RealtimeIndicator.jsx  # WebSocket status indicator
│   │   ├── SOSStatusPanel.jsx     # Multi-channel delivery tracker
│   │   ├── AlertCard.jsx          # Alert card with ack/resolve
│   │   ├── WeatherWidget.jsx      # Sea conditions display
│   │   ├── Navbar.jsx             # Role-based navigation
│   │   ├── ProtectedRoute.jsx     # Route guard (RBAC)
│   │   ├── LanguageSwitcher.jsx   # English/Tamil toggle
│   │   └── ...                    # UI primitives
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx        # Authentication & session
│   │   ├── SocketContext.jsx      # WebSocket state & SOS events
│   │   ├── SOSContext.jsx         # SOS engine state & channels
│   │   ├── AlertContext.jsx       # Alert feed management
│   │   └── TranslationContext.jsx # i18n provider
│   │
│   ├── services/
│   │   ├── socketService.js       # Socket.IO client singleton
│   │   ├── authService.js         # localStorage-based auth
│   │   ├── alertService.js        # Alert data management
│   │   ├── locationService.js     # GPS & border distance
│   │   ├── notificationService.js # Push notifications & audio
│   │   ├── weatherService.js      # Open-Meteo API integration
│   │   └── sos/
│   │       ├── SOSEngine.js       # Main SOS orchestrator
│   │       ├── SOSCache.js        # IndexedDB offline storage
│   │       ├── NetworkDetector.js  # Connectivity detection
│   │       └── channels/
│   │           ├── ChannelBase.js      # Abstract channel interface
│   │           ├── InternetChannel.js  # REST API (Priority 1)
│   │           ├── SatelliteChannel.js # Satellite SMS (Priority 2)
│   │           └── AISChannel.js       # AIS Distress (Priority 3)
│   │
│   └── utils/                     # Shared utilities
│
├── server/
│   ├── index.js                   # Express + Socket.IO backend
│   └── package.json               # Server dependencies
│
├── android/                       # Capacitor Android project
├── docs/
│   └── ARCHITECTURE.md            # Detailed system architecture
│
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
├── package.json                   # Client dependencies & scripts
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint configuration
├── LICENSE                        # MIT License
├── CODE_OF_CONDUCT.md             # Contributor Code of Conduct
└── CONTRIBUTING.md                # Contribution guidelines
```

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/sos` | Submit SOS alert (REST fallback) | Fisherman |
| `GET` | `/api/sos` | List all SOS alerts | Authority |
| `GET` | `/api/sos/:id` | Get specific SOS alert | Authority |
| `PATCH` | `/api/sos/:id/ack` | Acknowledge SOS alert | Authority |
| `PATCH` | `/api/sos/:id/resolve` | Resolve SOS alert | Authority |
| `GET` | `/api/health` | Server health check | Public |

### WebSocket Events

| Direction | Event | Description |
|-----------|-------|-------------|
| Client → Server | `auth:register` | Register user with role |
| Client → Server | `sos:send` | Trigger SOS alert |
| Client → Server | `sos:acknowledge` | Acknowledge an alert |
| Client → Server | `sos:resolve` | Mark alert as resolved |
| Server → Client | `sos:new` | Broadcast new SOS to authorities |
| Server → Client | `sos:missed` | Deliver missed alerts on reconnection |
| Server → Client | `sos:acknowledged` | Confirm SOS receipt to fisherman |
| Server → Client | `users:count` | Online user count update |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Google Maps API Key (optional — Leaflet is used by default)
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# WebSocket Server URL
VITE_WS_SERVER_URL=http://localhost:3001
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Fisherman** | `fisher@coastalguard.in` | `fisher123` |
| **Authority** | `officer@coastalguard.in` | `officer123` |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) — Free weather & marine data API
- [Leaflet](https://leafletjs.com/) — Open-source interactive maps
- [Socket.IO](https://socket.io/) — Real-time bidirectional communication
- [Capacitor](https://capacitorjs.com/) — Cross-platform native runtime

---

<p align="center">
  Built with ❤️ for the safety of Indian coastal fishermen
</p>
