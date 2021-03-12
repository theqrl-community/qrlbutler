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

// Check for env.json file.
if(!fs.existsSync('./env.json')) {
    console.log("env.json is missing.");
    return;
}

// Load configuration
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
        var res = sr('GET','https://market-data.automated.theqrl.org/');
        var resjson = JSON.parse(res.getBody('utf8'));

        var qrlusd = resjson.price;

        client.user.setActivity("$"+qrlusd.toFixed(3));

    }, 10 * 1000);
});




client.on('message', message => {
    console.log("["+moment().format()+"] "+message.author.username+": "+message.content);

    // Don't respond to other bots.
    if(message.author.bot) return;

    // Get member
    var member=message.author;

    // Don't allow direct messages (potential for abuse)
    if(message.channel.type == 'dm') {
        message.channel.send("Sorry, no direct messages are allowed");
        return;
    }


    if (Date.now() - message.author.createdAt < 1000*60*60*24*30) {
      console.log('User joined in the last 30 days'+message.author.createdAt);
    }


    var command = '';
    
    // Check if there's a command, and if so, what is it?
    if(message.content.startsWith(config['prefix'])) {
        
        command = message.content.toLowerCase().split(' ')[0];
        command = command.slice(config['prefix'].length);
    }

    // If it's not a real command, run through omnipresent_modules and return
    if(command == '') {
        // Run through each module that gets executed for each message
        for (var i = 0; i < omnipresent_modules.length; i++) {
            console.log("Executing omnipresent module: "+omnipresent_modules[i]);

            omnipresent = client.commands.get(omnipresent_modules[i]);
            omnipresent.run(message, '', functions[omnipresent_modules[i]]['config']);
        }
        return;
    } else {
        console.log('Executing: '+command);
    }


    let cmd = client.commands.get(command);
    let args = message.content.toLowerCase().split(' ').slice(1);

    // Check if it's the right channel
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


client.on("guildMemberAdd", member => {
	// console.log("!!! GuildMemberAdd: "+member.user.username+' account creation date '+member.user.createdAt);

 //    // Don't know the role id?
 //    const role = member.guild.roles.find(role => role.name === 'probation');
 //    //member.addRole(role);
});

console.log("Logging in with "+process.argv[2]+" token: "+config['token'].slice(-10));

client.login(config['token']);
