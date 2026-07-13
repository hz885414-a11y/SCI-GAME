import express from "express";
import path from "path";
import https from "https";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Google Drive Streaming Proxy
  app.get("/api/video", async (req, res) => {
    const fileId = "1-Q1dUSPAawrpB7tCZjOSUAq4A7VDbX0o";
    const rangeHeader = req.headers.range;

    console.log(`[Video Proxy] Request for file ${fileId}, Range: ${rangeHeader || 'None'}`);

    try {
      const getGoogleDriveStream = (fId: string, range: string | undefined): Promise<{ headers: any; stream: any; status: number }> => {
        return new Promise((resolve, reject) => {
          const url = `https://drive.google.com/uc?export=download&id=${fId}`;
          const options: any = {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          };
          if (range) {
            options.headers['Range'] = range;
          }

          https.get(url, options, (response) => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
              followRedirect(response.headers.location, range, resolve, reject);
            } else {
              handleResponse(response, fId, range, resolve, reject);
            }
          }).on('error', reject);
        });
      };

      const followRedirect = (url: string, range: string | undefined, resolve: any, reject: any) => {
        const options: any = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        };
        if (range) {
          options.headers['Range'] = range;
        }
        https.get(url, options, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            followRedirect(response.headers.location, range, resolve, reject);
          } else {
            resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
          }
        }).on('error', reject);
      };

      const handleResponse = (response: any, fId: string, range: string | undefined, resolve: any, reject: any) => {
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          let body = '';
          response.on('data', (chunk: any) => { body += chunk; });
          response.on('end', () => {
            const match = body.match(/confirm=([A-Za-z0-9_-]+)/);
            if (match && match[1]) {
              const confirmCode = match[1];
              const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmCode}&id=${fId}`;
              followRedirect(confirmUrl, range, resolve, reject);
            } else {
              resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
            }
          });
        } else {
          resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
        }
      };

      const result = await getGoogleDriveStream(fileId, rangeHeader);

      // Copy key headers back to client
      const headersToCopy = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
      ];

      res.status(result.status);
      headersToCopy.forEach(header => {
        if (result.headers[header]) {
          res.setHeader(header, result.headers[header]);
        }
      });

      // Ensure appropriate content-type if missing
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'video/mp4');
      }

      result.stream.pipe(res);

    } catch (error: any) {
      console.error("[Video Proxy Error]", error);
      res.status(500).send("Video streaming failed: " + error.message);
    }
  });

  // Serve the uploaded BGM file from the project root directory
  app.get(["/BGM.mp3", "/bgm.mp3"], (req, res) => {
    const bgmPath = path.join(process.cwd(), "BGM.mp3");
    res.sendFile(bgmPath, (err) => {
      if (err) {
        console.warn("[BGM Error] Could not serve BGM.mp3 from root:", err.message);
        if (!res.headersSent) {
          res.status(404).send("BGM file not found");
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
