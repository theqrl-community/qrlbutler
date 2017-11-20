# Intro

QRL Butler is the bot that's running on the QRL discord.

Special thanks to:

- [Discord.js](https://github.com/hydrabolt/discord.js/)
- [moment.js](https://momentjs.com/)
- [puppeteer](https://github.com/GoogleChrome/puppeteer)
- [request](https://github.com/request/request)
- [request-promise](https://github.com/request/request-promise)

# Getting started

## 1. Create an App

Make sure you're signed in, and create a new bot [Here](https://discordapp.com/developers/applications/me). 

1. Give it a name
2. Don't worry about "Redirect URI's"  
3. On your app page, select "Create Bot User"
4. Get your "ClientID" and put it in the url https://discordapp.com/oauth2/authorize?client_id=[ClientID]&scope=bot
5. Add the bot to your test server

## 2. Clone this repo

```
git clone https://github.com/jackalyst/qrlbutler.git
```

## 3. Setup your environment

Outside of qrlbutler, place a `env.json` file one directory up, which includes your token

```
{
    "production": {
        "token": "[insert token here]",
    }
}
```

Remember to use a development/test server

```
{
    "production": {
        "token": "[insert token here]",
    },
    "development": {
        "token": "[insert token here]",
    }
}
```

## 4. Install requirements

Get on the latest version of node (v8+), for development I suggest [Node Version Manage](https://github.com/creationix/nvm#install-script)

```
cd core/
npm install
``` 

### 5. Start your server

Be sure to include  your environment!

```
node main.js production
```


### Ubuntu 16.04 tl:dr

```
sudo apt -y update
sudo apt -y upgrade
sudo apt -y install build-essential gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget python-software-properties
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
git clone https://github.com/jackalyst/qrlbutler.git
cd qrlbutler/core
npm install
```


# Customise!

Make it your own. Right now all modules are built in the 'messages' event listener, so it reads the previous message and responds to it. This will be expanded for more flexibility.

You can look inside of functions.js for some examples