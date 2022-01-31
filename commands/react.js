const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const { ExecutionContext } = require('puppeteer-core');

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
    verifyReaction: function(reaction, user) {
        // default pass
        var pass = true;

        // Check if person is a bot.
        if(reaction.message.author.bot === true) {
            console.log("[INFO] Reaction recipient is a bot");
            pass = false;
        }

        if(user.bot === true) {
            console.log("[INFO] Reaction facilitator is a bot");
            pass = false;
        }

        // Check if user is the same user
        if(reaction.message.author.id == user.id) {
            console.log("[INFO] Reaction facilitator is the same as the recipient");
            pass = false;
        }

        return pass;
    },
	run:async function(message, command, config) {
        command = message.content.toLowerCase().split(' ');

        switch(command[0]) {
			case '+getscores':
                if(!command[2]) {
                    command[2] = 30;
                } else {
                    command[2] = parseFloat(command[2]);
                }
                if(command[2]>180 || command[2]<1) {
                    command[2]= 30;
                }
                this.getScores(message, command[1], command[2]);
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
    runMessageReactionRemove:async function(reaction, user, config) {
        if(!this.verifyReaction(reaction, user)) {
            console.log("[INFO] Verify reaction not satisfied");
            return;
        }

        await this.adjustScore(reaction, user, false);
    },
    runMessageReactionAdd:async function(reaction, user, config) {
        if(!this.verifyReaction(reaction, user)) {
            console.log("[INFO] Verify reaction not satisfied");
            return;
        }
        await this.adjustScore(reaction, user, true);
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
    adjustScore: async function (reaction, user, delta) {
        let emoji = `${reaction.emoji}`;
        let messageid = reaction.message.id;
        let r_userid = reaction.message.author.id;
        let r_username = reaction.message.author.username;
        let f_userid = user.id;
        let f_username = user.username;
        let messagedate = Date.now();

        if(delta==true) {
            console.log("[INFO] Adding emoji");
            await this.db.run(`INSERT INTO score (emoji, messageid, r_userid, r_username, f_userid, reactdate) VALUES ("${emoji}","${messageid}","${r_userid}","${r_username}","${f_userid}","${messagedate}")`);
        } 
        if(delta==false) {
            console.log("[INFO] Removing emoji");
            await this.db.run(`DELETE FROM score WHERE messageid = "${messageid}" and f_userid="${f_userid}" and emoji="${emoji}"`)
        }


        // row = await this.db.get(`SELECT * FROM Score WHERE emoji = "${emoji}" and userId ="${user.id}"`);

    },
    getScores: async function(message, emoji, days) {  
        console.log("getting scores");
        try {
            // let data = await this.getScore(emoji);
            let history = Date.now() - (1000*60*60*days);
            let data = await this.db.all(`SELECT r_username,count(r_username) FROM score WHERE emoji = '${emoji}' AND reactdate>"${history}" GROUP BY r_username ORDER BY r_username DESC LIMIT 10`);
            console.log(data);
            let results = data.map(score => score['r_username'] + ": " + score['count(r_username)']).join("\n");
            let response = "Scores for " + emoji + " for the last "+days+" day(s):\n" + results;
            
            message.channel.send(response);
        } catch (err) {
            console.error(err);
        }
    }

}