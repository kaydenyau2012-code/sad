# Street Soccer 3D — Online Multiplayer ZIP

This package serves the game at the root URL and runs the multiplayer server on that same address. Visiting the server URL should open Street Soccer 3D, not a plain status message. The health check remains available at `/health`.

This package contains:
- `index.html` — your updated game, with the Secret section moved to the very bottom of Settings and renamed **Backrooms**.
- `server.js` — the Socket.IO room server required by the game's existing online lobby system.
- `package.json` — server dependencies and start command.

## Important: making multiplayer work over the internet

The HTML game alone cannot host an online lobby. The server must be running at a public HTTPS address so friends can connect from their own computers.

### Deploy the server
1. Upload this ZIP's contents to a Node.js host (for example, Render, Railway, or another Node hosting provider).
2. Use `npm install` for the build/install step and `npm start` for the start command.
3. The host must provide a public HTTPS URL and support persistent WebSocket connections.
4. Deploy the whole folder together so `index.html` and `server.js` are on the same host. The game is configured to connect to the same origin automatically.
5. Open the public server URL; it should load the game. Create a lobby and share the four-letter code.

### Local testing
Install Node.js 18 or newer, open a terminal in this folder, then run:
```bash
npm install
npm start
```
Open `http://localhost:3000/health` to check that the server is running. To test two players on one computer, open the game in two browser windows and configure the game server URL to `http://localhost:3000`. For friends on other networks, use a publicly deployed server URL instead.

## Notes
- The multiplayer server relays the game's existing Socket.IO lobby/game packets; it does not change the match simulation or add a new matchmaking service.
- The server currently permits up to 20 connections per room. The game itself determines team slots and match behavior.
- For production, set `ALLOWED_ORIGIN` to a comma-separated list of your game website origins instead of leaving CORS open.
