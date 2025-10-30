import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import scenarioRoutes from './routes/scenarios-memory.js';
import simulationRoutes from './routes/simulation.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

console.log('✅ Server running in NO-DATABASE mode');
console.log('📝 Scenarios will be stored in memory (lost on restart)');

// Routes
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'in-memory'
  });
});

// WebSocket handling for real-time updates
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Broadcast simulation updates to all connected clients
      if (data.type === 'simulation_update') {
        broadcast({
          type: 'simulation_state',
          data: data.payload
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'Successfully connected to simulation server' 
  }));
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Export broadcast function for use in routes
export { broadcast };

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server running on ws://localhost:${PORT}/api/live`);
  console.log(`📱 Frontend should be running on http://localhost:5173`);
  console.log('');
  console.log('✨ All features work! Scenarios saved in memory.');
  console.log('⚠️  Note: Saved scenarios will be lost when server restarts.');
});
