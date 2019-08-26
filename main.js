const fs = require('fs');
const sr = require('sync-request');

const Discord = require('discord.js');
const client = new Discord.Client({
    fetchAllMembers:true
});
client.commands = new Discord.Collection();

const moment = require('moment');
const download = require('download');

// Check for environment declaration
if(!process.argv[2]) {
    console.log("Declare your environment!\nnode main.js [environment]");
    return;
}

// Check for env.json
if(!fs.existsSync('./env.json')) {
    console.log("Check for env.json");
    return;
}

// load config
var global_config = require('./env.json')['config'];
var environment_config = require('./env.json')[process.argv[2]];
const config = { ...global_config, ...environment_config};


console.log("Declared environment variables!");


if(!config['token']) {
    console.log("There doesn't seem to be a Discord token. Go to https://discordapp.com/developers/applications/ to get it.");    
    return;
} else { console.log("Discord token loaded"); }

// This config should be in config.js eventually
if(!config['cmcapi']) {
    console.log("There doesn't seem to be a CMC API token. Go to https://coinmarketcap.com/api/ to get it.");    
    return;
} else { console.log("CMC API token loaded"); }

// Load functions
const functions = require('./config.js');
var omnipresent_modules = [];

for(key in functions) {
    var prop = require('./commands/'+functions[key].module+'.js');
    prop.config = functions[key];

    if(functions[key].omnipresence) {
        omnipresent_modules.push(key);
    }

    client.commands.set(key, prop)

    if(functions[key].preload) {
        functions[key].preload();
    }
}

console.log("Omnipresent modules: "+omnipresent_modules.join(', '));

client.on('ready', () => {
    console.log("Ready to serve");

    setInterval(function() {
        var res = sr('GET', "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=btc,qrl");
        var resjson = JSON.parse(res.getBody('utf8'));

        var btcusd = resjson[0].current_price;
        var qrlusd = resjson[1].current_price;

        var sat = qrlusd / btcusd * 100000;

        client.user.setActivity("$"+qrlusd.toFixed(2)+" | "+sat.toFixed(1)+"k Sat");
    }, 1 * 60 * 1000);
});

client.on('message', message => {
    console.log("["+moment().format()+"] "+message.author.username+": "+message.content);

    // Don't respond to other bots.
    if(message.author.bot) return;

    if(message.channel.type == 'dm') {
        message.channel.send("Sorry, no direct messages are allowed");
        return;
    }

    // Run through each module that gets executed for each message
    for (var i = 0; i < omnipresent_modules.length; i++) {
        console.log("Executing "+omnipresent_modules[i]);
        omnipresent = client.commands.get(omnipresent_modules[i]);
        
        omnipresent.run(message, functions[omnipresent_modules[i]]['config']);
    }

    if(!message.content.startsWith(config['prefix'])) return;

    let command = message.content.toLowerCase().split(' ')[0];
    command = command.slice(config['prefix'].length);
    let cmd = client.commands.get(command);

    let args = message.content.toLowerCase().split(' ').slice(1);

    // // Check if it's the right channel
    if(functions[command]["channels"]) {
        if(functions[command]["channels"] != message.channel.name) {
            message.reply("Command executed in wrong channel").then(msg => { msg.delete(5000) }).catch();
            return;
        }
    }

    if(cmd) {
        cmd.run(message, args.join(' '), functions[command]['config']);
    }
});


// client.on("messageUpdate", (message, newmessage) => {
//     console.log("[message] "+message.channel.name+" "+message.author.username+": "+newmessage.content);

//     newmessage.content = "[edited]"+newmessage.content;

//     // Don't respond to other bots.
//     if(message.author.bot) return;


//     // Send to omnipresent module
//     for (var i = 0; i < omnipresent_modules.length; i++) {
//         var mod = omnipresent_modules[i];
//         var command = functions[mod]['module'];
//         modules[command](newmessage, functions[mod]['config']);
//     }
// });

console.log("Logging in with "+process.argv[2]+" token: "+config['token'].slice(-10));
client.login(config['token']);
