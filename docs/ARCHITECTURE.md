# CoastalGuard — Role-Based Real-Time SOS Communication System

## Architecture Overview

A multi-channel, offline-first emergency communication system designed for Indian fishermen
operating in the Chennai–Sri Lanka (Palk Strait) maritime region. The same APK serves both
**Fisherman** and **Authority** roles, with role-based dashboards and real-time SOS delivery
via Socket.IO WebSockets.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FISHERMAN DEVICE (PWA)                         │
│                                                                       │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────────────────────┐  │
│  │   GPS    │──▶│  SOS ENGINE      │──▶│  DELIVERY STATUS UI      │  │
│  │  Module  │   │  (Orchestrator)  │   │  • Channel indicator     │  │
│  └──────────┘   │                  │   │  • Retry countdown       │  │
│                 │  ┌─────────────┐ │   │  • Offline cache status  │  │
│  ┌──────────┐   │  │  Network    │ │   └──────────────────────────┘  │
│  │  User    │──▶│  │  Detector   │ │                                 │
│  │ Identity │   │  └──────┬──────┘ │                                 │
│  └──────────┘   │         │        │                                 │
│                 │  ┌──────▼──────┐ │                                 │
│                 │  │  Channel    │ │                                 │
│                 │  │  Router     │ │                                 │
│                 │  └──────┬──────┘ │                                 │
│                 │         │        │                                 │
│                 └─────────┼────────┘                                 │
│                           │                                          │
│              ┌────────────┼────────────┐                             │
│              ▼            ▼            ▼                             │
│    ┌──────────────┐ ┌──────────┐ ┌──────────┐   ┌──────────────┐   │
│    │   INTERNET   │ │SATELLITE │ │   AIS    │   │  OFFLINE     │   │
│    │   Channel    │ │ Channel  │ │ Channel  │   │  CACHE       │   │
│    │  (REST API)  │ │ (SMS GW) │ │(Distress)│   │ (IndexedDB)  │   │
│    │  Priority: 1 │ │Priority:2│ │Priority:3│   │  Auto-retry  │   │
│    └──────┬───────┘ └────┬─────┘ └────┬─────┘   └──────┬───────┘   │
│           │              │            │                 │           │
└───────────┼──────────────┼────────────┼─────────────────┼───────────┘
            │              │            │                 │
            ▼              ▼            ▼                 │
┌───────────────────────────────────────────────────┐     │
│              COMMUNICATION LAYER                  │     │
│                                                   │     │
│  ┌──────────────────────────────────────────────┐ │     │
│  │         Socket.IO SERVER (Node.js)           │ │     │
│  │  ┌────────┐  ┌──────────┐  ┌─────────────┐  │ │     │
│  │  │  REST  │  │  WebSocket│  │  Room-Based │  │ │     │
│  │  │  API   │  │  Events   │  │  Broadcast  │  │ │     │
│  │  │  /api/ │  │  sos:send │  │  authority  │  │ │     │
│  │  │  sos   │  │  sos:new  │  │  fisherman  │  │ │     │
│  │  └────────┘  └──────────┘  └─────────────┘  │ │     │
│  │                                              │ │     │
│  │  In-Memory Store (Map)                       │ │     │
│  │  • sosAlerts: SOS records                    │ │     │
│  │  • connectedUsers: socketId → role/identity  │ │     │
│  │  • lastSeenTimestamps: offline tracking      │ │     │
│  └──────────────────────────────────────────────┘ │     │
│                                                   │     │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │     │
│  │Satellite │  │  AIS VHF     │  │  Offline     │ │     │
│  │Ground Stn│  │  Receiver    │  │  Queue Flush │ │     │
│  │(Gateway) │  │  (MMSI)      │  │  (on connect)│ │     │
│  └──────────┘  └──────────────┘  └─────────────┘ │     │
└───────────────────────────────────────────────────┘     │
         │              │                 │               │
         ▼              ▼                 ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORITY DASHBOARD                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Alert       │  │  Real-time   │  │  Channel Delivery     │ │
│  │  Feed        │  │  Map View    │  │  Status Monitor       │ │
│  │  (Live)      │  │  (Leaflet)   │  │  (Per-alert tracker)  │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RealtimeSOSBanner: Fullscreen alert with audio + GPS    │  │
│  │  MissedAlerts: Queued SOS delivered on reconnection      │  │
│  │  WebSocket Ack/Resolve: Cross-device status sync         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────────┐
│                    SAME APK / PWA                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   LOGIN PAGE                     │   │
│  │  Email + Password → AuthContext validates role   │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          │                         │                     │
│    role: fisherman           role: authority              │
│          │                         │                     │
│    ┌─────▼───────────┐   ┌────────▼──────────┐          │
│    │ /dashboard      │   │ /authority         │          │
│    │ FishermanDash   │   │ PoliceDashboard    │          │
│    │                 │   │                    │          │
│    │ • GPS tracking  │   │ • SOS feed (live)  │          │
│    │ • SOS trigger   │   │ • Map monitoring   │          │
│    │ • Border alerts │   │ • Ack/Resolve      │          │
│    │ • Weather       │   │ • Channel monitor  │          │
│    │ • Fish zones    │   │ • Notifications    │          │
│    └─────────────────┘   └───────────────────┘          │
│                                                          │
│  ProtectedRoute: Enforces role-based routing             │
│  SocketContext: Auto-joins role-based WebSocket rooms     │
└──────────────────────────────────────────────────────────┘
```

### Role Flow
- **AuthContext** stores user session in `localStorage`
- **ProtectedRoute** component checks `user.role` and redirects accordingly
- **SocketContext** auto-connects on login, joins `fisherman` or `authority` Socket.IO room
- Server enforces RBAC: only fishermen can emit `sos:send`, only authorities can `sos:acknowledge`

---

## Real-Time SOS Delivery Flow

```
  FISHERMAN DEVICE                    SERVER                      AUTHORITY DEVICE(S)
  ────────────────                    ──────                      ──────────────────

  1. User taps SOS
         │
  2. SOSEngine.triggerSOS()
         │
  3. Cache to IndexedDB ◄─── OFFLINE-FIRST GUARANTEE
         │
  ┌──────┼──────┐
  │      │      │
  │  4a. WebSocket              4b. REST API POST
  │  sos:send event      ──▶   POST /api/sos
  │      │                          │
  │      ▼                          ▼
  │  ┌───────────────────────────────────────┐
  │  │         SOCKET.IO SERVER              │
  │  │                                       │
  │  │  • Validate sender role (fisherman)   │
  │  │  • Create SOS record with ID          │
  │  │  • Store in sosAlerts Map             │
  │  │  • io.to('authority').emit('sos:new') │
  │  │  • Track delivery to connected auths  │
  │  │  • Send ack to fisherman              │
  │  └───────────┬───────────────────────────┘
  │              │
  │              ├──────────────────▶  5. SocketContext receives 'sos:new'
  │              │                         │
  │              │                    6. RealtimeSOSBanner shows:
  │              │                       • Fullscreen alert overlay
  │              │                       • Audio tone (Web Audio API)
  │              │                       • Vibration pattern
  │              │                       • GPS coordinates + identity
  │              │
  │              ├──────────────────▶  7. Injected into AlertContext
  │              │                       via _injectIntoLegacyAlertSystem()
  │              │                         │
  │              │                    8. AlertCard appears in feed
  │              │                       with "Live" indicator
  │              │
  │              ├──────────────────▶  9. MapView updates with
  │              │                       new alert marker
  │              │
  │  ◄───────────┘  sos:acknowledged
  │
  5. Fisherman sees
     "SOS Delivered" banner
```

---

## Offline Delivery — Missed Alerts on Reconnection

```
  AUTHORITY GOES OFFLINE                SERVER                    AUTHORITY RECONNECTS
  ──────────────────────               ──────                    ──────────────────────

  1. socket.disconnect()
         │
         ├──────────────────▶  2. Server records:
         │                       lastSeenTimestamps.set(
         │                         'authority:userId',
         │                         disconnectedAt
         │                       )
         │
         │                     3. New SOS arrives from fisherman
         │                        while authority is offline
         │                        → Stored in sosAlerts Map
         │
         │                                                    4. Authority reconnects
         │                                                       socket.connect()
         │                                                         │
         │                     5. Server detects reconnection:  ◄──┘
         │                       getMissedAlerts(userId)
         │                       → Find all SOS > lastSeen
         │                       → Emit 'sos:missed' with array
         │                                 │
         │                                 └──────────────▶  6. SocketContext receives
         │                                                      'sos:missed' event
         │                                                         │
         │                                                    7. RealtimeSOSBanner shows
         │                                                       "X Missed Alerts" banner
         │                                                         │
         │                                                    8. All missed alerts injected
         │                                                       into AlertContext + localStorage
```

---

## SOS Delivery — Channel Priority & Fallback Logic

```
                    ┌──────────────────┐
                    │   SOS TRIGGERED  │
                    │  (GPS + Identity │
                    │   + Timestamp)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Cache SOS to    │
                    │  IndexedDB       │
                    │  (status: queued)│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         WebSocket      REST API      Multi-Channel
         (parallel)     (parallel)    (sequential)
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌────────────┐  ┌────────────────┐
    │SocketService│  │InternetCh. │  │ Detect Network │
    │.sendSOS()   │  │POST /api/  │  │ Availability   │
    │             │  │sos to      │  └────────┬───────┘
    │ Real-time   │  │backend     │           │
    │ cross-device│  │server      │     ┌─────┴─────┐
    └─────────────┘  └────────────┘   ONLINE    OFFLINE
                                        │           │
                              ┌─────────▼────────┐  │
                              │ Try Channel 1:   │  │
                              │ INTERNET (REST)  │  ▼
                              └────────┬─────────┘  Mark CACHED
                                       │           Start retry
                                  ┌────┴────┐     (every 30s)
                                SUCCESS   FAIL
                                  │         │
                                  │    ┌────▼──────────────┐
                                  │    │ Try Channel 2:    │
                                  │    │ SATELLITE (SMS)   │
                                  │    └────────┬──────────┘
                                  │             │
                                  │        ┌────┴────┐
                                  │      SUCCESS   FAIL
                                  │        │         │
                                  │        │    ┌────▼──────────────┐
                                  │        │    │ Try Channel 3:    │
                                  │        │    │ AIS (Distress)    │
                                  │        │    └────────┬──────────┘
                                  │        │             │
                                  ▼        ▼             ▼
                              ┌──────────────────────────┐
                              │  Update SOS status:      │
                              │  • deliveredVia: channel │
                              │  • deliveredAt: timestamp│
                              │  • attempts: count       │
                              └──────────────────────────┘
```

---

## Data Models

### SOS Payload

```javascript
{
    id:             "SOS-20260217-0001",          // Unique SOS ID
    type:           "sos" | "border",              // Alert type
    status:         "queued" | "sending" | "delivered" | "cached" | "failed",

    // Identity
    fishermanId:    "USR-001",
    fishermanName:  "Murugan K",
    boatNumber:     "IND-TN-4521",
    phone:          "+919876543210",

    // Location (GPS-first)
    location: {
        lat:        9.2845,
        lng:        79.3172,
        accuracy:   12,                            // meters
        heading:    245,                            // degrees
        speed:      3.2,                            // m/s
    },

    // Timestamps
    triggeredAt:    "2026-02-17T14:30:00.000Z",
    cachedAt:       "2026-02-17T14:30:00.100Z",    // When stored offline
    deliveredAt:    "2026-02-17T14:30:01.500Z",    // When confirmed delivered

    // Delivery tracking
    delivery: {
        channel:    "internet" | "satellite" | "ais" | null,
        attempts:   3,
        history: [
            { channel: "internet",  status: "failed",    at: "...", error: "Network timeout" },
            { channel: "satellite", status: "failed",    at: "...", error: "Gateway timeout" },
            { channel: "ais",       status: "delivered", at: "...", mmsi: "419000123" },
        ]
    },

    // Authority response
    acknowledgedAt: null,
    resolvedAt:     null,
}
```

### WebSocket Events

```
CLIENT → SERVER:
  auth:register     { userId, role, fullName, boatNumber, policeId }
  sos:send          { type, location, clientSOSId, phone }
  sos:acknowledge   { sosId }
  sos:resolve       { sosId }
  location:update   { location }
  ping:check        (no payload)

SERVER → CLIENT:
  auth:confirmed    { socketId, role, authorityOnline, fishermanOnline }
  auth:error        { message }
  sos:new           { alert, timestamp, urgency }           → authority room only
  sos:missed        { alerts[], count }                     → reconnecting authority
  sos:acknowledged  { sosId, clientSOSId, status, receivedAt, authorityOnline }
  sos:updated       { alert }                               → broadcast to all
  sos:error         { message }
  users:count       { authority, fisherman }                 → broadcast to all
  location:updated  { fishermanId, fishermanName, location } → authority room only
  pong:check        { serverTime }
```

### Channel Gateway Interface

```javascript
/**
 * All communication channels implement this interface.
 * Satellite and AIS are abstracted behind gateways for
 * seamless hardware integration in future deployments.
 */
class CommunicationChannel {
    name        // "internet" | "satellite" | "ais"
    priority    // 1 (highest) → 3 (lowest)

    async isAvailable()     // → boolean (can this channel send right now?)
    async send(sosPayload)  // → { success, messageId, error }
    async getStatus(msgId)  // → { delivered, timestamp }
}
```

---

## Offline-First Architecture

```
┌────────────────────────────────────────────────────┐
│                IndexedDB / localStorage            │
│                                                    │
│  ┌─────────────────┐    ┌───────────────────────┐ │
│  │  SOS_QUEUE       │    │  DELIVERY_LOG          │ │
│  │                  │    │                        │ │
│  │  • Pending SOS   │    │  • Channel attempts    │ │
│  │  • Retry count   │    │  • Success/fail log    │ │
│  │  • Last attempt  │    │  • Timestamps          │ │
│  │  • GPS snapshot  │    │  • Error messages      │ │
│  └─────────────────┘    └───────────────────────┘ │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │  CONNECTIVITY_STATE                          │  │
│  │  • online/offline                            │  │
│  │  • Last known channel availability           │  │
│  │  • Signal strength estimate                  │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
         │                          ▲
         │  On connectivity         │  Periodic scan
         │  restored:               │  (every 30s)
         │                          │
         ▼                          │
┌──────────────────┐       ┌───────┴──────────┐
│  Flush Queue     │       │  Network Detector │
│  (FIFO order)    │       │  • navigator.onLine│
│  Try each SOS    │       │  • Fetch heartbeat │
│  through channel │       │  • Sat/AIS probe   │
│  priority chain  │       └──────────────────┘
└──────────────────┘
```

---

## Component Architecture

```
src/services/sos/
├── SOSEngine.js           # Main orchestrator — queue, retry, channel routing
├── SOSCache.js            # Offline storage (IndexedDB + localStorage fallback)
├── NetworkDetector.js     # Connectivity detection & signal probing
├── channels/
│   ├── ChannelBase.js     # Abstract channel interface
│   ├── InternetChannel.js # REST API channel → real backend POST (Priority 1)
│   ├── SatelliteChannel.js# Satellite SMS gateway mock (Priority 2)
│   └── AISChannel.js      # AIS distress broadcast mock (Priority 3)

src/services/
├── socketService.js       # Socket.IO client singleton (npm: socket.io-client)
├── authService.js         # localStorage-based auth (RBAC: fisherman/authority)
├── alertService.js        # Legacy localStorage alert system
├── locationService.js     # GPS watch + border distance calculation
├── notificationService.js # Browser push notifications + audio alerts
├── weatherService.js      # Open-Meteo weather API integration

src/contexts/
├── AuthContext.jsx         # Login state, role, session management
├── SocketContext.jsx       # WebSocket state, SOS events, missed alerts
├── SOSContext.jsx          # SOS engine state & channel monitoring
├── AlertContext.jsx        # Legacy alert feed (localStorage-based)
├── TranslationContext.jsx  # i18n (English/Tamil)

src/components/
├── ProtectedRoute.jsx     # Role-based route guard
├── RealtimeSOSBanner.jsx  # Fullscreen emergency alert overlay
├── RealtimeIndicator.jsx  # WebSocket connection status indicator
├── AlertCard.jsx          # Alert card with WS-based ack/resolve
├── SOSStatusPanel.jsx     # Multi-channel delivery status display
├── MapView.jsx            # Leaflet map with alerts + boundary
├── Navbar.jsx             # Navigation with role-based content
├── WeatherWidget.jsx      # Sea conditions from Open-Meteo API
├── ActionButton.jsx       # Styled action buttons
├── AlertBanner.jsx        # Dismissible alert banners
├── StatusBadge.jsx        # Status indicator badges
├── InputField.jsx         # Form input components
├── LanguageSwitcher.jsx   # English/Tamil toggle

src/pages/
├── LoginPage.jsx          # Shared login → role-based redirect
├── FishermanSignup.jsx    # Fisherman registration
├── AuthoritySignup.jsx    # Authority registration
├── FishermanDashboard.jsx # GPS, SOS, fish zones, weather
├── PoliceDashboard.jsx    # Alert feed, map, channel monitor

server/
├── index.js               # Express + Socket.IO backend
│                            • Room-based RBAC ('fisherman'/'authority')
│                            • SOS broadcast to authority room
│                            • REST API fallback endpoints
│                            • Missed alert delivery on reconnect
│                            • Connection state recovery
├── package.json           # Server dependencies (express, socket.io, cors, uuid)
```

---

## REST API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/sos` | Submit SOS (REST fallback) | Fisherman |
| `GET` | `/api/sos` | List all SOS alerts | Authority |
| `GET` | `/api/sos/:id` | Get specific SOS | Authority |
| `PATCH` | `/api/sos/:id/ack` | Acknowledge SOS | Authority |
| `PATCH` | `/api/sos/:id/resolve` | Resolve SOS | Authority |
| `GET` | `/api/health` | Server health check | Public |

---

## Scalability & Deployment Considerations

| Aspect | Design Decision |
|--------|----------------|
| **Same APK** | Single codebase serves both fisherman and authority via RBAC routing |
| **Government deployment** | Gateway interfaces allow swapping mock channels with real Iridium/INMARSAT/AIS hardware |
| **Low bandwidth** | SOS payload is <500 bytes — works on 2G/satellite SMS |
| **Offline-first** | All SOS cached to IndexedDB before any transmission attempt |
| **Real-time delivery** | Socket.IO with room-based broadcast ensures <100ms latency |
| **Missed alerts** | Server tracks lastSeen timestamps, delivers missed SOS on reconnection |
| **Cross-device sync** | Authority ack/resolve propagated via WebSocket to all connected clients |
| **Multi-device** | localStorage events + WebSocket rooms sync across tabs/WebViews |
| **Audit trail** | Every channel attempt logged with timestamps and errors |
| **Future integration** | Navy/Coast Guard can receive via existing AIS/VHF infrastructure |

---

## Running the System

```bash
# Install dependencies
npm install              # Client dependencies
cd server && npm install # Server dependencies

# Run everything (client + server concurrently)
npm run dev:full

# Or run separately:
npm run dev              # Vite client on :5173
npm run server           # Socket.IO server on :3001

# Demo accounts:
# Fisherman: fisher@coastalguard.in / fisher123
# Authority: officer@coastalguard.in / officer123
```
