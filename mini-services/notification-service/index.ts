/**
 * BusTrack Pro — Real-Time Notification WebSocket Service
 * Provides live transit updates: delays, arrivals, crew status, system alerts
 * Port: 3005
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3005;
const wss = new WebSocketServer({ port: PORT });

// ============================================================
// Simulated Transit Data Generators
// ============================================================

interface TransitEvent {
  type: 'delay' | 'arrival' | 'departure' | 'crew_status' | 'system' | 'weather';
  route?: string;
  location?: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  timestamp: string;
}

const routes = ['BLR-101', 'BLR-215', 'BLR-342', 'BLR-418', 'MUM-012', 'DEL-005', 'CHN-008', 'BLR-523', 'HYD-003', 'BLR-712'];
const locations = ['Majestic Bus Stand', 'Whitefield ITPL', 'Electronic City', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Marathahalli', 'JP Nagar', 'Hebbal', 'MG Road'];
const crewNames = ['Rajesh Kumar', 'Suresh Babu', 'Anitha Sharma', 'Mohammed Irfan', 'Priya Nair', 'Venkat Rao', 'Lakshmi Devi', 'Karthik Reddy'];

const delayMessages = [
  (r: string, l: string) => `Route ${r} delayed by 5-8 min near ${l} due to traffic congestion`,
  (r: string, l: string) => `Route ${r} experiencing minor delay at ${l} — road maintenance ahead`,
  (r: string) => `Route ${r} running 3 min late — adjusting schedule`,
  (r: string) => `Route ${r} back on schedule after earlier delay`,
];

const arrivalMessages = [
  (r: string, l: string) => `Route ${r} has arrived at ${l}`,
  (r: string, l: string) => `Route ${r} boarding at ${l} — 5 min departure`,
  (r: string, l: string) => `Route ${r} departing from ${l} now`,
];

const crewMessages = [
  (n: string) => `${n} started shift — assigned to Route BLR-215`,
  (n: string) => `${n} completed trip — on time performance maintained`,
  (n: string) => `${n} requested break at current stop`,
  (n: string) => `${n} reported vehicle issue — maintenance notified`,
];

const systemMessages = [
  'System health check: All services operational',
  'Schedule generation completed for tomorrow — 64 schedules created',
  'Crew auto-assignment optimization ran — Jain\'s Fairness Index: 0.92',
  'Route analytics updated — daily report generated',
  'Database backup completed successfully',
  'Fleet utilization at 87% — optimal range',
];

const weatherMessages = [
  'Heavy rain expected in Bangalore area (17:00-19:00) — routes may be delayed',
  'Clear weather in Delhi — normal operations expected',
  'Fog advisory for Chennai morning routes — allow extra travel time',
  'Mumbai high tide alert — coastal routes may experience minor delays',
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent(): TransitEvent {
  const now = new Date();
  const timestamp = now.toISOString();

  const eventRoll = Math.random();

  if (eventRoll < 0.25) {
    // Delay event
    return {
      type: 'delay',
      route: randomChoice(routes),
      location: randomChoice(locations),
      message: randomChoice(delayMessages)(randomChoice(routes), randomChoice(locations)),
      severity: Math.random() > 0.5 ? 'warning' : 'info',
      timestamp,
    };
  } else if (eventRoll < 0.45) {
    // Arrival/Departure
    return {
      type: Math.random() > 0.5 ? 'arrival' : 'departure',
      route: randomChoice(routes),
      location: randomChoice(locations),
      message: randomChoice(arrivalMessages)(randomChoice(routes), randomChoice(locations)),
      severity: 'success',
      timestamp,
    };
  } else if (eventRoll < 0.6) {
    // Crew status
    return {
      type: 'crew_status',
      message: randomChoice(crewMessages)(randomChoice(crewNames)),
      severity: 'info',
      timestamp,
    };
  } else if (eventRoll < 0.8) {
    // System
    return {
      type: 'system',
      message: randomChoice(systemMessages),
      severity: 'info',
      timestamp,
    };
  } else {
    // Weather
    return {
      type: 'weather',
      message: randomChoice(weatherMessages),
      severity: Math.random() > 0.6 ? 'warning' : 'info',
      timestamp,
    };
  }
}

// ============================================================
// WebSocket Connection Handling
// ============================================================

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Notification Service] Client connected. Total: ${clients.size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'BusTrack Pro Real-Time Notification Service',
    serverTime: new Date().toISOString(),
    connectedClients: clients.size,
  }));

  // Send initial burst of 3 recent events
  for (let i = 0; i < 3; i++) {
    const event = generateEvent();
    ws.send(JSON.stringify(event));
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Notification Service] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[Notification Service] WebSocket error:`, err.message);
    clients.delete(ws);
  });

  // Handle client messages (ping/pong)
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch {
      // ignore invalid messages
    }
  });
});

// ============================================================
// Broadcast Loop — Send events every 8-15 seconds
// ============================================================

function getBroadcastInterval(): number {
  // Random interval between 8-15 seconds
  return 8000 + Math.random() * 7000;
}

function broadcast() {
  if (clients.size === 0) {
    // No clients connected, slow down
    setTimeout(broadcast, 5000);
    return;
  }

  const event = generateEvent();
  const payload = JSON.stringify(event);

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`[Notification Service] Broadcast: [${event.type}] ${event.message.slice(0, 60)}... (${sentCount} clients)`);
  }

  // Schedule next broadcast
  setTimeout(broadcast, getBroadcastInterval());
}

// Start broadcasting after 3 seconds
setTimeout(broadcast, 3000);

// ============================================================
// Periodic Cleanup — Remove dead connections
// ============================================================

setInterval(() => {
  let removed = 0;
  clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN && client.readyState !== WebSocket.CONNECTING) {
      clients.delete(client);
      removed++;
    }
  });
  if (removed > 0) {
    console.log(`[Notification Service] Cleaned up ${removed} dead connections`);
  }
}, 30000);

console.log(`[Notification Service] BusTrack Pro Notification WebSocket running on ws://localhost:${PORT}`);
