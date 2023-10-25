![plot](staticFiles/assets/AIL_logo.png)
# lab_webpage
Homepage for KnerLab

The plateform is using Flask in python3.
Webpage dev using HTML+CSS+JS

## Requirements:

### Python requirements:
python3 -m pip install -r requirements.txt

### Apache2 requirements:
sudo apt install apache2

### Move the project folder into apache dev env
mv lab_webpage /var/www/

### Move configuration file into apache dev env
cp lab_webpage/lab_webpage.conf /etc/apache2/sites_available

### Installing WSGI module
sudo apt-get install libapache2-mod-wsgi-py3

### Enable WSGI module
sudo a2enmod wsgi


## USAGE

### LOCAL
Launching Flask server by:
   
python main.py

The port is now using 8001. For using another port, change in main.py


### Using Apache

### Testing first
sudo apachectl configtest  

Expect no error and end with "Syntax OK"

### Running
sudo a2ensite lab_webpage.conf

sudo service apache2 reload

sudo apachectl restart
