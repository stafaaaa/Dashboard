import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/callback`
  );

  // Google Photos Auth URL
  app.get('/api/auth/google/url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
      prompt: 'consent'
    });
    res.json({ url });
  });

  // OAuth Callback
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // In a real app, store this in a secure session or database
      // For this demo, we'll send it back to the client to store in localStorage (less secure but works for standalone tablet)
      const tokenData = JSON.stringify(tokens);
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_PHOTOS_AUTH_SUCCESS', tokens: ${tokenData} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentifizierung erfolgreich. Dieses Fenster schließt sich automatisch.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Proxy to Google Photos API
  app.post('/api/photos/list', async (req, res) => {
    const { tokens } = req.body;
    if (!tokens || !tokens.access_token) {
      return res.status(401).json({ error: 'No tokens provided' });
    }

    try {
      const response = await axios.get('https://photoslibrary.googleapis.com/v1/mediaItems', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        },
        params: {
          pageSize: 50
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching photos:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch photos' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
