import WebSocket from 'ws';
import fetch from 'node-fetch';
import express from 'express';

const app = express();
const port = 3000;

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store latest prices
let latestPrices = {};

// Fetch supported currencies
async function fetchSupportedCurrencies() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
    const currencies = await response.json();
    return currencies.map(c => c.id);
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    return [];
  }
}

// Fetch price data
async function fetchPrices() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,dogecoin,cardano,polkadot,litecoin&vs_currencies=usd&include_24hr_change=true'
    );
    const data = await response.json();
    latestPrices = data;
    
    // Broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'prices',
          data: latestPrices
        }));
      }
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial prices
  ws.send(JSON.stringify({
    type: 'prices',
    data: latestPrices
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start price updates
setInterval(fetchPrices, 1000);

// HTTP endpoints
app.get('/prices', (req, res) => {
  res.json(latestPrices);
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Start HTTP server
app.listen(port, () => {
  console.log(`Market data server running on port ${port}`);
  console.log(`WebSocket server running on port 8080`);
});