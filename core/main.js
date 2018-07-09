const Discord = require('discord.js');
const moment = require('moment');
const client = new Discord.Client();

const fs = require('fs');
const download = require('download');

// Load /all/ the modules.
const modping = require('./modules/ping.js');
const modprice = require('./modules/price.js');
const modscreenshot = require('./modules/screenshot.js');



const modules = {
    echo:function(message, subcommand, config) { modping.echo(message, subcommand, config) },
    screenshot:function(message, subcommand, config) { modscreenshot.screenshot(message, subcommand, config); },
    pricing:function(message, subcommand, config) { modpricing.pricing(message, subcommand, config); },
};
 
// Check for environment declaration
if(!process.argv[2]) {
    console.log("Declare your environment!\nnode core/main.js [environment]");
    return;
}

var config = require('../env.json')[process.argv[2]];
const token = config['token'];

if(!token) {
    console.log("There doesn't seem to be a Discord token.");    
    return;
}

const functions = require('../functions.js');

var commands = [];
for(key in functions) {
    commands.push(key);
    if(functions[key].preload) {
        functions[key].preload();
    }
}
console.log("Commands are: "+commands);

// The action starts here!
client.on('ready', () => {
    console.log("Ready to serve");

    modprice.setprice(client,'btc-qrl');    

    setInterval(function() {
        modprice.setprice(client,'btc-qrl');    
    }, 60 * 1000);
});

client.on('message', message => {
    // Don't respond to other bots.
    if(message.author.bot) return;

    // Check if command is hit to avoid needless extra work.
    if(!new RegExp("^("+commands.join("|")+") ",'i').test(message.content)) {
        return;
    }

    // Split up command, and drop the rest
    const cmd = message.content.toLowerCase().split(' ')[0];

    // Change to subtext!
    const subcommand = message.content.substr(message.content.indexOf(" ") + 1) || undefined;

    // Don't filter cmd, just subcommand
    if(!/^[a-zA-Z0-9- ]+$/.test(subcommand)) {
        message.channel.send("Sorry, that's not a good subcommand");
        return;
    }

    message.channel.startTyping();
    var command = functions[cmd]['module'];

    // Check if it's the right channel
    if(functions[cmd]["channel"]) {
        if(functions[cmd]["channel"]!=message.channel.name) {
            // message.channel.send("Sorry, this function is only allowed in the "+functions[cmd]["channel"]+" channel");
            message.channel.stopTyping();
            return;
        }
    }
    modules[command](message, subcommand, functions[cmd]['config']);
    message.channel.stopTyping();

});

client.login(token);