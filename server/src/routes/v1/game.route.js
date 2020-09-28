const { assert } = require('console');
const e = require('express');
const express = require('express');

const router = express.Router();
const { MongoClient } = require('mongodb');
const config = require('../../config/config');
const { findOne } = require('../../models/user.model');


//TODO: 
// On choose a contest page, read game state from metadata and redirect to appropriate page. 
//
// Game logic route
let globalClient;
MongoClient.connect(config.mongoose.url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
    globalClient = client;
});

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
        const db = globalClient.db('games');
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
                        res.send({
                            isData: true, 
                            "gameID": result._id, 
                            "user2": {...result.user2}, 
                            "user1": {...result.user1},
                            tossSelection: result.tossSelection == null ? "undefined" : result.tossSelection.user2
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
})

router.post("/makeSelection", (req, res) => {
        const db = globalClient.db('games');
        db.collection('matchedGames').findOne({"pendingGameID" : req.body.gameID}).then((result) => {
            if(result == null) {
                res.send({isData: false, queryResult: "null"});
            } else {
                db.collection('matchedGames').deleteOne(result).then(() => {
                    var selection = result.playerSelection;
                    if(selection == null) selection = {user1: [], user2: []};
                    if(req.body.joined === "First") {
                        selection.user1.indexOf(req.body.playerSelected) === -1 && selection.user1.push(req.body.playerSelected);
                    } else {
                        selection.user2.indexOf(req.body.playerSelected) === -1 && selection.user2.push(req.body.playerSelected);
                    }
                    var game = {...result};
                    game.playerSelection = selection;
                    game.playerSelection.isNew = true;
                    db.collection('matchedGames').insertOne(game).then(() => {
                        res.send({
                            "isData": true, 
                            "gameID": result._id, 
                            "playerSelection": game.playerSelection,
                            "user2": {...result.user2}, 
                            "user1": {...result.user1},
                            "tossSelection": req.body.tossSelection,
                            "isNew": "isNew" in result.playerSelection ? result.playerSelection.isNew : true
                        });
                    });
                }) ;
            }
        });
});

router.post("/getPlayerSelection", (req, res) => {
        const db = globalClient.db('games');
        db.collection('matchedGames').findOneAndUpdate({"pendingGameID" : req.body.gameID}, {$set: {"playerSelection.isNew": false}}, {upsert: false}).then((result) => {
            if(result == null) {
                res.send({isData: false, queryResult: "null"});
            } else {
                if(result.value !== null) res.send({
                    "isData": true, 
                    "gameID": result.value._id, 
                    "playerSelection": result.value.playerSelection,
                    "user2": {...result.value.user2}, 
                    "user1": {...result.value.user1},
                    "isNew": true
                });
                else res.send({isData: false, queryResult: "null"});
            }
        });
});

module.exports = router;
