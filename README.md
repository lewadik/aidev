# File Sharing & SSH Terminal Web App

A modern Next.js (App Router) web app for uploading/downloading files and interacting with a local or remote shell via WebSockets.

- Framework: Next.js 15 + React 19 + TypeScript
- UI: Tailwind CSS + lightweight UI components
- Terminal: WebSocket server using node-pty (local) or ssh2 (remote)

---

## Contents
- Quick start (development)
- Configuration (environment variables)
- Build and run (production)
- Deploy on Linux (systemd)
- Deploy with Docker + Nginx
- Reverse proxy (Nginx example)
- Troubleshooting

---

## Quick start (development)

Requirements:
- Node.js 20+
- npm 9+

Steps:
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server on port 8000
   ```bash
   npm run dev
   ```
3. Open http://localhost:8000

Notes:
- The WebSocket terminal server is started by the app when you load the home page.
- On HTTPS, the client will use `wss://` automatically.

---

## Configuration (environment variables)

Copy the example file and set values:
```bash
cp .env.example .env
```

Key variables:
- `PORT` (default 3000): Next.js server port in production
- `WS_PORT` (default 3001): WebSocket server port for the terminal
- `SSH_REMOTE_MODE` (default `false`):
  - `false` → local shell via node-pty (bash/cmd)
  - `true`  → remote shell via ssh2 using `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PASSWORD`
- `NEXT_PUBLIC_WS_URL` (optional): full WebSocket URL the client should use (e.g. `wss://your-domain.com/ws`)
- `NEXT_PUBLIC_WS_PATH` (optional, default `/ws`): path to use when deriving WS URL from the page origin
- `STORAGE_MODE` (default `local`): future use for pluggable storage backends
- If you enable S3 in APIs, configure: `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

See [.env.example](./.env.example) for a complete list and inline notes.

---

## Build and run (production)

1. Install dependencies and build
   ```bash
   npm install
   npm run build
   ```
2. Start the app
   ```bash
   # PORT is read by Next.js (default 3000)
   PORT=3000 npm run start
   ```
3. Reverse proxy WebSocket traffic
   - The terminal server listens on `WS_PORT` (default 3001)
   - Proxy path `/ws` to the WS server (see Nginx config below)
4. Ensure `uploads/` is writable by the process user

Health checks:
- App: `curl -I http://localhost:3000`
- WS: ensure your reverse proxy upgrades at `/ws` and you can establish a WS connection

---

## Deploy on Linux (systemd)

Example: Ubuntu/Debian minimal steps.

1. Install Node.js 20 (choose one)
   - Using NodeSource (root):
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs build-essential
     ```
   - Or use `nvm` (user-level) if you prefer.

2. Create app directory and set up files
   ```bash
   sudo mkdir -p /opt/aidev
   sudo chown -R $USER:$USER /opt/aidev
   git clone <your-repo-url> /opt/aidev
   cd /opt/aidev
   cp .env.example .env
   ```

3. Install and build
   ```bash
   npm install
   npm run build
   ```

4. Install systemd service
   ```bash
   sudo cp deploy/next-app.service /etc/systemd/system/next-app.service
   # review/edit paths, domains and env in the service file if needed
   sudo systemctl daemon-reload
   sudo systemctl enable --now next-app
   ```

5. Reverse proxy (recommended)
   - Point `/` to `http://127.0.0.1:3000`
   - Point `/ws` to `http://127.0.0.1:3001` with proper Upgrade headers
   - See [deploy/nginx.conf](./deploy/nginx.conf)

Uploads directory permissions:
```bash
sudo mkdir -p /opt/aidev/uploads
sudo chown -R www-data:www-data /opt/aidev/uploads
```

---

## Deploy with Docker + Nginx

This repository includes a production-ready multi-stage Dockerfile and a compose setup with Nginx as a reverse proxy.

1. Build and run with compose
   ```bash
   cd deploy
   docker compose up -d --build
   ```

2. What it does
   - Builds the app in a `node:20-bullseye-slim` builder (supports `node-pty` native build)
   - Runs the app in a slim Node.js image
   - Exposes ports 3000 (app) and 3001 (WS) internally
   - Serves traffic via Nginx on port 80
   - Persists uploads via a bind mount: `../uploads:/app/uploads`

3. Customize
   - Edit [deploy/docker-compose.yml](./deploy/docker-compose.yml) to set environment values
   - Edit [deploy/nginx.conf](./deploy/nginx.conf) for your domain and TLS (use a companion like `nginx-proxy`/`letsencrypt`, or terminate TLS upstream)

---

## Reverse proxy (Nginx example)

Use the provided config as a reference: [deploy/nginx.conf](./deploy/nginx.conf).
Key points:
- Proxy `/` to the app (port 3000)
- Proxy `/ws` to the WS server (port 3001)
- Set `Upgrade` and `Connection` headers for WebSocket
- On HTTPS, the client will auto-use `wss://`

If you cannot proxy `/ws` path, set a full URL with `NEXT_PUBLIC_WS_URL` (e.g. `wss://ws.your-domain.com/`).

---

## Troubleshooting

- WebSocket fails to connect
  - Ensure your proxy forwards `/ws` with `Upgrade` and `Connection` headers
  - Check `WS_PORT` is open/reachable inside your deployment
  - Try setting `NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws` explicitly
- Permission errors writing to `uploads/`
  - Ensure the service user owns the directory
  - On systemd: see the `ExecStartPre` lines in [deploy/next-app.service](./deploy/next-app.service)
- Native module build issues (node-pty)
  - Ensure build tools are installed (`python3`, `build-essential`) in your build environment
  - The Dockerfile installs these in the builder stage
- Port conflicts
  - Change `PORT` or `WS_PORT` in your environment and update your reverse proxy accordingly

---

## Useful scripts

- Development: `npm run dev` (defaults to port 8000)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Start (prod): `npm run start` (reads `PORT`)

---

## File map (deployment assets)
- [.env.example](./.env.example)
- [Dockerfile](./Dockerfile)
- [deploy/docker-compose.yml](./deploy/docker-compose.yml)
- [deploy/nginx.conf](./deploy/nginx.conf)
- [deploy/next-app.service](./deploy/next-app.service)

---

## Security notes
- The terminal features are powerful; restrict access in front of the app (auth, IP filtering, VPN, etc.)
- Never commit real credentials. Use environment variables and secrets management.
- Consider rate limiting and logging on your reverse proxy.
