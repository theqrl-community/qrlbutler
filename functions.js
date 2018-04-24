const download = require('./core/node_modules/download');
const fs = require('fs');

module.exports = {
  cmc: {
    module: 'screenshot',
    channel: 'butler',
    preload: function() {
		var url = 'http://api.coinmarketcap.com/v1/ticker/?limit=1200';
  		download(url).then((data) => {
        fs.writeFileSync('data/cmc.json', data);
      });
    },
    config: {
      url: 'https://coinmarketcap.com/currencies/{tickerurl}/#tools',
      css: '.col-md-4 .coinmarketcap-currency-widget',
      preprocess: function(message, subcommand) {
        var cmc_ticker = require('./data/cmc.json');
        var chk_symbol=subcommand.toUpperCase().split(' ');
        var chk_id=subcommand.toLowerCase().split(' ');
        var ticker=[];
        var max=5;
        var count=0;

        for (var b = 0; b < chk_id.length; b++) {

          // Check against ticker. Moonwalk
          for (var i = 0; i < cmc_ticker.length; i++) {
              if(cmc_ticker[i]['symbol']==chk_symbol[b] || cmc_ticker[i]['id']==chk_id[b]) {
                count++; 
                if(count>max) {
                  break;
                }
                console.log("Getting page: "+cmc_ticker[i]['id'])

                ticker.push({
                  url:'https://coinmarketcap.com/currencies/'+cmc_ticker[i]['id']+'/#tools',
                  filename:'screenshot.'+cmc_ticker[i]['id']+'.png'
                });
      
                break;
              }
          }
          if(count>max) {
            message.channel.send("There's only "+max+" screenshots allowed at a time, gathering the first "+max+" screenshots"); 
            break;
          }
          
        }

        // console.log(ticker);
        if(ticker.length===0) {
          return [{
            error:true,
            error_msg:"Couldn not find a currency named "+subcommand
          }]
        } else {
          return ticker;
        }

      }
    }
  }
}
