module.exports = {
	run:async function(message, config) {
		var base_language = 'en';
		var second_language = null;

		// Channel detection!
		var languages = {
			de:['deutsch','de','german'],
			ja:['japanese','ja','日本語','日本人'],
			ru:['russian','ru','русский'],
			es:['spanish','es','español'],
			eo:['esperanto','eo'],
			nl:['nederlands','nl'],
			it:['italian','italiano','it']
		};

		// What channel are we in?

		// Change base language if channel
		for(var prop in languages) {
			if(languages.hasOwnProperty(prop)){
				if(languages[prop].indexOf( message.channel.name.toLowerCase() ) !== -1) {
					second_language = prop;
				}
			}
		}

		if(second_language==null) {
			return;
		}
		console.log('i18n | base_language to: '+base_language);
		console.log('i18n | second_language to: '+second_language);

	    const cmd = message.content.toLowerCase().split(' ')
    	const subcommand = message.content.split(' ').slice(2).join(' ');

		if (cmd[0] == 'tr') {
			if(cmd[1] == 'ru') {
				this.translate(message, subcommand, 'ru');
				return;
			}
			if(cmd[1] == 'de') {
				this.translate(message, subcommand, 'de');
				return;
			}
			if(cmd[1] == 'ja') {
				this.translate(message, subcommand, 'ja');
				return;
			}
		}

  		var projectId = 'qrlbutler-1555659563442';
		const {Translate} = require('@google-cloud/translate');

		const translate = new Translate({projectId});

		const text = message.content;

		// Detect if language is not english
		// .. translate to english
		let [detections] = await translate.detect(text);
		detections = Array.isArray(detections) ? detections : [detections];
		
		detections.forEach(detection => {
			console.log(`${detection.input} => ${detection.language}`);

			if(detection.language != base_language && detection.language != 'und' && !second_language) {
				this.translate(message, text, base_language);
			}
			// If you're in a language channel
			if(second_language !== null) {

				// translate if the language is not that language
				if(detection.language != second_language && detection.language != 'und') {
					this.translate(message, text, second_language);
				}
				// translate to english the language is that language
				if(detection.language == second_language && detection.language != 'und') {
					this.translate(message, text, base_language, 'language-log');
				}			
			}
		});
	},
	translate:async function(message, content, target_language, target_channel) {

  		var projectId = 'qrlbutler-1555659563442';
		// Imports the Google Cloud client library
		const {Translate} = require('@google-cloud/translate');

		// Instantiates a client
		const translate = new Translate({projectId});

		// The text to translate
		const text = content;

		const target = target_language;

		let [translations] = await translate.translate(text, target);
		translations = Array.isArray(translations) ? translations : [translations];
		
		
		translations.forEach((translation, i) => {
		  console.log(`i18n | ${text} => (${target}) ${translation}`);

		  // Note: This could all be done in one regex, but it's cleaner this way and the processing time is negligable.
		  // Convert <@ 356943957588049920> to <@356943957588049920> - (users)
		  translation = translation.replace(/(<@)\s([0-9!]+>)/g,"$1$2");

		  // Convert <@ ! 357603258807746560> to <@!357603258807746560> - (users 2?)
		  // convert <@ & 357603258807746560> to <@&357603258807746560> - (groups)
		  translation = translation.replace(/(<@)\s([&!])\s([0-9!]+>)/,"$1$2$3");

		  // Convert <＃570359176291811348> to <#570359176291811348> - (channels, note the ＃ vs #)
		  translation = translation.replace(/(<)[＃#\s]+([0-9!]+>)/g,function(match, p1, p2) {
		  	var testing = [p1,"#",p2].join('').replace(' ','');
		  	return testing;
		  });

		  if(target_channel) {
			console.log("Targeting channel");
			let channel = message.client.channels.find('name', target_channel);

			if(channel) {
    			message.client.channels.get('570415965393649674').send(message.member.user.tag+" @ <#"+message.channel.id+"> "+` ${text} => (${target}) ${translation}`);
			}

		  } else {
		  	message.channel.send(translation)
		  }
		  // message.channel.send(`${translation}`);
		});
	},
	cleanup:async function(text) {
		// Cleanup from google translate
		return text;
	}
}
