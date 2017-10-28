const Discord = require('discord.js');
const request = require('request');
const rp = require('request-promise');
const moment = require('moment');
const puppeteer = require('puppeteer');
const client = new Discord.Client();

if(!process.argv[2]) {
    console.log("Declare your environment!");
    return;
}

var config = require('../env.json')[process.argv[2]];
const ref = require("./reference.json");

// The token of your bot - https://discordapp.com/developers/applications/me
const token = config['token'];
const commands = ['ref','tn', 'tx', 'help', 'cmc', 'bittrex'];
const cmc_ticker = require('./cmc_ticker.json'); // Pull occassionally from https://api.coinmarketcap.com/v1/ticker/

async function cmc_screenshot(ticker_id, message) {
	var filename = "widget-"+ticker_id+".png";
	const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	const response = await page.goto('https://coinmarketcap.com/currencies/'+ticker_id+'/#tools');
	
	if(!response.ok) {
		await browser.close();
		return;
	}

	await page.setViewport({
		width: 1080,
		height: 2000
	});

	const rect = await page.evaluate(selector => {
		const element = document.querySelector(selector);
		const { x, y, width, height } = element.getBoundingClientRect();
		return { left: x, top: y, width, height, id: element.id };
	}, '.col-md-4 .coinmarketcap-currency-widget');		


	await page.screenshot({
		path: filename,
		clip: {
		  x: rect.left,
		  y: rect.top,
		  width: rect.width,
		  height: rect.height
		}
	});

	message.channel.send("", { file:filename })
    console.log("Screenshot taken: "+filename);

	await browser.close();
}

async function bittrex_chart(market, message) {
    var filename = "bittrex-"+market+".png";
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    const response = await page.goto('https://bittrex.com/Market/Index?MarketName='+market);
    
    if(!response.ok) {
        await browser.close();
        return;
    }

    await page.setViewport({
        width: 1080,
        height: 2000
    });

    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);
        const { x, y, width, height } = element.getBoundingClientRect();
        return { left: x, top: y, width, height, id: element.id };
    }, '#rowChart');     


    await page.screenshot({
        path: filename,
        clip: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }
    });

    message.channel.send("", { file:filename })
    console.log("Screenshot taken: "+filename);

    await browser.close();
}



client.on('ready', () => {
    
        setInterval(function() {
                 const apibtcqrl = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-qrl';
                const apiusdtbtc = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=usdt-btc';
                
                var btcqrl;
                rp({uri:apibtcqrl,json:true})
                        .then(function(body) {
                                // console.log(body.result[0].Last);
                                btcqrl=body.result[0].Last;
                        })
                        .then(function() { return rp({uri:apiusdtbtc,json:true}); })
                        .then(function(body) {
                                var value=+(body.result[0].Last * btcqrl).toFixed(2);
                                var sat=btcqrl*100000;
                                client.user.setGame("$"+value.toFixed(2)+" | "+sat.toFixed(1)+"k Sat");
                        });
        }, 3 * 60 * 1000);
});

client.on('message', message => {
        // Ignore cyyber
        if(message.author.bot) return;

        // Reference before bros!
        var message_content='';

        if(ref[message.content]!=undefined) {
                message.channel.send(ref[message.content])
                return;
        }

        if(message.content=="ref") {
            for(var key in ref) { message_content+= key+"\n"; }
            message.channel.send(message_content);
        }

        // Check if command is hit :)
        if(!new RegExp("^("+commands.join("|")+")",'i').test(message.content)) {
            return;
        }

        // Split up command, and drop the rest
        const cmd = message.content.toLowerCase().split(' ')[0]
        const subcommand = message.content.split(' ')[1];

        // If there's no subcommand, it's a call for help.
        if (subcommand==undefined) {
            const subcommand="help";
        }

        // Don't filter cmd, just subcommand
        if(!/^[a-zA-Z0-9-]+$/.test(subcommand)) {
            message.channel.send("Sorry, that's just not kosher for a subcommand number one!");
            return;
        }

        if(cmd=="help") {
            message.channel.send(commands.join("\n"));
            return;
        }

        return;

        if(cmd=="bittrex") {
            bittrex_chart(subcommand, message);
            return;
        }

        if(cmd=="cmc") {
            var chk_symbol=subcommand.toUpperCase();
            var chk_id=subcommand.toLowerCase();

            // Check against ticker. Moonwalk
            for (var i = cmc_ticker.length - 1; i >= 0; i--) {
                if(cmc_ticker[i]['symbol']==chk_symbol || cmc_ticker[i]['id']==chk_id) {
                    console.log("Getting page: "+cmc_ticker[i]['id'])
                    cmc_screenshot(cmc_ticker[i]['id'], message);
                    return;
                }
            }
            message.channel.send("Hmm, I couldn't seem to find it on coinmarketcap.");
        }

        if(cmd=="tn") {
            if(subcommand=="stats") {
                rp({uri:'http://localhost:8080/api/stats',json:true})
                    .then(function(body) {
                            var statcontent;
                            for (var key in body) {
                                    statcontent+=key+": "+body[key]+"\n";
                            }
                            // console.log(body.result[0].Last);
                            message.channel.send(statcontent);
                    });
            }

        }

        if(cmd=="tx") {
            if(subcommand.length==64) {
                rp({uri:'http://localhost:8080/api/txhash/'+subcommand,json:true})
                    .then(function(parsed) {
                        message.channel.send(
                            "From: "+parsed.txfrom+
                            "\nTo: "+parsed.txto+
                            "\nTransfer Amount: "+parsed.amount+
                            "\nTime: "+moment(parsed.timestamp*1000).format('MMMM Do YYYY, h:mm:ss a')+
                            "\nBlock: "+parsed.block+
                            "\n<http://qrlexplorer.info/tx/"+subcommand+">");
                    });
            } else {
                message.channel.send("I'm sorry, that doesn't seem to be a valid tx")
            }            
        }

});

client.login(token);
