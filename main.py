from flask import Flask, render_template
 
# WSGI Application
# Provide template folder name
# The default folder name should be "templates" else need to mention custom folder name
app = Flask(__name__, template_folder='templateFiles', static_folder='staticFiles')

 
@app.route('/')
def index():
    return render_template('index.html')
 
if __name__=='__main__':
    app.run(debug = True, port=8001)