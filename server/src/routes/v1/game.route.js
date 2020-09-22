const { assert } = require('console');
const express = require('express');

const router = express.Router();
const { MongoClient } = require('mongodb');
const config = require('../../config/config');
const { findOne } = require('../../models/user.model');


//TODO: 
// On choose a contest page, read game state from metadata and redirect to appropriate page. 
//

// Game logic route
router.post('/createOrJoinGame', (req, response) => {
  const { gameState } = req.body;
  const { userInfo } = req.body;
  const game = {
    gameInfo: {
      contestChosen: gameState.contestChosen,
      gameType: gameState.gameType,
      gameID: gameState.matchID,
    },
    user1: { ...userInfo },
  };
  MongoClient.connect(config.mongoose.url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
    const db = client.db('games');
    db.collection('pendingGames').find({ gameInfo: game.gameInfo }).toArray((err, res) => {
        if (res.length == 0) {
          console.log('No game exists with following parameters, Player (' +  userInfo.name + ', ' + userInfo.email + ') is first in the room, waiting...');
          console.log(game.gameInfo);
          console.log(userInfo);
          db.collection('pendingGames').insertOne(game, (err, res) => {
              console.log(res);
            response.send({
                status: 'Waiting',
                description: 'Player is first in the room, waiting for second player to initiate game',
                pendingGameID: res.insertedId
              });
          });
        } else if (res[0].user1.memID != userInfo.memID) {
            db.collection('pendingGames').deleteOne({ _id: res[0]._id });
            const newGame = { ...res[0], user2: { ...userInfo }, pendingGameID: String(res[0]._id)};
            db.collection('matchedGames').insertOne(newGame, (err, result) => {
                response.send({
                    status: 'Paired',
                    description:'User is paired with another user, this user is second to come, so waits for user1 to select a team for toss selection',
                    user1: res[0].user1,
                    gameID: result.insertedId
                });
            });
          console.log('Player added to previously pending game, Pending game deleted');
          console.log('Added new match to matchedGames');
        } else if (res[0].user1.memID == userInfo.memID) {
            db.collection('pendingGames').findOne(game, (err, res) => {
                console.log(res._id);
                response.send({
                    status: 'Still Waiting',
                    description: 'Player is first in the room, waiting for second player to initiate game',
                    pendingGameID: res._id
                });
            });
        }
      });
  });
});

router.post("/getGame", (req, res) => {
    //If req.tossSelection is null and player is second, return tossSelection String inverse of first player. 
    //If req.tossSelection is populated and player is First, add tossSelection to game Object. 
    MongoClient.connect(config.mongoose.url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
        if(err) res.status(500).send();
        const db = client.db('games');
        db.collection('matchedGames').findOne({pendingGameID : req.body.pendingID}, (err, result) => {
            var game = result;
            if(result == null) {
                res.send({isData: false, queryResult: "null"});
            } else {
                if(err) res.status(500).send();
                console.log(result)
                if(Array.isArray(result)) {
                    console.log("INCONSISTENCY ERROR Many games with same pending ID");
                    res.send({isData: false, status: "Failure", err: "Inconsistency Error"});
                } else {
                    if( (req.body.tossSelection == null || req.body.tossSelection == "undefined") && req.body.userNum == "Second") {
                            db.collection('matchedGames').findOne(game).then(() => {
                                res.send({
                                    isData: true, 
                                    "gameID": result._id, 
                                    "user2": {...result.user2}, 
                                    "user1": {...result.user1},
                                    tossSelection: result.tossSelection == null ? "undefined" : result.tossSelection.user2
                                });
                            });
                    } else if(req.body.tossSelection != null && req.body.userNum == "First") {
                        db.collection('matchedGames').deleteOne(result).then(() => {
                            game = {...result, tossSelection: {
                                    user1: req.body.tossSelection,
                                    user2: req.body.tossSelection == req.body.teams[0] ? req.body.teams[1] : req.body.teams[0]
                                }
                            };
                            db.collection('matchedGames').insertOne(game).then(() => {
                                res.send({
                                    isData: true, 
                                    "gameID": result._id, 
                                    "user2": {...result.user2}, 
                                    "user1": {...result.user1},
                                    tossSelection: req.body.tossSelection
                                });
                            });
                        }) ;
                    } else {
                        console.log("else " + req.body.tossSelection + " " + req.body.pendingID + " " + req.body.userNum);
                    }
                }
            }
        });
    });
})

module.exports = router;
