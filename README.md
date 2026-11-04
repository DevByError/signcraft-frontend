# SignCraft Web App

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js 20+](https://img.shields.io/badge/node-20%2B-green.svg)

The browser front end of SignCraft, a digital signage system. Users design screen content in a canvas editor, group designs into playlists, and deploy playlists to registered display screens.

This repository contains only the web app. It needs the SignCraft backend for login, storage and deployment, and the Android player app to show content on a display.

## Features

- Canvas editor with text, images, video, shapes, clocks, timers, tickers, slideshows, weather and embedded web content
- Timeline with per-element timing and entrance and exit animations
- Alignment tools, layers, undo and redo, and keyboard shortcuts
- Live preview of a single design or a whole playlist
- Playlists with ordering and per-item durations
- Screen management: register screens, see online and offline status, and deploy a playlist immediately or on a schedule
- Deployment progress reported live over Socket.IO
- Role-based UI for admin and designer accounts

## Architecture

```
Browser (this app)
   |  REST (axios, cookie auth)        Socket.IO (status, deploy progress)
   v                                   v
SignCraft backend (Express, MySQL, S3)
   |  records the playlist preview to MP4 with Puppeteer, uploads it to S3
   v
Android player app  <- downloads the scheduled videos and plays them
```

The backend opens `#/playlist/preview/:id?recording=true` in a headless browser to record playlists, so this app must be reachable from the backend at `FRONTEND_URL`.

## Requirements

- Node.js 20 or newer and npm
- A running SignCraft backend (default `http://localhost:5000`)

## Installation

```bash
git clone https://github.com/DevByError/ecoprse-fe.git
cd ecoprse-fe
npm install
cp .env.example .env
```

## Configuration

All settings are read from `.env` at build time.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the backend REST API and Socket.IO server, for example `http://localhost:5000` |
| `VITE_OPENWEATHER_API_KEY` | No | OpenWeatherMap API key. Only needed if you use the weather element. |

The development server also proxies `/design`, `/accounts` and `/general` to `VITE_API_URL`.

## Usage

```bash
npm run dev        # development server on http://localhost:3001
npm run build      # production build in dist/
npm run preview    # serve the production build locally
npm run typecheck  # run the TypeScript compiler without emitting files
```

Port 3001 matches the backend's default `FRONTEND_URL`. If you change it, update the backend as well.

The app uses hash routing (`/#/dashboard`), so `dist/` can be served by any static file server without rewrite rules.

## Project structure

```
components/   Shared UI: layout, element renderer, timeline, alignment toolbar, modals
contexts/     Authentication state and the global 401 handler
hooks/        Timeline state hook
pages/        Routed pages: home, editor, dashboard, playlists, screens, previews, auth
services/     API clients (designs, playlists, screens, auth), timeline and export logic
types/        Canvas, timeline and animation types
utils/        Axios instance and helpers
public/       Static images (favicon and logo)
```

## Troubleshooting

- **Requests fail with CORS errors.** The backend only accepts requests from `FRONTEND_URL`. Make sure it matches the address you open the app on, including the port.
- **You are sent back to the login page.** The auth cookie is set by the backend. Use the same host name for both apps (for example `localhost` for both, not `localhost` and `127.0.0.1`).
- **Weather element shows no data.** Set `VITE_OPENWEATHER_API_KEY` and restart the dev server.
- **Deploying a playlist never finishes.** The backend must be able to open this app in a headless browser. Check its `FRONTEND_URL` and its logs.

## Roadmap

- Split the editor page into smaller components
- Fix the remaining TypeScript errors so `npm run typecheck` passes
- Code-split the production bundle

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

Built with React, Vite, React Router, Socket.IO, SweetAlert2 and Lucide icons. Weather data from OpenWeatherMap.
