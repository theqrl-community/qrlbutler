# Intro

QRL Butler is the bot that's running on the QRL discord.

Special thanks to:

- [Discord.js](https://github.com/hydrabolt/discord.js/)
- [moment.js](https://momentjs.com/)
- [puppeteer](https://github.com/GoogleChrome/puppeteer)
- [request](https://github.com/request/request)
- [request-promise](https://github.com/request/request-promise)

# Getting started

You'll need a token from discord, to do so, create a new bot [Here](https://discordapp.com/developers/applications/me). That's where you'll name the bot and give it an icon.

Outside of qrlbutler, place a `env.json` file, which includes your token

```
{
    "production": {
        "token": "[insert token here]",
    }
}
```

Then run 

```
nodejs main.js
```