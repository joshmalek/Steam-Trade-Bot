const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const steamUserInfo = require('steam-userinfo');
const colors = require('colors');
const steamInventory = require('steam-inventories');
const Prices= require('./prices.json');
const config = require('./config.json');
const stats = require('./stats.json');
const apiai = require('apiai')("3e2212afc8a545269c0c22da9392f5c6");
var fs = require('fs');
var fileName = './stats.json';
var file = require(fileName);

//Initalize new instances of our enviroments
const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
  steam: client,
  community: community,
  language: 'en'

});

var outcome = "";
var value = "";
//Retrieve credentials and log in
client.logOn({
  accountName : config.username,
  password : config.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
})

//LOGGING ON AND VERIFICATION
client.on('loggedOn', function(details) {
  console.log("Successfully Logged On!")
  console.log("Tradebot logged into Steam as " + client.steamID.getSteam3RenderedID());
  console.log("Total completed trades:",stats.completeTrades)
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

  //ADMIN COMMANDS
  if((message == "!status") && (id = "ADMIN")){
    client.chatMessage(steamID,"I am online.")
    client.chatMessage(steamID,"You have "+ stats.completeTrades + " completed trades")
  }
  //seperate admin commands from normal commands
  else if((message == "!status") && (id != "ADMIN")){
    client.chatMessage(steamID, "You don't have access.")
  }
  //Normal commands
  if(message == "!start"){
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Welcome to Keys2Cards 0.0.3.  Enter '!commands' to view available commands.".reset);
    client.chatMessage(steamID, "Hello, and welcome to Keys2Cards 0.0.3.  Enter '!commands' to view available commands.");
  }
  else if(message == "!commands"){
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Available commands:\n !id \n !buy".reset);
    client.chatMessage(steamID, "Available commands:\n !id \n !buy");
  }
  else if(message == "!id"){
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("You are a ".reset + id);
    client.chatMessage(steamID, "You are a " + id);
  }
  //retrieve inventory worth and return items
  else if(message == "!inven"){
    console.log("Checking inventory...")
    steamInventory.get({
      appID: 730,
      steamID: steamID

    },function(err,items) {
      if(err){
        throw err;
      }
      console.log(JSON.stringify(items))
    });

  }
  //print commands as recieved to command line
  else{
    console.log("[" + steamID + "] says: " + message.bold);
    console.log("Type '!start' to continue".reset);
    client.chatMessage(steamID, "Type '!start' to continue");
  }
});



//set cookies for the session
client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);

    community.setCookies(cookies);
    community.startConfirmationChecker(10000, config.identitySecret);
});
//Helper function to accept offer
function acceptOffer(offer) {
    offer.accept((err) => {
        community.checkConfirmations();
        if (err) console.log("There was an error accepting the offer.");
        console.log("We Accepted an offer");
        file.completeTrades = file.completeTrades + 1;
        fs.writeFile(fileName, JSON.stringify(file,null,2), function (err) {
        if (err) return console.log(err);
        console.log("New total completed trades: ",stats.completeTrades)
    });
})
}
//Helper function to decline offer
function declineOffer(offer) {
    offer.decline((err) => {
        console.log("We Declined an offer");
        if (err) console.log("There was an error declining the offer.");
    });
}
//Helper function to process offer
function processOffer(offer) {
    //If offer is glitched, decline
    if (offer.isGlitched() || offer.state === 11) {
        console.log("Offer was glitched, declining.");
        declineOffer(offer);
    } 
    //if offer is from admin, accept
    else if (offer.partner.getSteamID64() == config.ownerID) {
        console.log("Offer is from admin")
        acceptOffer(offer);
    }
    //otherwise, calculate value of our items vs. theirs
    else {
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

    console.log("Our value: " + ourValue);
    console.log("Their value: " + theirValue);
    //if ours is worth less than theirs, accept
    if (ourValue <= theirValue) {
        acceptOffer(offer);
    } 
    else {
        declineOffer(offer);
    }
  }
}

client.setOption("promptSteamGuardCode", false);
//if a new offer is recieved, process as needed asynchrously 
manager.on('newOffer', (offer) => {
     processOffer(offer);
});
