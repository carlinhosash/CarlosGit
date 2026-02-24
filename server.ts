import express from 'express';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for temperature data
  

  // Create HTTP server
  const server = http.createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  function broadcast(data: object) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  

    app.post('/api/get-weather', async (req, res) => {
    const { city } = req.body;
    if (!city) {
      return res.status(400).json({ error: 'City is required.' });
    }

    try {
      const n8nWebhookUrl = 'https://n8n-n8n.gkm8su.easypanel.host/webhook/clima';
      const response = await axios.post(n8nWebhookUrl, { name: city });

      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format from weather service.');
      }

      const weatherInfo = data[0];

      if (!weatherInfo.location || !weatherInfo.current) {
        throw new Error('Incomplete weather data received.');
      }

      // Broadcast the new weather data to all connected clients
      broadcast(weatherInfo);

      res.status(200).json({ message: 'Weather data fetched and broadcasted successfully.' });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
