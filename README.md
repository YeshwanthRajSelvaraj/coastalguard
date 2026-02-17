<p align="center">
  <img src="https://img.shields.io/badge/CoastalGuard-🛡️-0B3C5D?style=for-the-badge&labelColor=0B3C5D" alt="CoastalGuard" />
</p>

<h1 align="center">🌊 CoastalGuard — Real-Time Maritime Safety & SOS System</h1>

<p align="center">
  A role-based, real-time emergency communication platform that protects <strong>Indian fishermen</strong> operating in the <strong>Chennai – Sri Lanka (Palk Strait)</strong> region with instant SOS alerts, GPS tracking, maritime boundary monitoring, and multi-channel fault-tolerant delivery.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa" />
  <img src="https://img.shields.io/badge/Offline--First-Enabled-FF6F61?style=flat-square" />
</p>

---

## 📌 Problem Statement

Indian fishermen operating near the **India–Sri Lanka International Maritime Boundary Line (IMBL)** in the Palk Strait frequently face the risk of unknowingly crossing into Sri Lankan waters, leading to arrests and boat seizures. In emergencies at sea, connectivity is unreliable and response times are critical.

**CoastalGuard** solves this with:

- ⚡ **Real-time SOS delivery** via WebSockets — alerts reach authorities in < 100ms
- 🔄 **Offline-first architecture** — SOS cached locally, auto-sent on connectivity restoration
- 📡 **Multi-channel fault tolerance** — Internet → Satellite → AIS fallback chain
- 🗺️ **Live GPS tracking** with maritime boundary and fishing zone visualization
- 🔐 **Role-based system** — same app serves both fishermen and authorities
- 🔔 **Missed alert recovery** — authorities receive queued SOS on reconnection

---

## ✨ Key Features

### 🚨 Real-Time SOS Emergency System
- **One-tap SOS trigger** with GPS coordinates, timestamp, and fisherman identity
- **WebSocket broadcast** — instant delivery to all connected authority dashboards
- **Fullscreen emergency banner** with audio alert (Web Audio API) and vibration
- **Multi-channel delivery pipeline**: Internet (REST API) → Satellite SMS → AIS Distress
- **Offline queue** — SOS cached to IndexedDB, auto-retried every 30 seconds
- **Missed alerts delivery** — authorities receive queued SOS upon reconnection
- **Cross-device status sync** — acknowledge/resolve propagated via WebSocket to all clients

### 🗺️ Interactive Maritime Map (Leaflet)
- **Indian Fishing Zone** — Blue polygon covering safe Indian waters
- **Sri Lankan Fishing Zone** — Orange polygon marking restricted waters
- **IMBL Boundary** — Red dashed line showing the international maritime border
- **8 Fish Density Zones** with color-coded intensity and species information
- **Real-time fisherman position** with pulsing animated marker
- **Alert markers** showing SOS locations on the authority map

### 📍 Border Proximity Alerts
- **Warning Zone** — Automatic alert at 5 km from IMBL
- **Danger Zone** — Critical alert at 1 km from IMBL
- **Safe status** — Green indicator when well within Indian waters

### 👮 Authority Dashboard
- **Live SOS feed** — real-time alerts with fisherman identity and GPS
- **Acknowledge & Resolve workflow** — cross-device sync via WebSocket
- **Map monitoring** — all active alert locations on interactive map
- **Communication channel status** — Internet, Satellite, AIS availability
- **Online user counts** — live fisherman and authority connection stats
- **Connection quality indicator** — latency monitoring with visual status

### 🌐 Multilingual Support
- Full **Tamil (தமிழ்)** translation with offline dictionary
- Language switcher in navbar
- Designed for **low-literacy users** with emoji icons and color coding

### 📱 Progressive Web App (PWA)
- Installable on Android/iOS home screen
- Service Worker for offline functionality
- Push notification support for SOS alerts
- Mobile-first responsive design (320px → desktop)

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      SAME APK / PWA                               │
│                                                                    │
│  ┌──────────────────┐                    ┌──────────────────────┐ │
│  │   FISHERMAN      │                    │     AUTHORITY        │ │
│  │   Dashboard      │                    │     Dashboard        │ │
│  │                  │                    │                      │ │
│  │  • GPS tracking  │     Socket.IO      │  • Live SOS feed     │ │
│  │  • SOS trigger   │◄──── WebSocket ───►│  • Map monitoring    │ │
│  │  • Border alerts │     Real-Time      │  • Ack/Resolve       │ │
│  │  • Fish zones    │                    │  • Channel status    │ │
│  │  • Weather       │                    │  • Online counts     │ │
│  └────────┬─────────┘                    └──────────┬───────────┘ │
│           │                                          │            │
│           └──────────────┬───────────────────────────┘            │
│                          │                                        │
│              ┌───────────▼────────────┐                           │
│              │     SOS ENGINE         │                           │
│              │  Multi-Channel Router  │                           │
│              │                        │                           │
│              │  Internet → Satellite  │                           │
│              │  → AIS → Offline Cache │                           │
│              └───────────┬────────────┘                           │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │   BACKEND SERVER    │
                │   Express + Socket  │
                │                     │
                │  • Room-based RBAC  │
                │  • SOS broadcast    │
                │  • REST API fallback│
                │  • Missed alerts    │
                │  • Connection mgmt  │
                └─────────────────────┘
```

> 📄 Full architecture documentation: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/YeshwanthRajSelvaraj/coastalguard.git
cd coastalguard

# Install client dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### Running the Application

```bash
# Start both client + server concurrently (recommended)
npm run dev:full

# Or run separately in two terminals:
npm run dev        # Vite client → http://localhost:5173
npm run server     # Socket.IO server → http://localhost:3001
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🐟 Fisherman | `fisher@coastalguard.in` | `fisher123` |
| 👮 Authority | `officer@coastalguard.in` | `officer123` |

### Environment Variables

Create a `.env` file in the root directory:

```env
# WebSocket Server URL (default: http://localhost:3001)
VITE_WS_SERVER_URL=http://localhost:3001

# Optional: Google Maps API Key (Leaflet is used by default — no key needed)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## 📁 Project Structure

```
coastalguard/
├── public/                          # Static assets & PWA files
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service Worker
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── RealtimeSOSBanner.jsx    # 🚨 Fullscreen SOS alert overlay
│   │   ├── RealtimeIndicator.jsx    # 🟢 WebSocket connection status
│   │   ├── AlertCard.jsx            # Alert card with WS ack/resolve
│   │   ├── SOSStatusPanel.jsx       # Multi-channel delivery tracker
│   │   ├── MapView.jsx              # 🗺️ Leaflet map with zones & IMBL
│   │   ├── WeatherWidget.jsx        # 🌤️ Sea conditions (Open-Meteo)
│   │   ├── Navbar.jsx               # Navigation with role-based content
│   │   ├── ProtectedRoute.jsx       # Route guard by user role
│   │   ├── LanguageSwitcher.jsx     # Tamil/English toggle
│   │   ├── ActionButton.jsx         # Gradient action buttons
│   │   ├── AlertBanner.jsx          # Dismissible notification banners
│   │   ├── StatusBadge.jsx          # Status indicator pills
│   │   └── InputField.jsx           # Styled form inputs
│   ├── contexts/                    # React Context providers
│   │   ├── SocketContext.jsx        # 📡 WebSocket state & SOS events
│   │   ├── SOSContext.jsx           # 🚨 SOS engine state & channels
│   │   ├── AlertContext.jsx         # 📋 Alert feed management
│   │   ├── AuthContext.jsx          # 🔐 Authentication & RBAC
│   │   └── TranslationContext.jsx   # 🌐 i18n language switching
│   ├── pages/                       # Full-page views
│   │   ├── FishermanDashboard.jsx   # 🐟 GPS, SOS, fish zones, weather
│   │   ├── PoliceDashboard.jsx      # 👮 Alerts, map, channel monitor
│   │   ├── LoginPage.jsx            # Shared login → role redirect
│   │   ├── FishermanSignup.jsx      # Fisherman registration
│   │   └── AuthoritySignup.jsx      # Authority registration
│   ├── services/                    # Business logic & APIs
│   │   ├── socketService.js         # 📡 Socket.IO client singleton
│   │   ├── sos/                     # Multi-channel SOS engine
│   │   │   ├── SOSEngine.js         # Orchestrator: queue, retry, route
│   │   │   ├── SOSCache.js          # Offline cache (IndexedDB)
│   │   │   ├── NetworkDetector.js   # Connectivity detection
│   │   │   └── channels/
│   │   │       ├── ChannelBase.js   # Abstract channel interface
│   │   │       ├── InternetChannel.js # REST API → backend (Priority 1)
│   │   │       ├── SatelliteChannel.js # Satellite SMS gateway (Priority 2)
│   │   │       └── AISChannel.js    # AIS distress broadcast (Priority 3)
│   │   ├── authService.js           # Auth & session management
│   │   ├── alertService.js          # Alert CRUD (localStorage)
│   │   ├── locationService.js       # GPS, distance, border checks
│   │   └── notificationService.js   # Push notifications & audio
│   ├── utils/
│   │   ├── constants.js             # Zones, IMBL, fish zones, roles
│   │   └── translations.js          # Tamil/English dictionary
│   ├── App.jsx                      # Root app with routing
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles & animations
├── server/
│   ├── index.js                     # 🖥️ Express + Socket.IO backend
│   └── package.json                 # Server dependencies
├── docs/
│   └── ARCHITECTURE.md              # 📐 Full architecture documentation
├── .env                             # Environment variables (local)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── package.json                     # Client dependencies & scripts
├── vite.config.js                   # Vite configuration
└── README.md                        # This file
```

---

## 📡 Real-Time SOS Flow

```
  FISHERMAN                        SERVER                         AUTHORITY
  ─────────                        ──────                         ─────────

  1. Tap SOS button
         │
  2. SOSEngine caches              
     to IndexedDB ◄── OFFLINE-FIRST GUARANTEE
         │
  3. Send via WebSocket ──────►  4. Validate role
     + REST API POST               Store in memory
                                    Broadcast to room ──────►  5. SocketContext
                                                                  receives sos:new
                                                                      │
                                                               6. Fullscreen banner
                                                                  🚨 + Audio + GPS
                                                                      │
                                                               7. Alert in feed
                                                                  with "Live" badge
                                                                      │
                                  8. Authority acknowledges ◄── Tap "Acknowledge"
                                     Broadcast status update
         │                                                            │
  9. "SOS Delivered" ◄───────────────────────────────────────────────┘
     confirmation
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite 7 | UI framework & build tool |
| **Real-Time** | Socket.IO 4 | WebSocket communication |
| **Backend** | Node.js + Express | API server & SOS routing |
| **Maps** | Leaflet + react-leaflet | Maritime map visualization |
| **Styling** | Tailwind CSS 4 + Vanilla CSS | Premium glassmorphism UI |
| **Routing** | React Router DOM 7 | Role-based navigation |
| **State** | React Context API | Global state management |
| **Storage** | IndexedDB + localStorage | Offline-first persistence |
| **GPS** | Browser Geolocation API | Real-time positioning |
| **Weather** | Open-Meteo API | Sea conditions & advisories |
| **PWA** | Service Worker + Manifest | Installable offline app |
| **i18n** | Custom dictionary | English + Tamil support |
| **Mobile** | Capacitor (optional) | Native Android APK build |

---

## 📜 Available Scripts

```bash
npm run dev          # Start Vite client dev server (port 5173)
npm run dev:full     # Start client + server concurrently
npm run server       # Start Socket.IO backend (port 3001)
npm run server:dev   # Start server with --watch (auto-restart)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🗺️ Maritime Data Coverage

### Region
- **North:** Chennai coast (13.4°N)  
- **South:** Kanyakumari / Southern Sri Lanka (7.0°N)  
- **East:** Sri Lankan coast (80.5°E)  
- **West:** Indian coast (77.8°E)

### Fish Density Zones

| Zone | Intensity | Country | Key Species |
|------|-----------|---------|-------------|
| Palk Bay Rich Zone | 🟢 High | 🇮🇳 India | Prawns, Crabs, Sardines |
| Rameswaram Fishing Ground | 🟢 High | 🇮🇳 India | Tuna, Mackerel, Shrimp |
| Gulf of Mannar Marine | 🟡 Medium | 🇮🇳 India | Sea Cucumber, Chanks, Grouper |
| Nagapattinam Coast | 🟡 Medium | 🇮🇳 India | Anchovies, Sardines, Pomfret |
| Cuddalore Zone | 🟠 Low | 🇮🇳 India | Sardines, Mackerel |
| Jaffna Lagoon Waters | 🟢 High | 🇱🇰 Sri Lanka | Prawns, Crab, Mullet |
| Mannar Island Zone | 🟡 Medium | 🇱🇰 Sri Lanka | Lobster, Grouper, Snapper |
| Trincomalee Waters | 🟠 Low | 🇱🇰 Sri Lanka | Tuna, Sailfish |

---

## 🔒 Security & RBAC

| Feature | Implementation |
|---------|---------------|
| **Role-based routing** | `ProtectedRoute` component validates `user.role` |
| **Server-side RBAC** | Only fishermen can send SOS; only authorities can acknowledge |
| **Room isolation** | Socket.IO rooms separate fisherman/authority broadcasts |
| **Input validation** | SOS payloads validated on server before storage/broadcast |
| **Session management** | JWT-ready architecture with localStorage persistence |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Yeshwanth Raj Selvaraj**

- GitHub: [@YeshwanthRajSelvaraj](https://github.com/YeshwanthRajSelvaraj)

---

<p align="center">
  Built with ❤️ for the safety of Indian fishermen
</p>
