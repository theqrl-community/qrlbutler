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
npm install
``` 

### 5. Start your server

Be sure to include  your environment!

```
node main.js production
```