const fs = require('fs');
const sr = require('sync-request');

// In memory database....


const Discord = require('discord.js');
const client = new Discord.Client({
    fetchAllMembers:false,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
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

var rate_limit = [];

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
var available_commands = [];
var prefix = [];

prefix.push(config.prefix);


for(key in functions) {
    console.log("Loaded and applied config for "+functions[key].module+":"+key);
    var prop = require('./commands/'+functions[key].module+'.js');
    prop.config = functions[key];

    if(functions[key].prefix) {
        prefix.push(functions[key].prefix);
    }
    if(functions[key].omnipresence) {
        omnipresent_modules.push(key);
    } else {
        // Assign function key to function
        available_commands.push(key);
    }
    client.commands.set(key, prop);


    if(functions[key].preload) {
        console.log("Preloading function for "+functions[key].module+":"+key);
        functions[key].preload();
    }
}

console.log("Prefix's to look for: "+prefix);
console.log("Omnipresent modules loaded: "+omnipresent_modules.join(', '));
console.log("Functions available: "+available_commands.join(', '));

for (var i = 0; i < omnipresent_modules.length; i++) {
    omnipresent = client.commands.get(omnipresent_modules[i]);
    
    if(typeof omnipresent.load !== 'undefined' && typeof omnipresent.load == 'function') {
        console.log("Loading omnipresent module: "+omnipresent_modules[i]);
        omnipresent.load();
    }
}


client.on('ready', () => {
    console.log("Ready to serve");

    setInterval(function() {
        var res = sr('GET','https://market-data.automated.theqrl.org/');
        var resjson = JSON.parse(res.getBody('utf8'));

        var qrlusd = resjson.price;

        client.user.setActivity("$"+qrlusd.toFixed(3));

    }, 10 * 1000);
});




var rl = [];

client.on('message', message => {

    let rl_timespan = 30 * 1000;   // Timespan: In seconds...
    let rl_joins = 10;

    // Push to array...
    rl.push(Date.now());
    console.log(rl);

    // Get number of new joins in the last 10 seconds...
    ratelimit_length = rl.filter(function(item) {
        return item > Date.now() - rl_timespan;
    }).length;

    console.log("[INFO] Current rate limit: "+ratelimit_length);


    console.log(message.author.username+": "+message.content);

    // Don't respond to other bots.
    if(message.author.bot) return;

    // Get member
    var member=message.author;

    // Don't allow direct messages
    if(message.channel.type == 'dm') {
        message.channel.send("Sorry, no direct messages are allowed");
        return;
    }

    var command = false;
    
    // Check if there's a command, then assign command
    if(message.content.startsWithArray(prefix)) {
        command = message.content.toLowerCase().split(' ')[0];
        command = command.slice(1);

        if (available_commands.indexOf(command) === -1) {
            command = false;
        }
    }

    // If there's no command, execute omnipresent_module's
    if(!command) {
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


    // If no prefix is assigned, ensure it's using the default
    if(!functions[command]["prefix"]) {
        if( !message.content.startsWith( config.prefix ) ) {
            return;
        }
    }

    let cmd = client.commands.get(command);
    let args = message.content.toLowerCase().split(' ').slice(1);

    // Check if it's the right channel, except for global functions!
    if(!functions[command]["channels"]==="_global_") { 
        if(functions[command]["channels"]) {
            if(functions[command]["channels"] != message.channel.name) {
                message.reply("Command executed in wrong channel").then(msg => { msg.delete(5000) }).catch();
                return;
            }
        }
    }

    if(cmd) {
        cmd.run(message, args.join(' '), functions[command]['config']);
    }
});


client.on("guildMemberAdd", member => {
	console.log("[INFO] GuildMemberAdd: "+member.user.username+' account creation date '+member.user.createdAt);

    let rl_timespan = 10;   // Timespan: In seconds...
    let rl_joins = 10;

    // Check if user joined date is less than 7 days...
    if (Date.now() - member.user.createdAt < 1000*60*60*24*7) {
        console.log('[WARNING] User joined in the last 7 days: '+member.user.createdAt);

        // Push to array...
        rate_limit.push(Date.now());
    
        console.log(rate_limit);
    }

    // Get number of new joins in the last 10 seconds...
    ratelimit_length = rate_limit.filter(function(item) {
        return item > Date.now() - rl_timespan;
    }).length;

    console.log("[INFO] Current rate limit: "+ratelimit_length);

    if(ratelimit_length > rl_joins) {
        console.log("[INFO][TEST] Banning "+member.user.username);
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
    // Run through each module that gets executed for each message
    for (var i = 0; i < omnipresent_modules.length; i++) {
        omnipresent = client.commands.get(omnipresent_modules[i]);
        
        if(typeof omnipresent.runMessageReactionAdd !== 'undefined' && typeof omnipresent.runMessageReactionAdd == 'function') {
            console.log("Executing omnipresent module: "+omnipresent_modules[i]);
            omnipresent.runMessageReactionAdd(reaction, user, functions[omnipresent_modules[i]]['config']);
        }
    }
});

client.on("messageReactionRemove", async (reaction, user) => {
    if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
    // Run through each module that gets executed for each message
    for (var i = 0; i < omnipresent_modules.length; i++) {
        omnipresent = client.commands.get(omnipresent_modules[i]);
        
        if(typeof omnipresent.runMessageReactionRemove !== 'undefined' && typeof omnipresent.runMessageReactionRemove == 'function') {
            console.log("Executing omnipresent module: "+omnipresent_modules[i]);
            omnipresent.runMessageReactionRemove(reaction, user, functions[omnipresent_modules[i]]['config']);
        }
    }
});

console.log("Logging in with "+process.argv[2]+" token: ..."+config['token'].slice(-10));

client.login(config['token']);
