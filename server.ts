import { createServer } from "node:http";

import next from "next";
import { Server as SocketIOServer } from "socket.io";

import { attachQuizGameSocketServer } from "./src/server/socketServer";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const appDirectory = process.cwd();

async function bootstrap() {
  const app = next({ dev, dir: appDirectory, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  attachQuizGameSocketServer(io);

  httpServer.listen(port, hostname, () => {
    console.log(`PulseQuiz Live ready at http://${hostname}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start PulseQuiz Live", error);
  process.exit(1);
});