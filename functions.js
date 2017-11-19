const download = require('./core/node_modules/download');

module.exports = {
  echo: {
    module: 'echo',
    channel: 'general'
  },
  cmc: {
    module: 'screenshot',
    channel: 'bot',
    preload: function() {
		var url = 'http://api.coinmarketcap.com/v1/ticker/?limit=1000';
		download(url, 'data').then(() => {});
    },
    config: {
      url: 'https://coinmarketcap.com/currencies/{tickerurl}/#tools',
      css: '.col-md-4 .coinmarketcap-currency-widget',
      preprocess: function(subcommand) {
  		    var cmc_ticker = require('./data/ticker.json');
            var chk_symbol=subcommand.toUpperCase();
            var chk_id=subcommand.toLowerCase();

            // Check against ticker. Moonwalk
            for (var i = cmc_ticker.length - 1; i >= 0; i--) {
                if(cmc_ticker[i]['symbol']==chk_symbol || cmc_ticker[i]['id']==chk_id) {
                    console.log("Getting page: "+cmc_ticker[i]['id'])
                    return cmc_ticker[i]['id'];
                    
                }
            }
      }
    }
  },
  ref:{
    module:'echo',
    config:{
      reference:{
        "testnet":"\nGuide to started with testnet: <https://github.com/theQRL/QRL/> \nWeb-wallet: https://wallet.qrlexplorer.info/ \nQRL Explorer: http://qrlexplorer.info/ \nFaucet <http://qrl-faucet.folio.ninja/>",
        "team":"- @Founder (@peterwaterland#7473) \n- @Developer (@scottdonald, @Cyyber#7272, @bish, @leongb, @random_user_generator#1260 , @jp#7286, @Burke#3967, @coda, @aidan#9216, @purpletentacle#8044)\n- @Moderator (@jackalyst#2862, @Elliottdehn#3504, @Puck342#3354)",
        "faucet":"http://qrl-faucet.folio.ninja/"
      }
    }
  }
}