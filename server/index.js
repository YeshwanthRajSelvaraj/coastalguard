// ──────────────────────────────────────────────────────────────
// CoastalGuard — Real-Time SOS Backend Server
//
// Socket.IO server with RBAC for cross-device emergency alerts.
//
// Architecture:
//   • Fisherman clients → emit 'sos:send' events
//   • Server → validates, stores, broadcasts to 'authority' room
//   • Authority clients → receive real-time 'sos:new' events
//   • Offline authorities → receive missed SOS on reconnect
//
// Rooms:
//   • 'fisherman' — all connected fisherman clients
//   • 'authority' — all connected authority clients
//
// REST Endpoints:
//   POST /api/sos          — Submit SOS (fallback for WebSocket)
//   GET  /api/sos          — Get all SOS alerts
//   GET  /api/sos/:id      — Get specific SOS details
//   PATCH /api/sos/:id/ack — Acknowledge an SOS
//   PATCH /api/sos/:id/resolve — Resolve an SOS
//   GET  /api/health       — Server health check
// ──────────────────────────────────────────────────────────────

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);

// ─── Configuration ───────────────────────────────────────

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    // Allow capacitor/webview origins
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
];

// ─── Middleware ───────────────────────────────────────────

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// ─── Socket.IO Setup ────────────────────────────────────

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    // Allow reconnection with buffered events
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    },
});

// ─── In-Memory Data Store ────────────────────────────────
// In production, replace with MongoDB/PostgreSQL

const sosAlerts = new Map();        // sosId → SOS record
const connectedUsers = new Map();   // socketId → { userId, role, connectedAt }
const lastSeenTimestamps = new Map(); // `authority:${userId}` → ISO timestamp

// ─── Helper Functions ────────────────────────────────────

function generateSOSId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(sosAlerts.size + 1).padStart(4, '0');
    return `SOS-${dateStr}-${seq}`;
}

function createSOSRecord({ type, fishermanId, fishermanName, boatNumber, phone, location }) {
    const id = generateSOSId();
    const now = new Date().toISOString();

    return {
        id,
        type: type || 'sos',
        status: 'pending',

        // Identity
        fishermanId,
        fishermanName,
        boatNumber: boatNumber || 'Unknown',
        phone: phone || null,

        // Location
        location: {
            lat: location?.lat || 0,
            lng: location?.lng || 0,
            accuracy: location?.accuracy || null,
            heading: location?.heading || null,
            speed: location?.speed || null,
        },

        // Timestamps
        triggeredAt: now,
        receivedAt: now,
        acknowledgedAt: null,
        resolvedAt: null,

        // Delivery tracking
        delivery: {
            channel: 'websocket',
            broadcastedAt: now,
            deliveredTo: [],  // Authority socket IDs that received it
        },

        // Client-side SOS ID (for correlation)
        clientSOSId: null,
    };
}

function getAuthorityCount() {
    let count = 0;
    for (const [, user] of connectedUsers) {
        if (user.role === 'authority') count++;
    }
    return count;
}

function getFishermanCount() {
    let count = 0;
    for (const [, user] of connectedUsers) {
        if (user.role === 'fisherman') count++;
    }
    return count;
}

function getMissedAlerts(userId) {
    const lastSeen = lastSeenTimestamps.get(`authority:${userId}`);
    if (!lastSeen) {
        // First connection — send all unresolved alerts
        return Array.from(sosAlerts.values())
            .filter(s => s.status !== 'resolved')
            .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    }

    // Send alerts that arrived after their last disconnect
    const lastSeenDate = new Date(lastSeen);
    return Array.from(sosAlerts.values())
        .filter(s => new Date(s.receivedAt) > lastSeenDate)
        .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
}

// ─── Socket.IO Connection Handler ─────────────────────────

io.on('connection', (socket) => {
    console.log(`[WS] New connection: ${socket.id}`);

    // ── Authentication & Role Assignment ──────────────
    socket.on('auth:register', (data) => {
        const { userId, role, fullName, boatNumber, policeId } = data;

        if (!userId || !role) {
            socket.emit('auth:error', { message: 'Missing userId or role' });
            return;
        }

        if (!['fisherman', 'authority'].includes(role)) {
            socket.emit('auth:error', { message: 'Invalid role. Must be fisherman or authority' });
            return;
        }

        // Store user info
        connectedUsers.set(socket.id, {
            userId,
            role,
            fullName: fullName || 'Unknown',
            boatNumber: boatNumber || null,
            policeId: policeId || null,
            connectedAt: new Date().toISOString(),
        });

        // Join role-based room
        socket.join(role);
        console.log(`[WS] User registered: ${fullName} (${role}) — socket ${socket.id}`);

        // Send confirmation
        socket.emit('auth:confirmed', {
            socketId: socket.id,
            role,
            authorityOnline: getAuthorityCount(),
            fishermanOnline: getFishermanCount(),
        });

        // Broadcast updated counts
        io.emit('users:count', {
            authority: getAuthorityCount(),
            fisherman: getFishermanCount(),
        });

        // ── OFFLINE DELIVERY: Send missed alerts to reconnecting authorities ──
        if (role === 'authority') {
            const missed = getMissedAlerts(userId);
            if (missed.length > 0) {
                console.log(`[WS] Delivering ${missed.length} missed alerts to authority ${fullName}`);
                socket.emit('sos:missed', {
                    alerts: missed,
                    count: missed.length,
                });
            }
        }
    });

    // ── SOS Submit (from Fisherman) ───────────────────
    socket.on('sos:send', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user || user.role !== 'fisherman') {
            socket.emit('sos:error', { message: 'Unauthorized: Only fishermen can send SOS' });
            return;
        }

        console.log(`[WS] 🚨 SOS received from ${user.fullName} (${user.boatNumber})`);

        // Create SOS record
        const sos = createSOSRecord({
            type: data.type || 'sos',
            fishermanId: user.userId,
            fishermanName: user.fullName,
            boatNumber: user.boatNumber,
            phone: data.phone || null,
            location: data.location,
        });
        sos.clientSOSId = data.clientSOSId || null;

        // Store
        sosAlerts.set(sos.id, sos);

        // Acknowledge to sender
        socket.emit('sos:acknowledged', {
            sosId: sos.id,
            clientSOSId: sos.clientSOSId,
            status: 'received',
            receivedAt: sos.receivedAt,
            authorityOnline: getAuthorityCount(),
        });

        // ── BROADCAST to all authorities in real-time ──
        const authorityRoom = io.to('authority');
        authorityRoom.emit('sos:new', {
            alert: sos,
            timestamp: new Date().toISOString(),
            urgency: sos.type === 'sos' ? 'critical' : 'high',
        });

        console.log(`[WS] ✅ SOS ${sos.id} broadcasted to ${getAuthorityCount()} authority clients`);

        // Track which authority sockets received it
        io.in('authority').fetchSockets().then(sockets => {
            sos.delivery.deliveredTo = sockets.map(s => s.id);
        });
    });

    // ── SOS Acknowledge (from Authority) ──────────────
    socket.on('sos:acknowledge', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user || user.role !== 'authority') {
            socket.emit('sos:error', { message: 'Unauthorized: Only authorities can acknowledge SOS' });
            return;
        }

        const sos = sosAlerts.get(data.sosId);
        if (!sos) {
            socket.emit('sos:error', { message: 'SOS not found' });
            return;
        }

        sos.status = 'acknowledged';
        sos.acknowledgedAt = new Date().toISOString();
        sos.acknowledgedBy = user.fullName;

        // Broadcast status update to all
        io.emit('sos:updated', { alert: sos });
        console.log(`[WS] SOS ${sos.id} acknowledged by ${user.fullName}`);
    });

    // ── SOS Resolve (from Authority) ──────────────────
    socket.on('sos:resolve', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user || user.role !== 'authority') {
            socket.emit('sos:error', { message: 'Unauthorized: Only authorities can resolve SOS' });
            return;
        }

        const sos = sosAlerts.get(data.sosId);
        if (!sos) {
            socket.emit('sos:error', { message: 'SOS not found' });
            return;
        }

        sos.status = 'resolved';
        sos.resolvedAt = new Date().toISOString();
        sos.resolvedBy = user.fullName;

        // Broadcast status update to all
        io.emit('sos:updated', { alert: sos });
        console.log(`[WS] SOS ${sos.id} resolved by ${user.fullName}`);
    });

    // ── Location Update (from Fisherman) ─────────────
    socket.on('location:update', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user || user.role !== 'fisherman') return;

        // Broadcast to authority room for live tracking
        io.to('authority').emit('location:updated', {
            fishermanId: user.userId,
            fishermanName: user.fullName,
            boatNumber: user.boatNumber,
            location: data.location,
            timestamp: new Date().toISOString(),
        });
    });

    // ── Disconnect Handler ───────────────────────────
    socket.on('disconnect', (reason) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            console.log(`[WS] User disconnected: ${user.fullName} (${user.role}) — reason: ${reason}`);

            // Track last seen for authority users (for offline delivery)
            if (user.role === 'authority') {
                lastSeenTimestamps.set(`authority:${user.userId}`, new Date().toISOString());
            }

            connectedUsers.delete(socket.id);

            // Broadcast updated counts
            io.emit('users:count', {
                authority: getAuthorityCount(),
                fisherman: getFishermanCount(),
            });
        }
    });

    // ── Ping/Pong for latency monitoring ─────────────
    socket.on('ping:check', () => {
        socket.emit('pong:check', { serverTime: new Date().toISOString() });
    });
});

// ─── REST API Endpoints ──────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        connections: {
            total: connectedUsers.size,
            authority: getAuthorityCount(),
            fisherman: getFishermanCount(),
        },
        sosCount: sosAlerts.size,
        timestamp: new Date().toISOString(),
    });
});

// Submit SOS via REST (fallback)
app.post('/api/sos', (req, res) => {
    const { type, fishermanId, fishermanName, boatNumber, phone, location, clientSOSId } = req.body;

    if (!fishermanId || !location) {
        return res.status(400).json({ error: 'Missing required fields: fishermanId, location' });
    }

    const sos = createSOSRecord({ type, fishermanId, fishermanName, boatNumber, phone, location });
    sos.clientSOSId = clientSOSId || null;
    sos.delivery.channel = 'rest';
    sosAlerts.set(sos.id, sos);

    // Broadcast via WebSocket to authority clients
    io.to('authority').emit('sos:new', {
        alert: sos,
        timestamp: new Date().toISOString(),
        urgency: sos.type === 'sos' ? 'critical' : 'high',
    });

    console.log(`[REST] 🚨 SOS ${sos.id} submitted via REST and broadcasted`);
    res.status(201).json({ success: true, sosId: sos.id, receivedAt: sos.receivedAt });
});

// Get all SOS alerts
app.get('/api/sos', (req, res) => {
    const alerts = Array.from(sosAlerts.values())
        .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    res.json({ alerts, count: alerts.length });
});

// Get specific SOS
app.get('/api/sos/:id', (req, res) => {
    const sos = sosAlerts.get(req.params.id);
    if (!sos) return res.status(404).json({ error: 'SOS not found' });
    res.json(sos);
});

// Acknowledge SOS
app.patch('/api/sos/:id/ack', (req, res) => {
    const sos = sosAlerts.get(req.params.id);
    if (!sos) return res.status(404).json({ error: 'SOS not found' });

    sos.status = 'acknowledged';
    sos.acknowledgedAt = new Date().toISOString();
    sos.acknowledgedBy = req.body.acknowledgedBy || 'Authority';

    io.emit('sos:updated', { alert: sos });
    res.json({ success: true, alert: sos });
});

// Resolve SOS
app.patch('/api/sos/:id/resolve', (req, res) => {
    const sos = sosAlerts.get(req.params.id);
    if (!sos) return res.status(404).json({ error: 'SOS not found' });

    sos.status = 'resolved';
    sos.resolvedAt = new Date().toISOString();
    sos.resolvedBy = req.body.resolvedBy || 'Authority';

    io.emit('sos:updated', { alert: sos });
    res.json({ success: true, alert: sos });
});

// ─── Start Server ────────────────────────────────────────

httpServer.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════╗');
    console.log('  ║                                                  ║');
    console.log('  ║   🛡  CoastalGuard Real-Time SOS Server          ║');
    console.log('  ║                                                  ║');
    console.log(`  ║   HTTP:      http://localhost:${PORT}              ║`);
    console.log(`  ║   WebSocket: ws://localhost:${PORT}                ║`);
    console.log('  ║   Health:    /api/health                         ║');
    console.log('  ║                                                  ║');
    console.log('  ║   Rooms: fisherman | authority                   ║');
    console.log('  ║   RBAC:  Role-based access control active        ║');
    console.log('  ║                                                  ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('');
});
