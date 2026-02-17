<p align="center">
  <img src="https://img.shields.io/badge/CoastalGuard-🛡️-0B3C5D?style=for-the-badge&labelColor=0B3C5D" alt="CoastalGuard" />
</p>

<h1 align="center">🌊 CoastalGuard — Fisherman Safety & Maritime Zone Tracker</h1>

<p align="center">
  A mobile-first web application that helps <strong>Indian fishermen</strong> stay safe by providing real-time GPS tracking, maritime boundary alerts, and fishing zone visualization in the <strong>Chennai – Sri Lanka (Palk Strait)</strong> region.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Mobile--First-Responsive-FF6F61?style=flat-square" />
</p>

---

## 📌 Problem Statement

Indian fishermen operating near the **India–Sri Lanka International Maritime Boundary Line (IMBL)** in the Palk Strait frequently face the risk of unknowingly crossing into Sri Lankan waters, leading to arrests and boat seizures. CoastalGuard solves this by:

- Showing **real-time GPS position** on an interactive map
- Displaying **Indian & Sri Lankan fishing zones** as distinct colored polygons
- Providing **border proximity alerts** (Warning at 5 km, Danger at 1 km)
- Showing **fish density hotspots** with species information
- Enabling **SOS emergency alerts** for coast guard/police response

---

## ✨ Key Features

### 🗺️ Interactive Fish Zone Map (Leaflet)
- **Indian Fishing Zone** — Blue polygon covering safe Indian waters
- **Sri Lankan Fishing Zone** — Orange polygon marking restricted Sri Lankan waters
- **IMBL Boundary** — Red dashed line showing the maritime border
- **8 Fish Density Zones** with color-coded intensity (High/Medium/Low)
- Species information per zone (Prawns, Tuna, Sardines, etc.)
- Dynamic zone distance calculated relative to fisherman's GPS location

### 📍 Real-Time Fisherman Tracking
- Browser Geolocation API for GPS tracking
- Pulsing animated marker showing current position
- GPS accuracy circle overlay
- Auto-centering map on fisherman's position

### 🚨 Smart Alert System
- **Border Warning** — Automatic alert at 5 km from IMBL
- **Border Danger** — Critical alert at 1 km from IMBL
- **SOS Emergency** — One-tap distress signal with confirmation
- **Location Sharing** — Share coordinates with coast guard/family

### 👮 Authority Dashboard
- Real-time monitoring of all fishermen alerts
- SOS & border violation tracking on map
- Alert acknowledgement & resolution workflow
- Priority-based alert sorting

### 🌐 Multilingual Support
- Full **Tamil (தமிழ்)** translation
- Language switcher in navbar
- Designed for **low-literacy users** with emoji icons and color coding

### 📱 Mobile-First Design
- Optimized for outdoor visibility and touch interaction
- Glass-morphism UI with high contrast
- Safe area support for iOS WebView
- Responsive from 320px to desktop

---

## 🏗️ Project Structure

```
coastalguard/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images and media
│   ├── components/             # Reusable UI components
│   │   ├── ActionButton.jsx    # Gradient action buttons (SOS, Share, etc.)
│   │   ├── AlertBanner.jsx     # Top alert notifications
│   │   ├── AlertCard.jsx       # Alert detail cards for authority
│   │   ├── InputField.jsx      # Styled form inputs with validation
│   │   ├── LanguageSwitcher.jsx# Tamil/English toggle
│   │   ├── MapView.jsx         # 🗺️ Leaflet map with fish zones & IMBL
│   │   ├── Navbar.jsx          # Navigation bar with auth controls
│   │   ├── ProtectedRoute.jsx  # Route guard by role
│   │   └── StatusBadge.jsx     # Safe/Warning/Danger status pill
│   ├── contexts/               # React Context providers
│   │   ├── AlertContext.jsx    # SOS & border alert state management
│   │   ├── AuthContext.jsx     # Authentication state & user session
│   │   └── TranslationContext.jsx # i18n language switching
│   ├── pages/                  # Full-page views
│   │   ├── LoginPage.jsx       # Login with role selection
│   │   ├── FishermanSignup.jsx # Fisherman registration (boat number, etc.)
│   │   ├── AuthoritySignup.jsx # Police/Coast Guard registration
│   │   ├── FishermanDashboard.jsx # 🐟 Main fisherman view with map
│   │   └── PoliceDashboard.jsx # 👮 Authority monitoring dashboard
│   ├── services/               # Business logic & APIs
│   │   ├── alertService.js     # Alert CRUD (localStorage-based)
│   │   ├── authService.js      # User auth & registration
│   │   └── locationService.js  # GPS, Haversine distance, border checks
│   ├── utils/                  # Constants & helpers
│   │   ├── constants.js        # Zone polygons, IMBL coords, fish zones
│   │   └── translations.js     # Tamil/English translation dictionary
│   ├── App.jsx                 # Root app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles, animations, Leaflet overrides
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/YeshwanthRajSelvaraj/coastalguard.git
cd coastalguard

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
# Optional: Google Maps API key (Leaflet is used by default — no key needed)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

> **Note:** The app uses **Leaflet** with free CartoDB tiles by default. No API key is required.

---

## 📖 Usage Guide

### For Fishermen 🐟
1. **Register** with your boat registration number and phone
2. **Login** and allow GPS location access
3. **Dashboard** shows your position on the Palk Strait map
4. **Blue zone** = Indian waters (safe) — fish here freely
5. **Orange zone** = Sri Lankan waters (avoid) — do NOT cross
6. **Red dashed line** = International Maritime Boundary
7. **Fish Zones** — tap the 🐟 button to see fishing hotspots
8. **SOS** — tap the 🚨 button in emergencies

### For Authorities 👮
1. **Register** as Coast Guard / Marine Police
2. **Login** to see the monitoring dashboard
3. **View all alerts** — SOS emergencies and border violations
4. **Acknowledge & resolve** alerts as they are handled
5. **Map view** shows all active alert locations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, JSX |
| **Build Tool** | Vite 7 |
| **Maps** | Leaflet + react-leaflet |
| **Styling** | Tailwind CSS 4 + Vanilla CSS |
| **Routing** | React Router DOM 7 |
| **State** | React Context API |
| **Storage** | localStorage (offline-first) |
| **GPS** | Browser Geolocation API |
| **i18n** | Custom translation dictionary |

---

## 🗺️ Maritime Data

### Region Covered
- **North:** Chennai coast (13.4°N)
- **South:** Kanyakumari / Southern Sri Lanka (7.0°N)
- **East:** Sri Lankan coast (80.5°E)
- **West:** Indian coast (77.8°E)

### Fish Density Zones

| Zone | Intensity | Side | Key Species |
|------|-----------|------|-------------|
| Palk Bay Rich Zone | 🟢 High | 🇮🇳 India | Prawns, Crabs, Sardines |
| Rameswaram Fishing Ground | 🟢 High | 🇮🇳 India | Tuna, Mackerel, Shrimp |
| Gulf of Mannar Marine | 🟡 Medium | 🇮🇳 India | Sea Cucumber, Chanks, Grouper |
| Nagapattinam Coast | 🟡 Medium | 🇮🇳 India | Anchovies, Sardines, Pomfret |
| Cuddalore Zone | 🟠 Low | 🇮🇳 India | Sardines, Mackerel |
| Jaffna Lagoon Waters | 🟢 High | 🇱🇰 Sri Lanka | Prawns, Crab, Mullet |
| Mannar Island Zone | 🟡 Medium | 🇱🇰 Sri Lanka | Lobster, Grouper, Snapper |
| Trincomalee Waters | 🟠 Low | 🇱🇰 Sri Lanka | Tuna, Sailfish |

---

## 📜 Scripts

```bash
npm run dev       # Start dev server (hot reload)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

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
