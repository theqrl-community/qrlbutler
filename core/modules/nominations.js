/**
 * Nominations
 * 
 * To ADD
 * nominate add [reddit/discord/medium] username [optional (reason)]
 * {
 	'yyyy-mm':{
			'medium':'reddit',
			'username':'qrledger'
 		}
 	}
 */
const jdb = require('node-json-db');
const sr = require('sync-request');
const moment = require('moment');
const db = new jdb("nominations", true, true);



var sort_by = function(field, reverse, primer){
   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}


module.exports = {
	getdate: function() {
		return moment().format('YYYYW');
	},
	add: async function(message, medium, username) {
		console.log("[nomations/add]: Adding user "+username.id);
		var authorid = message.author.id;
		var date = this.getdate();
		try {
			var uservotes = db.getData("/"+date+"[]/"+medium+'/'+username);

			if(uservotes.includes(authorid)) {
				message.channel.send("You already voted for this user");
			} else {
				throw new Error("Not voted for");
			}
		} catch(error) {
			db.push("/"+date+"[]", {
				[medium]: {
					[username]:[
						message.author.id
					]
				}
			}, false);
			message.channel.send("Vote successful");
			this.list(message);
		}
	},
	remove: async function(message,medium, username) {
		console.log("[nomations/remove]: Removing user "+username);
		var authorid = message.author.id;
		var date = this.getdate();
		var index = null;

		try {
			// Get array index...
			var uservotes = db.getData("/"+date+"[]/"+medium+'/'+username);

			if(!uservotes.includes(authorid)) {
				message.channel.send("There's no nominations registered for you for this user on this week.");
				return;
			} else {
				index = uservotes.indexOf(authorid);
			}


			// Get array index 
		} catch(error) {

		}


		if(index !== null) {

			try {
				var cmd = "/"+date+"[]/"+medium+'/'+username+'['+index+']';
				// Try to remove it...
				db.delete(cmd);
				var uservotes = db.getData("/"+date+"[]/"+medium+'/'+username);

				if(uservotes.length==0) {
					db.delete("/"+date+"[]/"+medium+'/'+username);	
				}

				message.channel.send("Congratulations, nominations for <@"+username.replace(/[^0-9]/g,'')+"> deleted");
				console.log("Index "+cmd);
				this.list(message);
			} catch(error) {
				message.channel.send("You never nominated this user so can't delete it.");
				console.log("[db:error]: "+error);
				this.list(message);
			}

		}

	},
	list:async function(message, week=null) {
			console.log("[nominations/list]");
			var date = (week!=null) ? moment().format("YYYY")+week : this.getdate();
			var shortlist = [];
			var output = '';

			try {
				var nominations = db.getData("/"+date+"[]");

				// Consolodate
				for(var mediums in nominations) {
					for(var usernames in nominations[mediums]) {
						shortlist.push({
							"medium":mediums,
							"votes":nominations[mediums][usernames].length,
							"username":usernames
						});
					}
				}
				var shortlist = shortlist.sort(sort_by('votes', true));

				if (shortlist.length == 0) {
					message.channel.send("Sorry, no nominations");
					return;
				}

				for (var i = 0; i < shortlist.length; i++) {
					username = shortlist[i]['username'];						
					

					switch(shortlist[i]['medium']) {
						case 'medium':
							url = "<https://www.medium.com/"+username+">";
						break;
						case 'reddit':
							url = "<https://www.reddit.com/user/"+username+">";
						break;
						case 'github':
							url = "<https://github.com/"+username+">";
						break;
						case 'discord':
							url = null;
							username = '<@'+username.replace(/[^0-9]/g,'')+'>';
						break;
					}
					if(url!=null) {
						output += (i+1)+". ["+shortlist[i]["votes"]+" votes] "+username+" at "+url+"\n";						
					} else {
						output += (i+1)+". ["+shortlist[i]["votes"]+" votes] "+username+"\n";
					}

				}
				message.channel.send(output);

			} catch(error) {
				message.channel.send("Can't find nominations for week: "+week);
			}		
	},
	nominations:async function(message, subcommand, config) {
		var supported_mediums = ['reddit', 'discord', 'medium', 'github'];
		var	command = subcommand.toLowerCase().split(' ');
		var date = this.getdate();

		var url = '';
		var shortlist = [];

		if(command[0] == "list") {
			this.list(message, command[1]);
			return;
		}
		if(command[0] == "remove" || command[0] == "rm") {
			if(!supported_mediums.includes(command[1])) {
				message.channel.send("Selected medium doesn't exist");
				return;
			}
			if(command[1] == 'discord') {
				command[2] = 'u'+command[2].replace(/[^0-9]/g,'');
			}

			this.remove(message, command[1], command[2]);
			return;
		}

		var medium = command[0];
		var username = command[1];

		switch(medium) {
			case 'medium':
				var url = 'https://medium.com/'+username;
				var res = sr('GET', url);

				if(res.statusCode == 404) {
					message.channel.send("No username/account by that name");
					return;					
				}
			break;
			case 'discord':
				var user = message.mentions.users.first();
				var member = message.guild.member(user);

				if(member) {
					username = await message.guild.fetchMember(member).then(function(m) {
						return m.id;
					}).catch((reason) => {
						console.log("User "+reason);
					});
					username = 'u'+username;
				} else {
					message.channel.send("No username/account by that name");
					return;
				}
			break;
			case 'reddit':
				var url = 'https://www.reddit.com/user/'+username;
				var res = sr('GET', url);

				if(res.statusCode == 404) {
					message.channel.send("No username by that name");
					return;					
				}
			break;

			case 'github':
				var url = 'https://github.com/'+username;
				var res = sr('GET', url);

				if(res.statusCode == 404) {
					message.channel.send("No username by that name");
					return;					
				}
			break;
			default:
				message.channel.send("Either no medium or no supported medium defined. Supported mediums are `reddit`, `discord`, `github` and `medium`.")
			return;
		}

		this.add(message, medium, username);
	}
}