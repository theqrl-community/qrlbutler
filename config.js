const fs = require('fs');
const download = require('download');

// load config
var global_config = require('./env.json')['config'];
var environment_config = require('./env.json')[process.argv[2]];
const config = { ...global_config, ...environment_config};

module.exports = {
  ping: {
    module:'ping',
    channels: 'butler'
  },
  translate: {
    module:'l10n',
    omnipresence: true
  },
  nominate: {
    module: 'nominations',
    channel: 'butler'
  },
  otc: {
    module: 'otc',
    channel: 'otc'
  },
  cmc: {
    module: 'screenshot',
    channels: 'butler',
    preload: function() {
      var url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=1500&convert=USD&CMC_PRO_API_KEY='+config.cmcapi

      // If file doesn't exist, then get a new one.
      if(!fs.existsSync('data/cmc.json')) {
        console.log("Getting new data/cmc.json file");

        download(url).then((data) => {
          fs.writeFileSync('data/cmc.json', data);
        });
      }
    },
    config: {
      url: 'https://coinmarketcap.com/currencies/{tickerurl}/#tools',
      css: '.coinmarketcap-currency-widget',
      preprocess: function(message, subcommand) {
        var cmc_ticker = require('./data/cmc.json').data;
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
                console.log("Getting page: "+cmc_ticker[i]['slug'])

                ticker.push({
                  url:'https://coinmarketcap.com/currencies/'+cmc_ticker[i]['slug']+'/#tools',
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
            error_msg:"Sorry, I could not find a cryptocurrency project named "+subcommand
          }]
        } else {
          return ticker;
        }

      }
    }
  },
  cg:{
    module: 'screenshot',
    channels: 'butler',
    preload: function() {
    var url = 'https://api.coingecko.com/api/v3/coins/list';
      download(url).then((data) => {
        fs.writeFileSync('data/cg.json', data);
      });
    },
    config: {
      url: 'https://www.coingecko.com/en/coins/{tickerurl}/tools#panel',
      css: 'coingecko-coin-price-chart-widget',
      preprocess: function(message, subcommand) {


        var cg_ticker = require('./data/cg.json');
        var chk_symbol=subcommand.toLowerCase().split(' ');
        var chk_id=subcommand.toLowerCase().split(' ');
        var ticker=[];
        var max=5;
        var count=0;

        for (var b = 0; b < chk_id.length; b++) {

          // Check against ticker. Moonwalk
          for (var i = 0; i < cg_ticker.length; i++) {
              if(cg_ticker[i]['symbol']==chk_symbol[b] || cg_ticker[i]['id']==chk_id[b]) {
                count++; 
                if(count>max) {
                  break;
                }
                console.log("Getting page: "+cg_ticker[i]['id'])

                ticker.push({
                  url:'https://www.coingecko.com/en/coins/'+cg_ticker[i]['id']+'/tools#panel',
                  filename:'screenshot.cg.'+cg_ticker[i]['id']+'.png'
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
            error_msg:"Sorry, I could not find a cryptocurrency project named "+subcommand
          }]
        } else {
          return ticker;
        }

      }
    }
  }
}