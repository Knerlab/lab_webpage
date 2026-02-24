# Copilot Instructions for lab_webpage

## Project Overview
This is a Flask-based laboratory webpage for Kner Lab at the University of Georgia. It's a static-content website with dynamic publication rendering from a Word document (.docx). The application serves HTML templates with embedded CSS/JS and deploys via Gunicorn + Caddy on Ubuntu servers.

## Architecture & Key Components

### Backend (Python/Flask)
- **Entry point**: [app.py](../app.py) - Flask app with 5 routes: `/`, `/home`, `/publications`, `/lab-members`, `/research`, `/teaching-lectures`
- **Custom logic**: 
  - `docx_to_html()` - Converts `Publications_website.docx` to HTML by parsing paragraphs and extracting years as section headers
  - `extract_year()` - Regex-based year extraction (looks for 4-digit numbers in parentheses, filters 1900-current year)
  - `extract_italic_words_from_docx()` - Extracts italicized text for generating a word cloud using `stylecloud`
  - Word cloud auto-generated on first run if not cached (stored as `staticFiles/files/style_cloud.png`)

### Frontend Structure
- **Templates**: [templateFiles/](../templateFiles) - Jinja2 templates (HTML + inline CSS/JS), each page is a separate file
- **Static assets**: [staticFiles/](../staticFiles) 
  - CSS: [style.css](../staticFiles/style.css)
  - JS: [jscript.js](../staticFiles/jscript.js)
  - Publication data: `files/Publications_website.docx` (single source of truth for publications)
  - Generated assets: `files/style_cloud.png` (auto-generated)
  - Member files/images in `member_files/` subdirectory

### Deployment & Configuration
- **WSGI**: [app.wsgi](../app.wsgi) - Gunicorn entry point (adds `/var/www/lab_webpage` to Python path)
- **Update script**: [runMe4Update.sh](../runMe4Update.sh) - Pulls git changes, kills old Gunicorn, starts new process
- **Web server**: [Caddyfile](../Caddyfile) - Reverse proxy config (Caddy) points to Gunicorn on port 8000
- **Local dev**: Run `python app.py` (debug mode on port 8000)

## Development Workflow

### Local Development
1. Modify templates in `templateFiles/` or static files in `staticFiles/`
2. For publication updates: Edit `staticFiles/files/Publications_website.docx` directly (DOCX format)
3. Test locally: `python app.py` → http://localhost:8000
4. Delete cached word cloud if changing publications: `rm staticFiles/files/style_cloud.png` to force regeneration

### Deployment (Ubuntu Server)
```bash
# From local machine
git add .
git commit -m "Update description"
git push

# On server (in lab_webpage folder)
git pull
bash runMe4Update.sh
```

## Important Patterns & Conventions

### Publications Workflow
- **Single source**: `staticFiles/files/Publications_website.docx` (Word document)
- **Parsing rules**:
  - Years detected from text like `(2024)` in paragraphs
  - Creates HTML sections per year (`<div class="years"><h2>2024</h2></div>`)
  - Publication text wrapped in `<div class="pubs"><p>...</p></div>`
  - Year suffix and empty brackets `[]` are stripped from display
- **Word cloud**: Auto-generates from italicized text in the DOCX file on first deployment

### HTML/CSS/JS Location
- **Inline CSS**: Style tags embedded in [index.html](../templateFiles/index.html) (no separate CSS imports for main page)
- **Global CSS**: [staticFiles/style.css](../staticFiles/style.css) for shared styling across pages
- **JavaScript**: [staticFiles/jscript.js](../staticFiles/jscript.js) (minimal interactivity)

### Dependencies & Versions
- Flask 2.2.5 (not latest, pinned for stability)
- Pillow < 10.0.0 (contains monkey patch for Pillow 10+ compatibility in `app.py` lines 15-22)
- python-docx 0.8.11 (DOCX parsing)
- gunicorn 21.2.0 (WSGI server)
- stylecloud 0.5.2 (word cloud generation)

## Common Tasks

### Adding a New Page
1. Create template in `templateFiles/newpage.html`
2. Add Flask route in `app.py`: `@app.route('/new-page')` 
3. Add navigation link in template `<nav>` sections

### Updating Publications
1. Edit `staticFiles/files/Publications_website.docx` (use Word/LibreOffice)
2. Format year as `(YYYY)` and italicize keywords for word cloud
3. Delete `staticFiles/files/style_cloud.png` (cached file)
4. Push changes and run `bash runMe4Update.sh`

### Debugging Deployment Issues
- Check Gunicorn logs after running `runMe4Update.sh`
- Ensure Python venv is sourced before running Gunicorn
- Verify Caddy is routing to localhost:8000 in Caddyfile
- If DOCX parsing fails, check file path in [app.py](../app.py) line 126

## Notes for AI Agents
- **File paths**: Always use relative paths from Flask root; `static_folder` and `template_folder` are explicitly set in Flask init
- **No database**: This is a static-content site; all data comes from DOCX file or hardcoded HTML
- **Monkey patch**: The Pillow compatibility fix is intentional—don't remove it without testing on Pillow 10+
- **Deployment flow**: Git is the deployment mechanism (no config files or env vars to manage)
