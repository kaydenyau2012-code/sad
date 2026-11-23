// Street Soccer 3D online multiplayer server
// Run: npm install && npm start
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// Serve the actual game at the server's homepage. Socket.IO uses this same origin.
app.get('/', (_req, res) => res.sendFile(require('path').join(__dirname, 'index.html')));
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : '*' },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});
const rooms = new Map();
const bySocket = new Map();
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function makeCode() {
  let code;
  do { code = Array.from({length:4}, () => alphabet[Math.floor(Math.random()*alphabet.length)]).join(''); }
  while (rooms.has(code));
  return code;
}
function publicLobby(room) {
  return { code: room.code, hostId: room.hostId,
    players: [...room.players].map(([id, p]) => ({ id, name: p.name })) };
}
function update(room) {
  io.to(room.code).emit('lobby-updated', publicLobby(room));
}
function leave(socket, acknowledge) {
  const code = bySocket.get(socket.id);
  if (!code) { if (acknowledge) acknowledge({ok:true}); return; }
  const room = rooms.get(code);
  bySocket.delete(socket.id);
  socket.leave(code);
  if (!room) { if (acknowledge) acknowledge({ok:true}); return; }
  room.players.delete(socket.id);
  if (socket.id === room.hostId) {
    io.to(code).emit('lobby-closed', { reason: 'The lobby host left. The room has closed.' });
    for (const id of room.players.keys()) bySocket.delete(id);
    rooms.delete(code);
  } else {
    update(room);
  }
  if (acknowledge) acknowledge({ok:true});
}
io.on('connection', socket => {
  socket.on('create-lobby', (data, ack) => {
    if (bySocket.has(socket.id)) leave(socket);
    const code = makeCode();
    const room = { code, hostId: socket.id, players: new Map() };
    room.players.set(socket.id, { name: String(data && data.name || 'Player').slice(0,24) });
    rooms.set(code, room); bySocket.set(socket.id, code); socket.join(code);
    if (typeof ack === 'function') ack({ok:true, lobby:{code}});
    update(room);
  });
  socket.on('join-lobby', (data, ack) => {
    const code = String(data && data.code || '').toUpperCase().replace(/[^A-Z]/g,'');
    const room = rooms.get(code);
    if (!room) { if (typeof ack === 'function') ack({ok:false,error:'Lobby not found. Check the code.'}); return; }
    if (room.players.size >= 20) { if (typeof ack === 'function') ack({ok:false,error:'This lobby is full.'}); return; }
    if (bySocket.has(socket.id)) leave(socket);
    room.players.set(socket.id, { name: String(data && data.name || 'Player').slice(0,24) });
    bySocket.set(socket.id, code); socket.join(code);
    if (typeof ack === 'function') ack({ok:true,lobby:{code}});
    update(room);
  });
  socket.on('game-event', packet => {
    const code = bySocket.get(socket.id);
    if (!code || !rooms.has(code) || !packet || typeof packet.event !== 'string') return;
    // Relay gameplay and lobby messages to every other member of this room.
    socket.to(code).emit('game-event', {
      event: packet.event.slice(0,48),
      data: packet.data,
      peer: socket.id
    });
  });
  socket.on('leave-lobby', ack => leave(socket, ack));
  socket.on('disconnect', () => leave(socket));
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`Street Soccer multiplayer server listening on ${port}`));
