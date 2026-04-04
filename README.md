![AIL Logo](staticFiles/assets/AIL_logo.png)

# KnerLab Website

Official website for the Advanced Imaging Lab (AIL), led by Dr. Peter Kner at the University of Georgia.

Built with **Flask** (Python 3) + **HTML/CSS/JS**. Hosted on AWS Lightsail behind Cloudflare.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| DNS & CDN | Cloudflare | HTTPS termination, DDoS protection, IP geolocation headers |
| Domain | Namecheap (`knerlab.com`) | Domain registrar (nameservers pointed to Cloudflare) |
| Server | AWS Lightsail (Ubuntu) | VPS hosting |
| Reverse Proxy | Caddy | Routes traffic from port 80 to Gunicorn |
| App Server | Gunicorn | Runs the Flask app on `localhost:8000` |
| Framework | Flask (Python 3) | Web application |

### Request flow

```
User → Cloudflare (HTTPS) → Caddy (port 80) → Gunicorn (port 8000) → Flask
```

Cloudflare handles HTTPS and injects `CF-IPCountry` / `CF-IPCity` headers used by the analytics system.

---

## Project Structure

```
lab_webpage/
├── app.py                  # Flask app — routes, analytics, pub parsing
├── runMe4Update.sh         # Server update script (restart Gunicorn)
├── Caddyfile               # Caddy reverse proxy config
├── requirements.txt        # Python dependencies
├── drawing_updated.py      # Standalone pygame journal club draw tool
├── templateFiles/          # Jinja2 HTML templates
│   ├── index.html
│   ├── research.html
│   ├── publications.html
│   ├── labMembers.html
│   ├── journalclub.html
│   ├── teaching_lectures.html
│   ├── analytics.html
│   └── privacy.html
├── staticFiles/
│   ├── css/                # Per-page stylesheets + common.css
│   ├── js/                 # Per-page scripts + common.js
│   ├── assets/             # Logos, icons
│   ├── news/               # News section images
│   ├── member_files/       # Member profile photos
│   ├── files/              # Publications DOCX and wordcloud
│   └── journalclub_draw/   # Journal club draw records (CSV)
└── analytics_data/         # Visitor logs — gitignored, server-only
    ├── visits_YYYYMM.csv
    └── GeoLite2-City.mmdb  # GeoIP database — must be placed manually
```

---

## Initial Server Setup

### 1. Install system dependencies

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https \
    python3-pip python3-dev python3-venv build-essential libssl-dev libffi-dev
```

### 2. Install Caddy

```bash
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update && sudo apt install caddy
```

### 3. Clone the repository

```bash
git clone https://github.com/Knerlab/lab_webpage.git
cd lab_webpage
```

### 4. Set up Python virtual environment

The venv must be created **one level above** `lab_webpage/` so `runMe4Update.sh` can find it:

```bash
cd ~
python3 -m venv labwebpage
source labwebpage/bin/activate
pip install -r lab_webpage/requirements.txt
```

### 5. Configure Caddy

Copy `Caddyfile` to the Caddy config location and start it:

```bash
sudo cp lab_webpage/Caddyfile /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl start caddy
```

### 6. Place GeoIP database (for city-level analytics)

Register for a free account at [maxmind.com](https://www.maxmind.com), download `GeoLite2-City.mmdb`, and place it at:

```bash
~/lab_webpage/analytics_data/GeoLite2-City.mmdb
```

This file is gitignored and must be placed manually on the server.

### 7. Start the app

```bash
cd ~/lab_webpage
bash runMe4Update.sh
```

---

## Day-to-Day Development Workflow

All edits are made **locally**. Never edit files directly on the server.

```
1. Edit files locally
      ↓
2. Commit and push (from local machine)
      git add <files>
      git commit -m "Description"
      git push
      ↓
3. Pull and restart on the server
      git pull
      bash runMe4Update.sh
```

`runMe4Update.sh` activates the venv, kills any running Gunicorn process, and restarts it.

---

## Analytics

The site has a built-in privacy-friendly analytics dashboard at `/admin/analytics`.

- Visits are logged to monthly CSV files in `analytics_data/visits_YYYYMM.csv`
- IPs are masked and visitor fingerprints are anonymized (SHA-256)
- Country data comes from Cloudflare's `CF-IPCountry` header
- City data comes from the local GeoLite2-City database
- Bot and scanner traffic is automatically filtered out
- The `analytics_data/` directory is gitignored — it lives on the server only

To protect the dashboard with a token, set the environment variable:

```bash
export ANALYTICS_ADMIN_TOKEN=your_secret_token
```

Then access the dashboard at `/admin/analytics?token=your_secret_token`.

---

## Cloudflare Configuration

- DNS nameservers for `knerlab.com` are pointed to Cloudflare (configured in Namecheap)
- The A record for `knerlab.com` points to the Lightsail server IP with **Proxy status: Proxied** (orange cloud)
- Cloudflare handles HTTPS; Caddy only needs to handle HTTP on port 80
- `www.knerlab.com` is redirected to `knerlab.com` via the Caddyfile
