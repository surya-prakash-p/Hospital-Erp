import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the built React app (run `npm run build` first)
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy middleware to forward /api requests to Frappe server
app.all('/api/*', async (req, res) => {
  const targetUrl = `http://localhost:8000${req.originalUrl}`;
  try {
    // Copy incoming headers but strip out host
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }

    const options = {
      method: req.method,
      headers: headers
    };

    // Forward the body if present
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetUrl, options);

    // Copy response headers
    response.headers.forEach((value, key) => {
      // Don't copy transfer-encoding or content-encoding, let express handle it
      if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);

    const bodyText = await response.text();
    res.send(bodyText);
  } catch (error) {
    console.error('Frappe Proxy Error:', error);
    res.status(500).json({ message: 'Error proxying request to Frappe database: ' + error.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Hospital ERP server started!`);
  console.log(`   Local URL:   http://localhost:${PORT}`);
  console.log(`   Frappe Host: http://localhost:8000\n`);
});
