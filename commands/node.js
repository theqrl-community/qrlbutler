const sr = require('sync-request');

function extract_identifier(string) {
	let txs = undefined;
	let addresses = undefined;

	regexp_address = new RegExp("(Q[a-f0-9]{78})","gi");
	regexp_tx = new RegExp("([0-9a-f]{64,})","gi");


	// Check addresses first... and remove them.
	addresses = string.match(regexp_address);
	string = string.replace(regexp_address, '');

	txs = string.match(regexp_tx);

	return [ txs, addresses ];
}

function shor2quanta(shor) {
	return parseFloat(shor * 10 ** -9).toFixed(9);
}
function secToStr( seconds ) {
    var levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 86400), 'days'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
        [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
    ];
    var returntext = '';

    for (var i = 0, max = levels.length; i < max; i++) {
        if ( levels[i][0] === 0 ) continue;
        returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length-1): levels[i][1]);
    };
    return returntext.trim();
}

module.exports = {
	name: "node",
	
	address: function(message,address, config) {

		var address = address.trim();
		var addressurl = config[config.environment]['explorer']+'a/'+address;
		var resurl = config[config.environment]['explorer']+'api/a/'+address;				
		var res = sr('GET',resurl);
		var resjson = JSON.parse(res.getBody('utf8'));

		if(resjson.error != 500) {
			var balance = shor2quanta(resjson.state.balance);
		

			message.channel.send({embed: {
			    color: 3447003,
			    title: "Address "+address+" ["+config.environment+"]",
			    url: addressurl,
			    fields: [
			    	{
			    		name: "Balance",
			    		value: balance+" Quanta"
			    	}
			    ],
			    timestamp: new Date()
			  }
			});
		}
		
	},
	tx: function(message, tx, config) {

		// 
		var tx = tx.trim();
		var txurl = config[config.environment]['explorer']+'tx/'+tx;
		var resurl = config[config.environment]['explorer']+'api/tx/'+tx;				
		var res = sr('GET',resurl);
		var resjson = JSON.parse(res.getBody('utf8'));

		if(resjson.found) {
			var address_from = resjson.transaction.addr_from;
			var size = resjson.transaction.size;
			var fee  = resjson.transaction.tx.fee; 
			var masteraddr = resjson.transaction.explorer.from_hex;
			var total_transfer = resjson.transaction.explorer.totalTransferred;
		
			message.channel.send({embed: {
			    color: 3447003,
			    title: "TX "+tx+" ["+config.environment+"]",
			    url: txurl,
			    fields: [
			    	{
			    	    name: "From",
			    	    value: "["+masteraddr+"]("+config[config.environment]['explorer']+"/a/"+masteraddr+")"
			    	},
			    	{
			    		name: "Total transferred",
			    		value: total_transfer.toString()
			    	},
			    	{
			    		name: "Size",
			    		value: size+" bytes"
			    	},
			    	{
			    		name: "Transaction Fee",
			    		value: fee+" Quanta"
			    	}
			    ],
			    timestamp: new Date()
			  }
			});
		}
	},
	run: async function(message, subcommand, config) {
		
		var config = {
			'environment':'mainnet',
			'mainnet':{
				'explorer':'https://explorer.theqrl.org/',
				'hardfork':942375
			},
			'testnet':{
				'explorer':'https://testnet-explorer.theqrl.org/',
				'hardfork':10500
			}
		};
		

		// Check for --testnet flag :)
		if (message.content.includes('--testnet') || message.content.includes('testnet-')) {
			config.environment = "testnet";
			subcommand = subcommand.replace('--testnet','');
		}

		console.log(config.environment);



		

		var	command = subcommand.toLowerCase().split(' ');


		[txs, addresses] = extract_identifier(message.content);

		console.log("Transactions: "+txs);
		console.log("Addresses: "+addresses);

		if(txs != null) {
			if(txs.length > 2) {
				message.channel.send("Sorry, only two transaction lookups at a time");
				max = 2;
			} else {
				max = txs.length;
			}
			for (var i = 0; i < max; i++) {
				this.tx(message,txs[i], config);
			}
			command[0] = "passed";

		}


		if(addresses != null) {
			if(addresses.length > 2) {
				message.channel.send("Sorry, only two address lookups at a time");
				max = 2;
			} else {
				max = addresses.length;
			}
			for (var i = 0; i < max; i++) {
				this.address(message,addresses[i], config);
			}
			command[0] = "passed";
		}

		console.log('subcommand: '+subcommand);
		
		// Check if this is an omnipresent command and return
		if(subcommand=='') return;

		switch(command[0]) {
			case 'status':
				var explorer_url = config[config.environment]['explorer'];
				var resurl = explorer_url+'api/status/';				

		        var res = sr('GET',resurl);

		        var resjson = JSON.parse(res.getBody('utf8'));

		        var blockheight = resjson.node_info.block_height;
		        var lastreward  = resjson.block_last_reward * 10 ** -9; 
		        var coinsemitted = resjson.coins_emitted * 10 ** -9;
		        var block_time_mean = resjson.block_time_mean;
		        var difficulty = resjson.block_timeseries[resjson.block_timeseries.length-1].difficulty / 60;

		        var message_fields = [
				    	{
				    	    name: "Blockheight",
				    	    value: "["+blockheight+"]("+config[config.environment]['explorer']+"block/"+blockheight+")"
				    	},
				    	{
				    	    name: "Last reward",
				    	    value: parseFloat(lastreward).toFixed(9).toString()
				    	},
				    	{
				    	    name: "Total coins emitted",
				    	    value: parseFloat(coinsemitted).toFixed(9).toString()
				    	},
				    	{
				    		name: "Difficulty (est hashrate)",
				    		value: parseFloat(difficulty).toFixed(0).toString()
				    	}
				];

				// If 
				if(config[config.environment]['hardfork']!=false) {
					console.log("Environment has a hardfork");
					
					if(config[config.environment]['hardfork']>blockheight) {
						
						console.log("Environment has a hardfork less than "+blockheight);

						var blocksremaining = config[config.environment]['hardfork'] - blockheight;
						var totalesttime = blocksremaining * block_time_mean;

						message_fields.push({
							name:"Upcoming hardfork blockheight",
							value: config[config.environment]['hardfork']+" ("+blocksremaining+" blocks remaining)"
						});

						message_fields.push({
							name:"Hardfork estimated time",
							value: secToStr(totalesttime)
						});
					}
				}


				message.channel.send({embed: {
				    color: 3447003,
				    title: "QRL Blockchain Status ["+config.environment+"]",
				    url: explorer_url,
				    fields: message_fields,
				    timestamp: new Date()
				  }
				});

			break;

			case 'passed':
			
			break;
			default:
				message.channel.send("**Info**: Currently, you can do `.i status` to find the status of the network");

		}
	}
}