![plot](staticFiles/assets/AIL_logo.png)
# lab_webpage
Homepage for KnerLab

The plateform is using Flask in python3.
Webpage dev using HTML+CSS+JS

## Requirements:

python3 -m pip install -r requirements.txt

install caddy:

sudo apt update \\

sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https \\

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \\

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list \\

sudo apt update \\ 

sudo apt install caddy \\

caddy start

gunicorn main:app &

<!-- 1. install flask:
   python -m pip install flask
2. install docx: 
   python -m pip install python-docx
3. install stylecloud:
   python -m pip install stylecloud -->


## USAGE

1. Launching Flask server by:
   python main.py

The port is now using 8001. For using another port, change in main.py
