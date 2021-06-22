# Intro

QRL Butler is the bot that's running on the QRL discord.

Special thanks to:

- [Discord.js](https://github.com/hydrabolt/discord.js/)
- [moment.js](https://momentjs.com/)
- [puppeteer](https://github.com/GoogleChrome/puppeteer)
- [request](https://github.com/request/request)
- [request-promise](https://github.com/request/request-promise)

# Getting started

## Notes

QRL Butler is developed and tested on the latest node LTS version, which you can switch to by using `nvm use`.

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

Rename `env.example.json` to `env.json` and fill in the details

## 4. Install requirements

Get on the latest version of node (v8+) and any dependencies required for puppeteer.

### Ubuntu 20.04

```
sudo apt -y update
sudo apt -y upgrade
nvm use
```

### 5. Start your server

Be sure to include  your environment!

```
node main.js production
```

# Customise!

Make it your own. Right now all modules are built in the 'messages' event listener, so it reads the previous message and responds to it. This will be expanded for more flexibility.

You can look inside of functions.js for some examples