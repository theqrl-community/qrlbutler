module.exports = {
	name: "roles",
	run: async function(message, arguments) {

	    if(!message.member.hasPermission("BAN_MEMBERS")) {
	      return message.channel.send(`**${message.author.username}**, You do not have enough permission to use this command`)
	    }
	    
	    if(!message.guild.me.hasPermission("BAN_MEMBERS")) {
	      return message.channel.send(`**${message.author.username}**, I do not have enough permission to use this command`)
	    }

		let target = message.mentions.members.first();
    
	    if(!target) {
	      return message.channel.send(`**${message.author.username}**, Please mention the person who you want to ban`)
	    }
	    if(target === message.guild.me) {
		 	return message.channel.send(`**${message.author.username}**, I refuse to ban myself`)	    	
	    }
		if(target.id === message.author.id) {
		 	return message.channel.send(`**${message.author.username}**, You can not ban yourself`)
		}	    

	    const role = message.guild.roles.cache.find(role => role.name === 'banned');
	    target.roles.add(role);
		
		message.channel.send({
			embed: {
  				color: 3447003,
  				title: "Action: Ban",
  				description: `Banned ${target} (${target.id})`,
  				footer: {
    		  		text: `Banned by ${message.author.username}`
    			}
			}
		});		

	}
}