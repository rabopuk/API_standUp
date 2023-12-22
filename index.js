import http from "node:http";
import fs from "node:fs/promises";
import { sendError } from "./modules/send.js";
import { checkFileExist, createFileIfNotExist } from "./modules/checkFile.js";
import { handleAddClient } from "./modules/handleAddClient.js";
import { handleClientsRequest } from "./modules/handleClientsRequest.js";
import { handleComediansRequest } from "./modules/handleComediansRequest.js";
import { handleUpdateClient } from "./modules/handleUpdateClient.js";

const PORT = 8080;
const COMEDIANS = './comedians.json';
export const CLIENTS = './clients.json';

const startServer = async (port) => {
  if (!(await checkFileExist(COMEDIANS))) {
    return;
  }

  await createFileIfNotExist(CLIENTS)

  const comediansData = await fs.readFile(COMEDIANS, 'utf-8');
  const comedians = JSON.parse(comediansData);

  const server = http
    .createServer(async (req, res) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();

          return;
        }

        const segments = req.url.split('/').filter(Boolean);

        if (!segments.length) {
          sendError(res, 404, `Not found`);
          return;
        }

        const [resource, id] = segments;

        if (req.method === "GET" && resource === "comedians") {
          handleComediansRequest(req, res, comedians, id);
          return;
        }

        if (req.method === "POST" && resource === 'clients') {
          // POST /clients
          // Добавление клиента
          handleAddClient(req, res);
          return;
        }

        if (req.method === "GET" && resource === 'clients' && id) {
          // GET /clients/:ticket
          // Получение клиента по номеру билета
          handleClientsRequest(req, res, id);
          return;
        }

        if (req.method === "PATCH" && resource === 'clients' && id) {
          // PATCH /clients/:ticket
          // Редактирование/обновление клиента по номеру билета
          handleUpdateClient(req, res, id);
          return;
        }

        sendError(res, 404, 'Not found');
      } catch (error) {
        sendError(res, 500, `Ошибка сервера: ${error}`);
      }
    });

  server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Порт ${port} занят. Пробую запустить на порту: ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error(`Возникла ошибка: ${error}`);
    }
  });
};

startServer(PORT);
