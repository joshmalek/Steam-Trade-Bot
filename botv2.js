const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const steamUserInfo = require('steam-userinfo');
const colors = require('colors');
const Prices= require('./prices.json');
const config = require('./config.json');

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
  steam: client,
  community: community,
  language: 'en'

});

var outcome = "";
var value = "";
client.logOn({
  accountName : config.username,
  password : config.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
})

//LOGGING ON AND VERIFICATION
client.on('loggedOn', function(details) {
  console.log("Successfully Logged On!")
  console.log("Tradebot logged into Steam as " + client.steamID.getSteam3RenderedID());
value = client.steamID.isValid();
  if(value = "true")
  {
    outcome = "VALID";
  }
  else{
    outcome = "INVALID";
  }
  console.log("Profile is " + outcome);
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed(308040);

})


//ADDING A FRIEND AND FIRST CHAT
client.on('friendRelationship', (steamid, relationship) => {
    if (relationship === 2) {

        var name = "";
        client.addFriend(steamid);
        client.chatMessage(steamid, 'Hello there! Thanks for adding me! Type !start to continue.');
        console.log(">New Event: Friend [" + steamid + "] added");

    }
});

//CHATTING WITH CUSTOMERS
client.on("friendMessage", function(steamID, message){
  var id = "";
  if(steamID == config.ownerID){
    id = "ADMIN";
  }
  else if(steamID == config.yangID){
    id = "YANG";
  }
  else{
    id = "CUSTOMER";
  }
  if(message == "!commands"){
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Available commands:\n !id \n !buy".reset);
    client.chatMessage(steamID, "Available commands:\n !id \n !buy");
  }
  else if(message == "!start"){
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Welcome to Keys2Cards 0.0.3.  Enter '!commands' to view available commands.".reset);
    client.chatMessage(steamID, "Hello, and welcome to Keys2Cards 0.0.3.  Enter '!commands' to view available commands.");
  }
  else if(message == "!id"){

    console.log("[" + steamID + "] says: " + message.bold);
    console.log("You are a ".reset + id);
    client.chatMessage(steamID, "You are a " + id);
  }


  else{
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Type '!start' to continue".reset);
    client.chatMessage(steamID, "Type '!start' to continue");
  }
});




client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);

    community.setCookies(cookies);
    community.startConfirmationChecker(10000, config.identitySecret);
});

function acceptOffer(offer) {
    offer.accept((err) => {
        community.checkConfirmations();
        console.log("We Accepted an offer");
        if (err) console.log("There was an error accepting the offer.");
    });
}

function declineOffer(offer) {
    offer.decline((err) => {
        console.log("We Declined an offer");
        if (err) console.log("There was an error declining the offer.");
    });
}

function processOffer(offer) {
    if (offer.isGlitched() || offer.state === 11) {
        console.log("Offer was glitched, declining.");
        declineOffer(offer);
    } else if (offer.partner.getSteamID64() == config.ownerID) {
        console.log("Offer is from admin")
        acceptOffer(offer);
    } else {
        var ourItems = offer.itemsToGive;
        var theirItems = offer.itemsToReceive;
        var ourValue = 0;
        var theirValue = 0;
        for (var i in ourItems) {
            var item = ourItems[i].market_name;
            if(Prices[item]) {
                ourValue += Prices[item].sell;
            } else {
                console.log("Invalid Value.");
                ourValue += 99999;
            }
        }
        for(var i in theirItems) {
            var item= theirItems[i].market_name;
            if(Prices[item]) {
                theirValue += Prices[item].buy;
            } else {
            console.log("Their value was different.")
            }
        }
    }
    console.log("Our value: " + ourValue);
    console.log("Their value: " + theirValue);

    if (ourValue <= theirValue) {
        acceptOffer(offer);
    } else {
        declineOffer(offer);
    }
}

client.setOption("promptSteamGuardCode", false);

manager.on('newOffer', (offer) => {
     processOffer(offer);
});
