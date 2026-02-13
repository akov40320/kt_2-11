import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.type("text/plain").send("KT6 server is running. WebSocket: /ws, SSE: /events");
});

/* ===== SSE ===== */
const clients = new Set();

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const client = { res };
  clients.add(client);

  // initial comment (keeps connection)
  res.write(`: connected\n\n`);

  req.on("close", () => {
    clients.delete(client);
  });
});

function sseSend(eventName, dataObj) {
  const data = JSON.stringify(dataObj);
  for (const c of clients) {
    c.res.write(`event: ${eventName}\n`);
    c.res.write(`data: ${data}\n\n`);
  }
}

// heartbeat + fake "new post"
let postId = 1000;
setInterval(() => {
  sseSend("heartbeat", { ts: new Date().toISOString() });
}, 5000);

setInterval(() => {
  postId += 1;
  sseSend("post", { ts: new Date().toISOString(), id: postId, title: "Post #" + postId });
}, 8000);

/* ===== Start HTTP server ===== */
const server = app.listen(PORT, () => {
  console.log(`KT6 server listening on http://localhost:${PORT}`);
});

/* ===== WebSocket ===== */
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on("connection", (socket) => {
  socket.on("message", (buf) => {
    let payload = null;
    try {
      payload = JSON.parse(buf.toString("utf-8"));
    } catch {
      payload = { name: "User", text: buf.toString("utf-8") };
    }

    broadcast({
      ts: new Date().toLocaleTimeString(),
      name: payload.name || "User",
      text: payload.text || ""
    });
  });

  socket.send(JSON.stringify({ ts: new Date().toLocaleTimeString(), name: "server", text: "connected" }));
});
