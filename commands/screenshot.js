const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = {
	run:async function(message, subcommand, config) {
		console.log("Executing screenshot module");
		
		var filename = '';
		var url = '';
		var page ='';

		// Preprocess generates the final URL 
		if(config.preprocess) {
			var preparam = config.preprocess(message, subcommand);
		}
		console.log(preparam);
		
		// If parameter throws error. Return what it was.
		if(preparam[0].error===true) {
			message.channel.send(preparam[0].error_msg);
			message.channel.stopTyping();
			return;
		} 
		try {
			const browser = await puppeteer.launch({
		    		ignoreHTTPSErrors: false,
				args:['--no-sandbox','--disable-setuid-sandbox'],
			});
 			const page = await browser.newPage();

		for (var i =0; i < preparam.length; i++) {
			url = preparam[i].url;
			filename =  preparam[i].filename;

			try {
				const response = await page.goto(url,{
					waitUntil: 'networkidle2'
	    		});			

				if(!response.ok) {
					message.channel.send("Sorry, couldn't gather that screenshot");
					// await page.close();
					return;
				}

				await page.setViewport({
					width: 2000, height: 5000
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

			} catch(error) {
				console.log("ERROR:", error);
			}

			message.channel.send("<"+preparam[i].url+">", { 
				file:filename 
			}).then((err) => fs.unlink(filename, (error) => {} )).catch(console.error);

		}

		await browser.close();
	
                } catch (error) {
                        console.log("Puppeteer failed to launch"+error);
                }
	}
}
