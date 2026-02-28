from flask import Flask, render_template
from flask import redirect, url_for, request, jsonify
from docx import Document
import docx
import os
import csv
from pdb import set_trace as st
import re
from datetime import datetime

######################################################################################################################################################
'''
functions for extracting content for publications
'''

def extract_year(s):
    # Extract all four-digit numbers from the string
    numbers = re.findall(r'\((\d{4})\)', s)
    
    # Filter out numbers that aren't in the typical range for years
    current_year = datetime.now().year
    years = [int(num) for num in numbers if 1900 <= int(num) <= current_year]
    
    # Return the last found year, as it's more likely to be the publication year
    return years[-1] if years else None


def docx_to_html(filepath):
    document = Document(filepath)
    content = []
    years_list = []

    for para in document.paragraphs:
        cur_year = extract_year(para.text)

        if cur_year not in years_list and cur_year != None:
            years_list.append(cur_year)
            # Use a specific class 'years' so we can target it in CSS easily
            content.append('<div class="years"><h2>'+f'{cur_year}'+'</h2></div>')

        if para.text != '':
            # The publication text
            content.append('<div class="pubs"><p>'+para.text.replace(f' ({cur_year})','').replace(f'[]','')+'</p></div>')
    # st()
        
        # entries.append(para.text)
        
    return " ".join(content)



######################################################################################################################################################
'''
Creating wordcloud using stylecloud
'''

# Function to extract italicized words from the DOCX file
def extract_italic_words_from_docx(filepath):
    document = Document(filepath)
    italic_words = []

    for para in document.paragraphs:
        for run in para.runs:
            if run.italic and run.text.strip():  # Checking if the run is in italic and not just whitespace
                italic_words.append(run.text)

    return ' '.join(italic_words)


def ensure_style_cloud_exists():
    output_path = os.path.join('staticFiles', 'files', 'style_cloud.png')
    if os.path.exists(output_path):
        return

    docx_filename = os.path.join('staticFiles', 'files', 'Publications_website.docx')
    if not os.path.exists(docx_filename):
        print(f"Warning: {docx_filename} not found. Skipping wordcloud generation.")
        return

    # Lazy import to reduce baseline memory on small servers.
    import stylecloud
    from PIL import ImageDraw

    # Pillow 10+ compatibility for stylecloud internals.
    if not hasattr(ImageDraw.ImageDraw, 'textsize'):
        def textsize(self, text, font=None, *args, **kwargs):
            if font is None:
                font = self.getfont()
            return font.getmask(text).size
        ImageDraw.ImageDraw.textsize = textsize

    text = extract_italic_words_from_docx(docx_filename).replace('using', '')
    stylecloud.gen_stylecloud(
        text=text,
        icon_name="fas fa-microscope",
        palette="colorbrewer.diverging.Spectral_11",
        background_color="rgba(0,0,0,0)",
        gradient="horizontal",
        max_words=100,
        output_name=output_path
    )



######################################################################################################################################################

'''
Flask server
'''
# WSGI Application
# Provide template folder name
# The default folder name should be "templates" else need to mention custom folder name
app = Flask(__name__, template_folder='templateFiles', static_folder='staticFiles')
JOURNALCLUB_DRAW_DIR = os.path.join(app.static_folder, 'journalclub_draw')
JOURNALCLUB_RECORDS_FILE = os.path.join(JOURNALCLUB_DRAW_DIR, 'journalclub_records.csv')
os.makedirs(JOURNALCLUB_DRAW_DIR, exist_ok=True)


@app.after_request
def set_response_headers(response):
    if request.path.startswith('/staticFiles/'):
        response.headers.setdefault('Cache-Control', 'public, max-age=2592000, immutable')
    elif request.path.startswith('/api/'):
        response.headers.setdefault('Cache-Control', 'no-store')
    return response


@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/publications')
def publications():
    file_path = os.path.join(app.static_folder, 'files/Publications_website.docx')
    if os.path.exists(file_path):
        content = docx_to_html(file_path)
    else:
        content = "<p>Publications file not found.</p>"

    try:
        ensure_style_cloud_exists()
    except Exception as exc:
        print(f"Warning: wordcloud generation skipped due to error: {exc}")

    # st()
    return render_template('publications.html', content=content) 

@app.route('/lab-members')
def labMembers():
    return render_template('labMembers.html') 

@app.route('/research')
def research():
    return render_template('research.html') 

@app.route('/teaching-lectures')
def teaching_lectures():
    return render_template('teaching_lectures.html') 

@app.route('/journalclub')
def journalclub():
    return render_template('journalclub.html')

@app.route('/api/journalclub/record', methods=['POST'])
def record_journalclub_result():
    payload = request.get_json(silent=True) or {}

    semester = str(payload.get('semester', '')).strip().lower()
    year = str(payload.get('year', '')).strip()
    order = payload.get('order', [])

    if semester not in {'spring', 'winter'}:
        return jsonify({'error': 'Invalid semester.'}), 400

    if not year.isdigit():
        return jsonify({'error': 'Invalid year.'}), 400

    if not isinstance(order, list) or not order:
        return jsonify({'error': 'Invalid order list.'}), 400

    cleaned_order = [str(name).strip() for name in order if str(name).strip()]
    if not cleaned_order:
        return jsonify({'error': 'Order list is empty.'}), 400

    saved_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    csv_exists = os.path.exists(JOURNALCLUB_RECORDS_FILE)

    with open(JOURNALCLUB_RECORDS_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not csv_exists:
            writer.writerow(['saved_at', 'semester', 'year', 'order_count', 'order'])
        writer.writerow([
            saved_at,
            semester,
            year,
            len(cleaned_order),
            ' | '.join(cleaned_order)
        ])

    return jsonify({
        'success': True,
        'saved_at': saved_at,
        'file': 'staticFiles/journalclub_draw/journalclub_records.csv'
    })

@app.route('/api/journalclub/records', methods=['GET'])
def get_journalclub_records():
    if not os.path.exists(JOURNALCLUB_RECORDS_FILE):
        return jsonify({'records': []})

    records = []
    with open(JOURNALCLUB_RECORDS_FILE, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_raw = (row.get('order') or '').strip()
            order_list = [name.strip() for name in order_raw.split('|') if name.strip()]
            records.append({
                'recordedAt': row.get('saved_at', ''),
                'semester': (row.get('semester') or '').strip(),
                'year': (row.get('year') or '').strip(),
                'order': order_list
            })

    return jsonify({'records': records})

if __name__=='__main__':
    app.run(debug = True, port=8000)
