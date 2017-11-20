const puppeteer = require('puppeteer');
const fs = require('fs');

String.prototype.printf = String.prototype.printf || function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

module.exports = {
	screenshot:async function(message, subcommand, config) {
		if(config.preprocess) {
			var ticker=config.preprocess(subcommand);
		}
		if(!subcommand) {
			var filename = "screenshot.png";
		} else {
			var filename = "screenshot-"+ticker+".png";
		}


		try {
			const browser = await puppeteer.launch({
			    ignoreHTTPSErrors: true
			});
			const page = await browser.newPage();
			const response = await page.goto(config.url.printf({
				tickerurl:ticker
			}),{
				waitUntil: 'networkidle'
    		});			

			if(!response.ok) {
				message.channel.send("Sorry, couldn't gather that screenshot");
				await browser.close();
				return;
			}

			await page.setViewport({
				width: 1080,
				height: 2000
			});

			const rect = await page.evaluate(selector => {
				const element = document.querySelector(selector);
				const { x, y, width, height } = element.getBoundingClientRect();
				return { left: x, top: y, width, height, id: element.id };
			}, config.css);		


			await page.screenshot({
				path: filename,
				clip: {
				  x: rect.left,
				  y: rect.top,
				  width: rect.width,
				  height: rect.height
				}
			});

			await browser.close();
		} catch(error) {
			console.log("ERROR:", error);
		}

		message.channel.send("", { 
			file:filename 
		})
		.then((err) => fs.unlink(filename)
		)
		.catch(console.error);


	}
}