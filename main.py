from flask import Flask, render_template
from docx import Document
import os
from pdb import set_trace as st
import re
from datetime import datetime

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
            content.append('<div class="years"><p>'+f'{cur_year}'+'</p></div>')

        if para.text != '':
            content.append('<div class="pubs"><p>'+para.text.replace(f' ({cur_year})','').replace(f'[]','')+'</p></div>')
    # st()
        
        # entries.append(para.text)
        
    return " ".join(content)




# WSGI Application
# Provide template folder name
# The default folder name should be "templates" else need to mention custom folder name
app = Flask(__name__, template_folder='templateFiles', static_folder='staticFiles')


@app.route('/home')
def index():
    return render_template('index.html')

@app.route('/publications')
def publications():
    file_path = os.path.join(app.static_folder, 'files/Publications_website.docx')
    content = docx_to_html(file_path)
    # st()
    return render_template('publications.html', content=content) 

 
if __name__=='__main__':
    app.run(debug = True, port=8001)