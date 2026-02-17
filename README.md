# 🌊 CoastalGuard

> **Advanced Real-Time Maritime SOS & Communication System**  
> _Empowering fishermen and authorities with instant, fault-tolerant emergency response._

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)

CoastalGuard is a comprehensive safety platform designed for maritime operations in the Palk Strait region. It provides **instant SOS alerts**, **real-time GPS tracking**, and **offline-first communication** between fishermen at sea and coastal authorities on land.

---

## 🚀 Key Features

### 🎣 For Fishermen (Mobile PWA)
- **One-Tap SOS**: Dedicated emergency trigger with location stamping.
- **Offline-First**: Queues SOS alerts when offline; auto-sends upon reconnection.
- **Multi-Channel Delivery**: Intelligence engine routes alerts via Internet (4G), Satellite (SMS), or AIS based on availability.
- **Maritime Boundaries**: Proactive alerts when approaching international borders (IMBL).
- **Weather Advisory**: Real-time sea condition updates and wind warnings.

### 👮 For Authorities (Command Dashboard)
- **Real-Time Alert Feed**: Instant reception of SOS signals via WebSocket.
- **Live Tracking Map**: Visualize distress calls and active vessels on an interactive map.
- **Missed Alert Recovery**: Automatically receive alerts sent while offline.
- **Cross-Device Sync**: Acknowledge/Resolve actions sync instantly across all command centers.
- **Resource Management**: Monitor available communication channels and asset deployment.

---

## 🏗 Architecture

CoastalGuard implements a robust **Publish-Subcribe** architecture using **Socket.IO** for real-time bi-directional communication.

- **Frontend**: React (Vite) with Leaflet maps and Tailwind CSS.
- **Backend**: Node.js (Express) with Socket.IO rooms for Role-Based Access Control (RBAC).
- **Resilience**: Custom `SOSEngine` with IndexedDB caching and retry logic.

Please refer to the detailed [System Architecture Documentation](docs/ARCHITECTURE.md) for deeper technical insights.

---

## 🛠 Tech Stack

- **Client**: React 19, Tailwind CSS, React-Leaflet, Web Audio API
- **Server**: Node.js, Express, Socket.IO
- **Database**: IndexedDB (Client-side), In-Memory Store (Server-side POC)
- **Communication**: WebSocket (Primary), REST API (Fallback)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YeshwanthRajSelvaraj/coastalguard.git
    cd coastalguard
    ```

2.  **Install Dependencies**
    ```bash
    # Install client dependencies
    npm install

    # Install server dependencies
    cd server
    npm install
    cd ..
    ```

3.  **Run Application**
    Start both client and server concurrently:
    ```bash
    npm run dev:full
    ```
    - Client: `http://localhost:5173`
    - Server: `http://localhost:3001`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Fisherman** | `fisher@coastalguard.in` | `fisher123` |
| **Authority** | `officer@coastalguard.in` | `officer123` |

---

## 🤝 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed by [Yeshwanth Raj Selvaraj](https://github.com/YeshwanthRajSelvaraj)**
