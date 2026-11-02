# Linux Health Monitor

A lightweight system monitoring dashboard for Linux. It combines small Bash collectors with a Flask web application and a responsive browser interface. The dashboard displays current CPU, memory, disk, network, host, and process information from the Linux machine on which the Flask service is running. To monitor your own computer, run the service on that computer and open its local dashboard at `http://127.0.0.1:5000`.

This project is suitable for learning, local system checks, and classroom demonstrations. It is not a replacement for production monitoring platforms, alerting, or historical metrics storage.

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Publish a live demo](#publish-a-live-demo)
- [HTTP API](#http-api)
- [Troubleshooting](#troubleshooting)
- [Limitations and security](#limitations-and-security)

## What it does

The dashboard includes:

- **CPU utilization** — calculates recent overall CPU busy time from `/proc/stat`.
- **Memory usage** — reports total, used, available, and swap memory using `free`.
- **Disk utilization** — reads filesystem capacity from `df`, excluding temporary memory filesystems.
- **Network interfaces and traffic** — lists interfaces and cumulative bytes received and sent. Interface traffic is read from `/sys/class/net`.
- **System information** — shows hostname, operating system, kernel, architecture, uptime, and the host's current date.
- **Top processes** — lists the ten processes currently using the most CPU and reports the process count.
- **Automatic and manual refresh** — refreshes every ten seconds, with a button for an immediate update and an on-screen status when the service cannot be reached.
- **Responsive layout** — works on desktop and mobile screens.

Values are collected when the API is requested. This application does not store a history, generate alerts, or retain data between requests.

## How it works

The browser loads the HTML, CSS, and JavaScript served by Flask. The JavaScript requests `GET /api/monitor`; Flask runs the Bash scripts in `scripts/` on the same computer, gathers their output, and returns JSON. The browser parses the output and updates the dashboard. Each person who wants to monitor their own Linux computer must run this service locally on that computer.

The page and API use the same origin, so the browser does not need a separately configured API address or cross-origin access. The root URL `/` redirects to `/dashboard`.

## Project structure

```text
.
├── backend/
│   └── app.py                  # Flask routes and script runner
├── frontend/
│   ├── index.html              # Dashboard structure
│   ├── script.js               # API polling and rendering
│   └── style.css               # Responsive dashboard styling
├── scripts/
│   ├── cpu_monitor.sh
│   ├── disk_monitor.sh
│   ├── memory_monitor.sh
│   ├── network_monitor.sh
│   ├── process_monitor.sh
│   └── system_monitor.sh
├── render.yaml                 # Render Blueprint deployment settings
├── requirements.txt            # Python packages
└── .gitignore                  # Excludes local caches, environments, and logs
```

## Requirements

The application expects a Linux host with Python 3 and Bash. The collector scripts use common Linux utilities, including `awk`, `df`, `free`, `ps`, `uptime`, and Linux's `/proc` and `/sys` filesystems. The network script uses `ip` when available and falls back to interface state files under `/sys/class/net` when it is absent or restricted.

Python packages are listed in `requirements.txt`:

- Flask — serves the dashboard and the JSON API.
- Gunicorn — runs the Flask application in the Render deployment.

## Run locally

Run these steps on the Linux computer you want to monitor. Open a terminal in the project directory.

1. (Optional, recommended) Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install the Python packages:

   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. Start the application:

   ```bash
   python3 backend/app.py
   ```

4. Open <http://localhost:5000> in a browser. The dashboard begins fetching data automatically.

Stop the local server with **Ctrl+C** in the terminal. To use a different port, set `PORT` before starting the app, for example:

```bash
PORT=8000 python3 backend/app.py
```

## Publish a live demo

### Why GitHub Pages is not enough

GitHub Pages serves static files. It cannot run the Flask server or execute the Bash monitoring scripts. Uploading this repository to GitHub makes the source code available, but a live dashboard with data needs a Linux web service to run the backend.

This project includes a Render Blueprint in `render.yaml`. Render can connect to the GitHub repository, install the requirements, start the Flask application with Gunicorn, and provide a public URL. The resulting dashboard and API are served together from that URL.

### Deploy with Render

1. Create a GitHub repository named `linux-health-monitor`. For easiest setup, leave **Add a README**, **Add .gitignore**, and **Choose a license** unchecked; this project already contains its README and `.gitignore`.
2. In a terminal, change to the project folder, initialize Git if needed, and commit the project:

   ```bash
   cd /path/to/linux-health-monitor
   git init -b main
   git add .
   git commit -m "Prepare Linux Health Monitor for deployment"
   ```

   If Git says the branch or repository already exists, keep the existing setup and continue with the GitHub instructions instead of repeating initialization.

3. Add the GitHub repository as the remote and push the `main` branch. Replace `YOUR-USERNAME` with your GitHub username:

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/linux-health-monitor.git
   git push -u origin main
   ```

   GitHub may ask you to authenticate. Use GitHub's sign-in flow or a configured SSH remote; do not put a password or access token in the repository or in a command that may be saved in shell history.

4. Sign in to Render and connect your GitHub account if needed.
5. In the Render dashboard, choose **New → Blueprint** and select the `linux-health-monitor` repository.
6. Review the web service described in `render.yaml` and create it. Render installs packages from `requirements.txt`, runs Gunicorn, and uses `/api/monitor` for its health check.
7. Wait for the deployment to finish, then open the public `onrender.com` URL. The root page redirects to the dashboard.
8. Check that the status indicator says **System connected** and that metric cards have loaded. You can also append `/api/monitor` to the service URL to inspect the JSON response.

Render's Blueprint format supports Python web services, build/start commands, and a web-service health-check path; see the [Render Blueprint reference](https://render.com/docs/blueprint-spec). Free services can spin down after inactivity, so open the URL before presenting and allow time for it to start. [Render documents free service limitations here](https://render.com/docs/free).

For a classroom presentation, deploy and open the site a few minutes beforehand. Free services may pause after inactivity, so the first request after a pause can take longer while the service starts.

### Important: what the hosted metrics describe

The public dashboard reports the Linux environment running the Flask service. On Render, that is the Render service's host/container, not the computer used to open the page. A browser cannot read a visitor's processes, disk usage, or system files by itself. For each visitor to see their own computer's metrics, they must run this app locally and open its local URL. For a remotely hosted dashboard to inspect a visitor's computer, that computer would need a separate local monitoring agent and a secure connection to it; this project does not currently provide that agent.

## HTTP API

### `GET /api/monitor`

Runs the configured collectors and returns a JSON object. Each metric contains the collector's text output in an `output` field.

Example response shape:

```json
{
  "status": "success",
  "timestamp": "2026-11-02 12:30:00",
  "metrics": {
    "cpu": { "output": "..." },
    "memory": { "output": "..." },
    "disk": { "output": "..." },
    "network": { "output": "..." },
    "process": { "output": "..." },
    "system": { "output": "..." }
  }
}
```

Try the API directly at <http://localhost:5000/api/monitor> while running locally. A successful request returns HTTP `200` and `status: "success"`. Individual script output may contain an error message if that host does not provide a needed Linux utility or system file.

## Troubleshooting

### The browser shows “Backend disconnected”

- Confirm the server process is still running in the terminal or that the hosted service has finished starting.
- Check the service URL and try `/api/monitor` directly.
- For a local server, open the page using `http://localhost:5000`; opening `frontend/index.html` directly from the filesystem does not start Flask.

### The dashboard loads but a metric shows a dash

The corresponding collector may have returned output it could not parse, or a required Linux utility or system file may be unavailable. Check the API response for that metric and run its script in a terminal, for example `bash scripts/memory_monitor.sh`.

### Deployment fails on Render

- Confirm the repository includes `render.yaml`, `requirements.txt`, and the `backend/`, `frontend/`, and `scripts/` directories.
- Review the Render build and service logs for the first reported error.
- Confirm the service is deployed as a Blueprint/web service and that the configured start command is `gunicorn backend.app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 30`.

### First page load is slow

The service may be starting after a period of inactivity. Wait for the service URL to respond, then allow the first metrics request to finish. CPU collection samples `/proc/stat` across a one-second interval.

## Limitations and security

- Metrics are snapshots; there is no database, chart history, authentication, alerting, or user management.
- The API returns host and process details to anyone who can reach the public service. Do not deploy it on a sensitive or production host without adding access controls and reviewing which details should be exposed.
- The Bash collectors are designed for Linux. They are not expected to work unchanged on macOS or Windows.
- Container and hosting environments can restrict or virtualize system information. Results describe what the service's Linux environment can see and may differ from physical machine totals.
- The dashboard is intended for demos and basic monitoring, not as a hardened production monitoring service.
