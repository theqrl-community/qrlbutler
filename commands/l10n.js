var projectId = 'qrlbutler-1555659563442';
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId});
const Discord = require('discord.js');

module.exports = {
	run:async function(message, command, config) {
		// Base language of server: Doesn't change.
		var base_language = 'en';

		// Channel language: Base language of channel, unless indicated.
		var channel_language = 'en';

		// Channel detection!
		var languages = {
			de:['deutsch','de','german'],
			ja:['japanese','ja','日本語','日本人'],
			ru:['russian','ru','русский'],
			es:['spanish','es','español'],
			eo:['esperanto','eo'],
			nl:['nederlands','nl'],
			it:['italian','it','italiano'],
			zh:['chinese','zh','中文'],
			ko:['korean','ko','한국어']
		};


		console.log(message.channel.name.toLowerCase());
		
		// Change base language of channel
		for(var prop in languages) {
			if(languages.hasOwnProperty(prop)){
				if(languages[prop].indexOf( message.channel.name.toLowerCase() ) !== -1) {
					channel_language = prop;
				}
			}
		}


		if(channel_language=='en') {
			// return;
		}

		console.log('i18n | base_language: '+base_language+', channel_language: '+channel_language);

		// Manual translation module.
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

		const text = message.content;

		// Detect if language is not english
		// .. translate to english
		let [detections] = await translate.detect(text);
		detections = Array.isArray(detections) ? detections : [detections];
		
		detections.forEach(detection => {
			detected_language = detection.language.substring(0,2);
			console.log(`i10n | detected language: ${detected_language}`);

			// Translate in place if detected_language != channel_language
			if(detected_language != channel_language) {
				this.translate(message, text, channel_language);
			}

			// If we're in a language channel, log engliash to language-log
			if(channel_language !== 'en') {
				// translate to english the language is that language
				if(detected_language === channel_language && detected_language != 'und') {
					this.translate(message, text, base_language, 'language-log');
				}		
			}

		});
	},

	translate:async function(message, content, target_language, target_channel) {
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

		  const embed = new Discord.MessageEmbed()
		  	.setTitle("Translation message author / channel")
			.addFields(
				{ name: 'Message', value: `${text}` },
				{ name: 'Translated (en)', value:`${translation}` },
			)
		  	.setColor(0x000033)
		  	.setDescription("<@"+message.member.user.id+"> / <#"+message.channel.id+"> ");

		  if(target_channel) {
			let channel = message.client.channels.cache.find(channel => channel.name === target_channel);

			if(channel) {
				channel.send(embed);
 //   			message.client.channels.get('841661924504633404').send(message.member.user.tag+" @ <#"+message.channel.id+"> "+` ${text} => (${target}) ${translation}`);
			}

		  } else {
		  	message.channel.send(translation)
		  }
		  // message.channel.send(`${translation}`);
		});
	},
	cleanup:async function(text) {
		return text;
	}
}
