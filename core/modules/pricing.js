const fs = require('fs');

module.exports = {
	pricing:async function(message, subcommand, config) {
		var filename = '';
		var url = '';

		// Preprocess
		if(config.preprocess) {
			var preparam = config.preprocess(message, subcommand);
		}
		
		// If parameter throws error. Return what it was.
		if(preparam[0].error===true) {
			message.channel.send(preparam[0].error_msg);
			message.channel.stopTyping();
			return;
		} 



	}

}