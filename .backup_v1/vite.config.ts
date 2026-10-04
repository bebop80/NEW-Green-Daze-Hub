import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [
        react(),
        {
          name: 'upload-handler',
          configureServer(server) {
            server.middlewares.use('/api/upload-stage-bg', (req, res) => {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString();
                    const body = JSON.parse(rawBody);
                    const dataUrl = body.dataUrl || body.image;
                    if (dataUrl) {
                      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                      const buffer = Buffer.from(base64Data, 'base64');
                      let filename = 'gemini_stage_bg.jpg';
                      if (body.target === 'concert') filename = 'gemini_concert_bg.jpg';
                      else if (body.target === 'payments') filename = 'gemini_payments_bg.jpg';
                      fs.writeFileSync(path.resolve(__dirname, `src/assets/images/${filename}`), buffer);
                      if (!fs.existsSync(path.resolve(__dirname, 'public'))) {
                        fs.mkdirSync(path.resolve(__dirname, 'public'), { recursive: true });
                      }
                      fs.writeFileSync(path.resolve(__dirname, `public/${filename}`), buffer);
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ success: true }));
                      return;
                    }
                  } catch (e) {
                    console.error('Upload error:', e);
                  }
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Failed' }));
                });
              } else {
                res.statusCode = 405;
                res.end();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_SCRIPT_URL': JSON.stringify(env.GOOGLE_SCRIPT_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
