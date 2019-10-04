# Steam-Trade-Bot
Bot built in for the Steam network to trade virtual currency autonomously and generate real-dollar profit.

Packages used:

    Steam
    SteamInventories
    SteamTOTP
    SteamUser
    SteamCommunity
    TradeOfferManager
    SteamUserInfo

Bot accepts commands and commands can be extended:

    !commands - display commands

    !id - returns user id (admin or customer)

    !inven - returns available inventory of the bot

    !status - upon id check for admin, return trades made and steam database status

Bot will automatically accept all trade requests made from admin account.  If amount offered 
by customer is greater than the amount to trade away, trade is accepted.  If donation is made
to bot account, trade is accepted.  Bot will deny all other trade requests.

For questions, pm me.

