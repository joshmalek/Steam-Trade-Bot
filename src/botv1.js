var fs = require('fs');
var Steam = require('steam');

// if we've saved a server list, use it
if (fs.existsSync('servers')) {
  Steam.servers = JSON.parse(fs.readFileSync('servers'));
}

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);

steamClient.connect();
steamClient.on('connected', function() {
  steamUser.logOn({
    account_name: '',
    password: ''
  });
});

steamClient.on('logOnResponse', function(logonResp) {
  if (logonResp.eresult == Steam.EResult.OK) {
    console.log('Logged in!');
    steamFriends.setPersonaState(Steam.EPersonaState.Online); // to display your bot's status as "Online"
    steamFriends.setPersonaName("ChatBot"); // to change its nickname
    steamFriends.joinChat('103582791455707754'); // the group's SteamID as a string
  }
});

steamClient.on('servers', function(servers) {
  fs.writeFile('servers', JSON.stringify(servers));
});

steamFriends.on('message', function(source, message, type, chatter) {
  // respond to both chat room and private messages
  console.log('Received message: ' + message);
  if (message == '!ping') {
    steamFriends.sendMessage(source, 'pong', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
  }
});

steamFriends.on('message', function(source, message, type, chatter) {
  console.log('Received message: ' + message);
  if (message == '!owner') {
    steamFriends.sendMessage(source, 'My owner is: http://steamcommunity.com/id/Enrichment/ Hes a great guy, really.', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
  }
});

steamFriends.on('message', function(source, message, type, chatter) {
 console.log('Received message: ' + message);
      if (message == '!bug') {
        steamFriends.sendMessage(source, 'Leave a comment on the profile if you have a bug.', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
      }
    });

    steamFriends.on('message', function(source, message, type, chatter) {
     console.log('Received message: ' + message);
          if (message == '!help') {
            steamFriends.sendMessage(source, 'Available commands: !bug - Report a bug.     ' + '!ping - To see if the bot is online.     ' + '!owner - To see the owner of the bot.', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
          }
        });
