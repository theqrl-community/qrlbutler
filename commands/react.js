const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');

async function DB () {
    return open({
        filename : './data/scores.sqlite',
        driver: sqlite3.Database
    })
}

module.exports = {
    load: async function() {
        this.db = await DB();
        await this.db.migrate({force : 'last'});
    },
	run:async function(message, command, config) {
        command = message.content.toLowerCase().split(' ');

        switch(command[0]) {
			case '+getscores':
                this.getScores(message, command[1]);
			break;
			case '+clearscores':
                if(message.member.hasPermission("BAN_MEMBERS")) {
				    this.clear();
                } else {
                    message.channel.send("You don't have enough permissions");
                }
            break;
		}
	},
    runMessageReactionRemove:async function(reaction, config) {
        let emoji = `${reaction.emoji}`;
        let author = reaction.message.author;
    
        await this.addToScore(emoji, author, -1);
    },
    runMessageReactionAdd:async function(reaction, config) {
        let emoji = `${reaction.emoji}`;
        let author = reaction.message.author;
        
        await this.addToScore(emoji, author, 1);
    },
    clear: async function () {
        await this.db.run(`DELETE FROM Score`);
    },
    getScore: async function (emoji) {
        row = await this.db.all(`SELECT * FROM Score WHERE emoji = "${emoji}" ORDER BY points DESC`);

        if (!row) {
            throw "ERROR: Missing row for " + emoji;
        } else {
            return row;
        }
    },
    addToScore: async function (emoji, user, delta) {
        
        row = await this.db.get(`SELECT * FROM Score WHERE emoji = "${emoji}" and userId ="${user.id}"`);

        if (!row) {
            await this.db.run(`INSERT INTO Score (emoji, userId, username, points) VALUES ("${emoji}", "${user.id}", "${user.username}", "1")`);

            console.log("Added " + user.username + " (" + user.id + ") to " + emoji + " scores");
        } else {
            // console.log("Number is "+(parseInt(addition) > 0));
            let newScore = parseInt(row.points) + delta;
            await this.db.run(`UPDATE Score SET points = ${newScore} WHERE emoji = "${emoji}" and userId ="${user.id}"`);
            
            console.log(user.username + " (" + user.id + ") just changed " + delta + " " + emoji + " to " + newScore);
        }
    },
    getScores: async function(message, emoji) {  
        try {
            let data = await this.getScore(emoji);
            let results = data.map(score => score.username + ": " + score.points).join("\n");
            let response = "Scores for " + emoji + " are as follows:\n" + results;
            
            message.channel.send(response);
        } catch (err) {
            console.error(err);
        }
    }

}