import type { Plugin } from 'vite';
import type { ServerResponse, IncomingMessage } from 'node:http';
import {
  handleChat,
  handleListDocuments,
  handleGetDocument,
  handleUploadDocument,
  handlePatchDocument,
  handleDeleteDocument,
  handleReindexDocument,
  handleHealth,
  handleGetTests,
  handleCors,
} from './lib/apiHandlers';

function sendJson(res: ServerResponse, body: unknown, status = 200) {
  const headers = handleCors();
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function apiPlugin(): Plugin {
  return {
    name: 'college-rag-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();

        if (req.method === 'OPTIONS') {
          const headers = handleCors();
          res.writeHead(204, headers);
          res.end();
          return;
        }

        const path = url.split('?')[0];

        try {
          // GET /api/health
          if (path === '/api/health' && req.method === 'GET') {
            const [body, status] = await handleHealth();
            return sendJson(res, body, status);
          }

          // POST /api/chat
          if (path === '/api/chat' && req.method === 'POST') {
            const raw = await parseBody(req);
            const payload = raw ? JSON.parse(raw) : {};
            const [body, status] = await handleChat(payload);
            return sendJson(res, body, status);
          }

          // GET /api/documents
          if (path === '/api/documents' && req.method === 'GET') {
            const [body, status] = await handleListDocuments();
            return sendJson(res, body, status);
          }

          // POST /api/documents/upload
          if (path === '/api/documents/upload' && req.method === 'POST') {
            const contentType = req.headers['content-type'] ?? '';
            if (contentType.includes('multipart/form-data')) {
              // Use busboy-style manual boundary parsing without extra deps
              const file = await parseMultipart(req, contentType);
              const [body, status] = await handleUploadDocument(file);
              return sendJson(res, body, status);
            }
            return sendJson(res, { error: 'Expected multipart/form-data' }, 422);
          }

          // Routes with /api/documents/:id
          const docMatch = path.match(/^\/api\/documents\/([^/]+)$/);
          if (docMatch) {
            const id = decodeURIComponent(docMatch[1]);
            if (req.method === 'GET') {
              const [body, status] = await handleGetDocument(id);
              return sendJson(res, body, status);
            }
            if (req.method === 'PATCH') {
              const raw = await parseBody(req);
              const payload = raw ? JSON.parse(raw) : {};
              const [body, status] = await handlePatchDocument(id, payload);
              return sendJson(res, body, status);
            }
            if (req.method === 'DELETE') {
              const [body, status] = await handleDeleteDocument(id);
              return sendJson(res, body, status);
            }
          }

          // POST /api/documents/:id/reindex
          const reindexMatch = path.match(/^\/api\/documents\/([^/]+)\/reindex$/);
          if (reindexMatch && req.method === 'POST') {
            const id = decodeURIComponent(reindexMatch[1]);
            const [body, status] = await handleReindexDocument(id);
            return sendJson(res, body, status);
          }

          // GET /api/tests
          if (path === '/api/tests' && req.method === 'GET') {
            const [body, status] = await handleGetTests();
            return sendJson(res, body, status);
          }

          return sendJson(res, { error: 'Not found', detail: `No endpoint for ${req.method} ${path}` }, 404);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal server error';
          return sendJson(res, { error: 'Internal server error', detail: message }, 500);
        }
      });
    },
  };
}

async function parseMultipart(
  req: IncomingMessage,
  contentType: string,
): Promise<File | undefined> {
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) return undefined;
  const boundary = boundaryMatch[1].trim();

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);
  const boundaryBuf = Buffer.from(`--${boundary}`);

  const parts: Buffer[] = [];
  let start = buffer.indexOf(boundaryBuf);
  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;
    parts.push(buffer.slice(start + boundaryBuf.length, next));
    start = next;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerStr = part.slice(0, headerEnd).toString('utf-8');
    const content = part.slice(headerEnd + 4, part.length - 2); // remove trailing \r\n
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    if (filenameMatch && nameMatch) {
      const filename = filenameMatch[1];
      const type = headerStr.match(/Content-Type:\s*([^\r\n]+)/)?.[1]?.trim() ?? 'application/octet-stream';
      return new File([content as BlobPart], filename, { type });
    }
  }
  return undefined;
}
