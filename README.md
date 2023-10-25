![plot](staticFiles/assets/AIL_logo.png)
# lab_webpage
Homepage for KnerLab

The plateform is using Flask in python3.
Webpage dev using HTML+CSS+JS

## 1. Requirements:

### (1) Python requirements:
> python3 -m pip install -r requirements.txt

### (2) Apache2 requirements:
> sudo apt install apache2

### (3) Move the project folder into apache dev env
> mv lab_webpage /var/www/

### (4) Move configuration file into apache dev env
> cp lab_webpage/lab_webpage.conf /etc/apache2/sites_available

### (5) Installing WSGI module
> sudo apt-get install libapache2-mod-wsgi-py3

### (6) Enable WSGI module
> sudo a2enmod wsgi


## 2. USAGE

### (1) LOCAL
> Launching Flask server by:
   
> python main.py

> The port is now using 8001. For using another port, change in main.py


### (2) Using Apache

### [1] Testing first
> sudo apachectl configtest  

> Expect no error and end with "Syntax OK"

### [2] Running
> sudo a2ensite lab_webpage.conf

> sudo service apache2 reload

> sudo apachectl restart
