const { assert } = require('console');
const express = require('express');
const router = express.Router();
const config = require('../../config/config');
const { findOne } = require('../../models/user.model');
var MongoClient = require('mongodb').MongoClient;

//Game logic route
router.post('/getGame', (req, response) => {
    var gameState = req.body.gameState;
    var userInfo = req.body.userInfo;
    var game = {
        gameInfo: {
            "contestChosen": gameState.contestChosen,
            "gameType": gameState.gameType,
            "gameID" : gameState.game.gameID
        },
        user1: {...userInfo}
    }
    //check if game exists in the store with same state 
    //If (exists) {
    //  Redirect secondPlayer to new page, mark player as second, joining later than first player, emit event to 
    //  signal firstPlayer to select match for toss selection
    //  register event listener in secondPlayer's frontend to listen for event emitted by server, 
    //  triggered by firstPlayer's toss selection. 
    //  That selects the teams for both players, and allows them to move to player selection
    //}

    //Check if there is a existing game state in the db
    //If there isnt, create one
    //{
        // ...gameState with only id, user
   // }

    MongoClient.connect(config.mongoose.url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
        var db = client.db('games');
        db.collection("pendingGames").find({"gameInfo": game.gameInfo}).toArray((err, res) => {
            if(res.length == 0) {
                console.log("No game exists with following parameters, Player is first in the room, waiting...")
                console.log(game.gameInfo);
                db.collection("pendingGames").insertOne(game)
                response.send({status: "Waiting", description: "Player is first in the room, waiting for second player to initiate game"})
            } else if(res[0].user1.memID != userInfo.memID) {
                console.log("Player added to previously pending game, Pending game deleted")
                var newGame = {...res[0], user2: {...userInfo}}
                db.collection("matchedGames").insertOne(newGame);
                console.log("Added new match to matchedGames");
                db.collection("pendingGames").deleteOne({"_id": res[0]._id});
                response.send({status: "Paired", description: "User is paired with another user, this user is second to come, so waits for user1 to select a team for toss selection", user1:res[0].user1})
            } else if(res[0].user1.memID == userInfo.memID) {
                response.send({status: "Waiting", description: "Player is first in the room, waiting for second player to initiate game"})
            }
        });
    });
});

module.exports = router;
