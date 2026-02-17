# CoastalGuard — Fault-Tolerant SOS Communication System

## Architecture Overview

A multi-channel, offline-first emergency communication system designed for Indian fishermen
operating in the Chennai–Sri Lanka (Palk Strait) maritime region with intermittent or no
cellular connectivity.

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
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │     │
│  │  REST    │  │  Satellite   │  │  AIS VHF    │ │     │
│  │  Server  │  │  Ground Stn  │  │  Receiver   │ │     │
│  │  (HTTPS) │  │  (Iridium/   │  │  (MMSI      │ │     │
│  │          │  │   INMARSAT)  │  │   Based)    │ │     │
│  └─────┬────┘  └──────┬───────┘  └──────┬──────┘ │     │
│        │              │                 │         │     │
└────────┼──────────────┼─────────────────┼─────────┘     │
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
│  │  Delivery Log: Internet ✓ | Satellite ⏳ | AIS ✓         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
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
                    ┌────────▼─────────┐
              ┌─────│  Detect Network  │─────┐
              │     │  Availability    │     │
              │     └──────────────────┘     │
              │                              │
         ONLINE                          OFFLINE
              │                              │
    ┌─────────▼──────────┐         ┌────────▼─────────┐
    │ Try Channel 1:     │         │  Mark as CACHED  │
    │ INTERNET (REST)    │         │  Start offline   │
    │                    │         │  retry timer     │
    └────────┬───────────┘         │  (every 30s)     │
             │                     └──────────────────┘
        ┌────┴────┐
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
        │        │        ┌────┴────┐
        │        │      SUCCESS   FAIL
        │        │        │         │
        │        │        │    ┌────▼──────────────┐
        │        │        │    │ ALL CHANNELS FAIL │
        │        │        │    │ Cache + Retry in  │
        │        │        │    │ 30 seconds        │
        │        │        │    └───────────────────┘
        │        │        │
        ▼        ▼        ▼
    ┌──────────────────────────┐
    │  Update SOS status:      │
    │  • deliveredVia: channel │
    │  • deliveredAt: timestamp│
    │  • attempts: count       │
    │                          │
    │  Notify Authority        │
    │  Dashboard (real-time)   │
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
│   ├── InternetChannel.js # REST API channel (Priority 1)
│   ├── SatelliteChannel.js# Satellite SMS gateway mock (Priority 2)
│   └── AISChannel.js      # AIS distress broadcast mock (Priority 3)

src/contexts/
├── SOSContext.jsx         # React context — SOS state & actions

src/components/
├── SOSStatusPanel.jsx     # Delivery status visualization

src/pages/
├── FishermanDashboard.jsx # Updated with SOS engine integration
├── PoliceDashboard.jsx    # Updated with channel delivery monitor
```

---

## Scalability & Deployment Considerations

| Aspect | Design Decision |
|--------|----------------|
| **Government deployment** | Gateway interfaces allow swapping mock channels with real Iridium/INMARSAT/AIS hardware |
| **Low bandwidth** | SOS payload is <500 bytes — works on 2G/satellite SMS |
| **Offline-first** | All SOS cached to IndexedDB before any transmission attempt |
| **Multi-device** | localStorage events + polling sync across tabs/WebViews |
| **Audit trail** | Every channel attempt logged with timestamps and errors |
| **Future integration** | Navy/Coast Guard can receive via existing AIS/VHF infrastructure |
