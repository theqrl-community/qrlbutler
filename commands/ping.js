/**
 * Demo command
 */

module.exports = {
	name: "ping",
	run: async function(message, arguments) {
		if (!Array.isArray(arguments) || !arguments.length) { } else {
			message.channel.send(arguments);
		}
	}
}