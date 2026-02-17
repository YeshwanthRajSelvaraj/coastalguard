// ──────────────────────────────────────────────
// AIS Channel — Automatic Identification System (Priority 3)
// Broadcasts safety-related distress message via AIS/VHF.
//
// MOCK IMPLEMENTATION:
// Simulates an AIS transponder interface for distress broadcast.
// In production, this connects to the vessel's AIS Class B transponder
// via serial/USB interface or TCP socket to send:
//   - Message 14: Safety-related broadcast
//   - DSC Distress alert on VHF Channel 70
//
// Gateway Interface Contract:
//   The AIS gateway accepts NMEA-formatted messages:
//     !AIABM,1,1,0,000000000,0,14,<encoded_payload>*checksum
//   Response: ACK/NAK from AIS unit
//
// Integration:
//   Replace send() with actual AIS transponder SDK or
//   serial port library (e.g., serialport npm package).
// ──────────────────────────────────────────────
import { ChannelBase, CHANNEL_STATUS } from './ChannelBase';

const DEFAULT_AIS_CONFIG = {
    mmsi: '419000000',           // Maritime Mobile Service Identity (India prefix: 419)
    aisType: 'ClassB',           // Class A or Class B transponder
    vhfChannel: 70,              // DSC distress channel
    broadcastRange: 20,          // Nautical miles
    transmitPowerWatts: 2,       // Class B: 2W, Class A: 12.5W
};

export class AISChannel extends ChannelBase {
    constructor(config = {}) {
        super('ais', 3, {
            ...DEFAULT_AIS_CONFIG,
            ...config,
        });
        this._broadcasts = new Map();
        this._transponderConnected = true; // simulated
    }

    /**
     * Check AIS transponder availability.
     * In production: Query AIS unit via NMEA sentence or USB.
     *
     * PRODUCTION INTEGRATION:
     *   const ais = new SerialPort('/dev/ttyUSB0', { baudRate: 38400 });
     *   ais.write('$AITST*checksum\r\n');
     *   // Wait for ACK response
     */
    async isAvailable() {
        // ─── MOCK IMPLEMENTATION ───────────────────────────
        // Simulate AIS transponder being generally available
        // (hardware device on the boat — usually always on)

        // AIS is available as long as transponder hardware is connected
        // Unlike satellite, AIS doesn't depend on satellite visibility
        const transponderOk = this._transponderConnected;
        const gpsAvailable = true; // AIS needs GPS for own-vessel position

        if (transponderOk && gpsAvailable) {
            this.lastStatus = CHANNEL_STATUS.AVAILABLE;
        } else {
            this.lastStatus = CHANNEL_STATUS.UNAVAILABLE;
        }

        this.lastChecked = new Date().toISOString();
        return this.lastStatus === CHANNEL_STATUS.AVAILABLE;
    }

    /**
     * Broadcast AIS distress message.
     *
     * Constructs an AIS Message 14 (Safety-related broadcast) containing:
     * - MMSI of vessel in distress
     * - Position (lat/lng from GPS)
     * - Nature of distress (SOS/border violation)
     *
     * Also triggers DSC Distress Alert on VHF Ch.70 which is monitored
     * by all coast guard stations and vessels within range.
     *
     * PRODUCTION INTEGRATION POINT:
     *   const nmea = this._buildNMEASentence(sosPayload);
     *   await serialPort.write(nmea);
     *   // Or via TCP: await aisSocket.send(nmea);
     */
    async send(sosPayload) {
        const startTime = Date.now();
        this.recordAttempt(false);

        try {
            const available = await this.isAvailable();
            if (!available) {
                throw new Error('AIS transponder not connected or GPS unavailable');
            }

            // Build AIS distress message
            const aisMessage = this._buildDistressMessage(sosPayload);

            // ─── MOCK: Simulate AIS broadcast ──────────────
            // AIS transmission is fast (< 1 second) since it's VHF radio
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

            // AIS broadcasts are fire-and-forget (no guaranteed delivery)
            // But coast guard AIS receivers within range will pick it up
            const broadcastSuccess = Math.random() < 0.95; // 95% hardware success rate

            if (!broadcastSuccess) {
                throw new Error('AIS transponder TX failure — antenna issue');
            }

            const messageId = `AIS-${Date.now()}-${this.config.mmsi.slice(-4)}`;
            const broadcastAt = new Date().toISOString();

            this._broadcasts.set(messageId, {
                message: aisMessage,
                broadcastAt,
                mmsi: this.config.mmsi,
                position: sosPayload.location,
                range: this.config.broadcastRange,
                channel: this.config.vhfChannel,
            });

            this.failCount--;

            return {
                success: true,
                messageId,
                error: null,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    deliveredAt: broadcastAt,
                    mmsi: this.config.mmsi,
                    broadcastRange: `${this.config.broadcastRange} NM`,
                    vhfChannel: this.config.vhfChannel,
                    aisMessageType: 14,
                    mode: 'broadcast',
                    note: 'AIS broadcasts are received by all vessels and coast guard stations within range',
                },
            };
        } catch (err) {
            return {
                success: false,
                messageId: null,
                error: err.message,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    failedAt: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * AIS is broadcast — no delivery confirmation available.
     * We can only confirm the transponder transmitted successfully.
     */
    async getStatus(messageId) {
        const record = this._broadcasts.get(messageId);
        if (!record) return { delivered: false, timestamp: null };
        return {
            delivered: true,
            timestamp: record.broadcastAt,
            note: 'AIS is broadcast — delivery to specific receiver cannot be confirmed',
            mmsi: record.mmsi,
        };
    }

    /**
     * Build AIS-formatted distress message.
     * In production, this would generate proper NMEA 0183 sentences.
     */
    _buildDistressMessage(payload) {
        const nature = payload.type === 'sos' ? 'MAYDAY' : 'SECURITE';
        const lat = this._formatAISCoord(payload.location.lat, 'lat');
        const lng = this._formatAISCoord(payload.location.lng, 'lng');
        const time = new Date(payload.triggeredAt).toISOString().slice(11, 19).replace(/:/g, '');

        return {
            type: 'MSG14_SAFETY',
            mmsi: this.config.mmsi,
            nature,
            text: `${nature} ${nature} ${nature} THIS IS ${payload.boatNumber} ` +
                `MMSI ${this.config.mmsi} IN POSITION ${lat} ${lng} ` +
                `AT ${time}UTC REQUIRE IMMEDIATE ASSISTANCE ` +
                `${payload.fishermanName} OVER`,
            encodedPosition: { lat: payload.location.lat, lng: payload.location.lng },
            dscAlert: {
                channel: this.config.vhfChannel,
                category: payload.type === 'sos' ? 'DISTRESS' : 'SAFETY',
                nature: payload.type === 'sos' ? 'UNDESIGNATED' : 'DANGEROUS_SITUATION',
            },
        };
    }

    /**
     * Format coordinates in AIS standard (DDDMM.MMMM N/S/E/W)
     */
    _formatAISCoord(value, type) {
        const dir = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
        const abs = Math.abs(value);
        const deg = Math.floor(abs);
        const min = (abs - deg) * 60;
        return `${String(deg).padStart(type === 'lat' ? 2 : 3, '0')}${min.toFixed(4).padStart(7, '0')}${dir}`;
    }

    /**
     * Get AIS-specific diagnostics.
     */
    getDiagnostics() {
        return {
            ...this.getHealth(),
            mmsi: this.config.mmsi,
            transponderType: this.config.aisType,
            txPower: `${this.config.transmitPowerWatts}W`,
            broadcastRange: `${this.config.broadcastRange} NM`,
            vhfChannel: this.config.vhfChannel,
            totalBroadcasts: this._broadcasts.size,
        };
    }
}
