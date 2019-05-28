const jdb = require('node-json-db');
const db = new jdb("otc", true, true);
var orderid=0;
var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

module.exports = {
	cleanup:function(message) {
		var elapsed = 0;
		var days = 14;

		try {
			var wtb = db.getData("/wtb");
			var wtb_arr = [];

			wtb.forEach(function(arr) {

				message.guild.fetchMember(arr['userid']).then(function(m) {
					console.log("User "+arr["username"]+" and ID "+arr["userid"]+" exists. Keeping order #"+arr["orderid"]);
					// 	wtb_arr.push(arr);
				}).catch((reason) => {
					console.log("No user here with "+arr["username"]+" and ID "+arr["userid"]+". Removing order #"+arr["orderid"]);
				});

				// Time elapsed in seconds
				elapsed = (Date.now() - arr.datenow) / 1000;

				if(elapsed < (60 * 60 * 24 * days)) {
					console.log("Order number "+arr["orderid"]+" is still fine");
					wtb_arr.push(arr);
				}
			});
			db.push("/wtb", wtb_arr);
		} catch(e) {

		};

		try {
			var wts = db.getData("/wts");
			var wts_arr = [];

			wts.forEach(function(arr) {

				message.guild.fetchMember(arr['userid']).then(function(m) {
					console.log("User "+arr["username"]+" and ID "+arr["userid"]+" exists. Keeping order #"+arr["orderid"]);
					// 	wts_arr.push(arr);
				}).catch((reason) => {
					console.log("No user here with "+arr["username"]+" and ID "+arr["userid"]+". Removing order #"+arr["orderid"]);
				});

				elapsed = (Date.now() - arr.datenow) / 1000;

				if(elapsed < (60 * 60 * 24 * days)) {
					console.log("Order number "+arr["orderid"]+" is still fine");
					wts_arr.push(arr);
				}
	 
			});
			db.push("/wts", wts_arr);
		} catch(e) {

		};


		var currenttime = Date.now();

		try {
			var wts = db.getData("/wts");
			var wts_arr = [];
			var updatedb = false;

			wts.forEach(function(arr) {
				if(arr['datenow']) {
					// Get seconds
					// secondsPast = (now.getTime() - arr.getTime()) / 1000;
				} else {
					arr['datenow'] = Date.now();
										updatedb = true;

				}
				wts_arr.push(arr);
			});
			if(updatedb===true) {
				db.push("/wts",wts_arr);
			}

		} catch(e) {

		}

		try {
			var wtb = db.getData("/wtb");
			var wtb_arr = [];
			var updatedb = false;

			wtb.forEach(function(arr) {
				if(arr['datenow']) {

				} else {
					arr['datenow'] = Date.now();
					updatedb = true;
				}
				wtb_arr.push(arr);
			});
			if(updatedb===true) {
				db.push("/wtb",wtb_arr);				
			}

		} catch(e) {

		}
	},
	wts:function(message, command) {
		var btc = command[1];
		var qrl = command[2];

		// Check if there's characters...
		if(!btc || !qrl) {
			message.channel.send("otc wts [btc/qrl] [qrl]")
			return;
		}
	    if(!/^[0-9\.]+$/.test(btc) || !/^[0-9\.]+$/.test(qrl)) {
	        message.channel.send("That's not a number I understand");
	        return;
	    }
		btc = parseFloat(btc);
		qrl = parseFloat(qrl);

		if(btc>1 || btc <= 0.000000001) {
			message.channel.send("BTC price per QRL is either too high or too low. Range 0.00000001 - 1");
			return;
		}
		if(qrl<=1) {
			message.channel.send("Can't sell less than 1 QRL at a time");
			return;
		}
		var total = btc*qrl;

		// Check if WTB is lower than WTS
		try {
			var wtb = db.getData("/wtb");
			var wtb_sorted = wtb.sort(sort_by('btc',true, parseFloat));

			if(wtb_sorted[0]['btc'] > btc - 0.00000001) {
				message.channel.send("Congratulations, your WTS order is be higher than the *highest* WTB order. See who you can trade with.");
			//	return;
			}
		} catch(error) {

		};

		message.channel.send("Market WTS order at "+btc+" for "+qrl+" QRL for a total of ("+total+" BTC)");

		// Get orderid
		db.push('/orderid[]',{});
		orderid=db.getData("/orderid").length;

		db.push("/wts[]", {
			"orderid":orderid,
			"btc":btc,
			"qrl":qrl,
			"username":message.author.username,
			"userid":message.author.id,
			"datenow":Date.now()
		}, true);

		this.market(message);
	},
	wtb:function(message, command) {
		var btc = command[1];
		var qrl = command[2];

		if(!btc || !qrl) {
			message.channel.send("otc wtb [btc/qrl] [qrl]")
			return;
		}
	    if(!/^[0-9\.]+$/.test(btc) || !/^[0-9\.]+$/.test(qrl)) {
	        message.channel.send("That's not a number I understand");
	        return;
	    }

		btc = parseFloat(btc);
		qrl = parseFloat(qrl);

		// check if there's characters...
		if(btc>1 || btc <= 0.000000001) {
			message.channel.send("BTC price per QRL is either too high or too low. Range 0.00000001 - 1");
			return;
		}
		if(qrl<=1) {
			message.channel.send("Can't buy less than 1 QRL at a time");
			return;
		}
		var total = btc*qrl;

		// Check if WTB is lower than WTS
		try {
			var wts = db.getData("/wts");
			var wts_sorted = wts.sort(sort_by('btc',false, parseFloat));

			if(parseFloat(wtb_sorted[0]['btc']) > parseFloat(btc - 0.00000001)) {
				message.channel.send("Congratulations, your WTB order is lower than the *lowest* WTS order. See who you can trade with");
				//return;
			}
		} catch(error) {

		};


		message.channel.send("Market WTB order at "+btc+" for "+qrl+" QRL for a total of ("+total+" BTC)");
	
			// Get orderid
		db.push('/orderid[]',{});
		orderid=db.getData("/orderid").length;

		db.push("/wtb[]", {
			"orderid":orderid,
			"btc":btc,
			"qrl":qrl,
			"username":message.author.username,
			"userid":message.author.id,
			"datenow":Date.now()
		}, true);

		this.market(message);
	},
	clear:function(message, command) {
		
		try {
			var wtb = db.getData("/wtb");
			var wtb_arr = [];

			wtb.forEach(function(arr) {
				var orderid = parseInt(arr['orderid']);

				if(command[1]==orderid || command[1]==arr['btc']) {
					if(message.author.id==arr['userid'] || message.author.id == '356943957588049920') {
						return;
					} else {
						message.channel.send("Please sir, deleting another person's order isn't nice.");
					}
				}
	 
				wtb_arr.push(arr);
			});
			db.push("/wtb", wtb_arr);
		} catch(error) {

		}

		try {
			var wts = db.getData("/wts");
			var wts_arr = [];

			wts.forEach(function(arr) {
				var orderid = parseInt(arr['orderid']);

				if(command[1]==orderid || command[1]==arr['btc']) {
					if(message.author.id==arr['userid'] || message.author.id == '356943957588049920') {
						return;
					} else {
						message.channel.send("Please sir, deleting another person's order isn't nice.");
					}
				}
	 
				wts_arr.push(arr);
			});
			db.push("/wts", wts_arr);
		} catch(error) {

		}

		this.market(message,command);


	},
	clearall:function(message,command) {
		if(message.author.id == '356943957588049920') {
			db.delete("/");
			message.channel.send("Market deleted");
		} else {
			message.channel.send("Market not deleted");
		}

	},
	market:function(message, command) {
		var output = "";
		var output_in = "";
		var total = 0;
	
		try {
			var wts = db.getData("/wts");
			var wts_sorted = wts.sort(sort_by('btc',true, parseFloat));
			var output_arr = [];

			console.log(wts);

			if(wts.length>0) {

				output += "Market WTS (want to sell)```";		
				wts_sorted.forEach(function(arr) {
					qrl = parseFloat(arr['qrl']);
					btc = parseFloat(arr['btc']);
					order = String(arr['orderid']);
					total= btc * qrl;
					output_in += order.padStart(3," ")+" ";
					output_in += btc.toFixed(8)+' btc/qrl';
					output_in += String(arr.qrl).padStart(7," ")+" qrl ";
					output_in += String(total.toFixed(8)).padStart(12," ")+" BTC "+arr.username+" ";
					output_in += String(timeDifference(Date.now(),arr.datenow))+"\n";
				
					output_arr.push(output_in);
					output_in = '';
				});

				output += output_arr.slice(Math.max(output_arr.length - 9, 0)).join('');
				output += "```";
			}
		} catch(error) {

		}

		try {
			var wtb = db.getData("/wtb");
			var wtb_sorted = wtb.sort(sort_by('btc',true, parseFloat));
			var output_arr = [];

			if(wtb.length>0) {
				output += "Market WTB (want to buy)```";
				wtb_sorted.forEach(function(arr) {
					qrl = parseFloat(arr.qrl);
					btc = parseFloat(arr.btc);
					order = String(arr.orderid);
					total= btc * qrl;
					output_in += order.padStart(3," ")+" ";
					output_in += btc.toFixed(8)+' btc/qrl';
					output_in += String(arr.qrl).padStart(7," ")+" qrl ";
					output_in += String(total.toFixed(8)).padStart(12," ")+" BTC "+arr.username+" ";
					output_in += String(timeDifference(Date.now(),arr.datenow))+"\n";

					output_arr.push(output_in);
					output_in = '';
				});
				output += output_arr.slice(0,10).join('');
				output += "```";
				output += "* OTC orders are removed automatically after 14 days\n";
				output += "* Up to 10 orders are shown on either side.\n";
				output += "* If someone is non-responsive for 3 days for trading, flag jackalyst to remove the order.";

			}
		} catch(error) {

		}

		if(output=="") {
			output = "No markets available";
		}
		message.channel.send(output);
	},
	otc:async function(message, subcommand, config) {
		this.cleanup(message);
		var	command = subcommand.toLowerCase().split(' ');

		switch(command[0]) {
			case 'wts':
				this.wts(message, command);
			break;
			case 'wtb':
				this.wtb(message, command);
			break;
			case 'market':
				this.market(message, command);
			break;
			case 'clear':
				this.clear(message, command);
			break;
			case 'escrow':
				this.escrow(message, command);
			break;
			case 'clearall':
				this.clearall(message, command);
			break;
			default:
				message.channel.send("**Look at the market**\n`otc market`\n\n**Set a WTS (Want to Sell) order**\n`otc wts [btc/qrl] [qrl]`\n\n**Set a WTB (Want to Buy) order**\n`otc wtb [btc/qrl] [qrl]`\n\n**Remove an order**\n`otc clear [order number]`")

		}

	}
}