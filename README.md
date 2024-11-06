![plot](staticFiles/assets/AIL_logo.png)
# lab_webpage
Homepage for KnerLab

The plateform is using Flask in python3.
Webpage dev using HTML+CSS+JS

## 1. Create new instance of ubuntu
## 2. Installing necessary softwares on the server (type in terminal)
### [1] Install Caddy
> sudo apt update

> sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https

> curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

> curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

> sudo apt update

> sudo apt install caddy

> sudo apt install python3-pip python3-dev build-essential libssl-dev libffi-dev python3-setuptools

### [2] Installing python environment
> sudo apt install python3-venv

> python3 -m venv labwebpage

> source labwebpage/bin/activate

> pip install -r requirements.txt

## 3. Update the content of webpage
### [1] Git clone from repo to server: https://github.com/Knerlab/lab_webpage.git

> git clone https://github.com/Knerlab/lab_webpage.git
> cd lab_webpage

### [2] Update your code locally and commit [!!!NOT ON THE SERVER!!!]

> git add .
> git commit -m 'Update'
> git push

### [3] Pull your changes to the server [In the lab_page folder]

> git pull

### [4] Run script to update webpage [In the lab_page folder]
> bash runMe4Update.sh
