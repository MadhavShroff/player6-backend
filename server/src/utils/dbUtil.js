const e = require('express');
const { MongoClient } = require('mongodb');
const config = require('../config/config');

let globalClient;
MongoClient.connect(config.mongoose.url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
  globalClient = client;
});

const getPlayerSelectionStartedStatus = async (gameID) => {
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne({ pendingGameID: gameID })
    .then((result) => {
        if(result.playerSelectionStartTime === -1) return -1;
        else return result.playerSelectionStartTime;
    });
}

const addTurn = async (gameID, userID, time) => { // adds a turn to the turns[], returns new baseTime
    console.log(`addTurn called - ${userID} ${time}`);
    const db = globalClient.db('games');
    var t;
    if(time == undefined) t = new Date().getTime()
    else t = time;
    var pu = { turns : { "timestamp": t, "user": userID }};
    db.collection('matchedGames').updateOne(
        { pendingGameID: gameID }, { $push: pu }
    );
    return pu.turns;
}

const getLatestTurn = async (gameID) => {
    console.log(`getLatestTurn called ${gameID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne({ pendingGameID: gameID }).then( result => {
        if(result !== null)
            if(result.turns.length > 0) 
                return result.turns[result.turns.length - 1];
            else return null;
        else return null;
    })
}

const getTossWinner = async (gameID) => {
    console.log("getTossWinner called");
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(result => {
        if(result !== null) return result.tossWinner;
    })
}

const getPlayerSelection = async (gameID) => {
    console.log("getPlayerSelection called");
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(result => {
        if(result !== null) return result.playerSelection;
    })
}

const getComplimentUser = async (gameID, memID) => {
    console.log(`getComplimentUser called ${memID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(result => {
        if(result.user1.memID === memID) {
            return result.user2.memID;
        } else if(result.user2.memID === memID) {
            return result.user1.memID;
        } else {
            throw new Error("memID is not right");
        }
    })
}

const addSelectionMissed = async (gameID, memID) => { // Adds a -turn missed- to this users player selection, and return the effective player selection
    console.log(`addSelectionMissed called ${memID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(result => {
        var pu = {};
        if(result.user1.memID === memID) {
            pu["playerSelection.user1"] = "- Turn Missed -";
        } else if(result.user2.memID === memID) {
            pu["playerSelection.user2"] = "- Turn Missed -";
        }
        return db.collection('matchedGames').findOneAndUpdate(
            { pendingGameID: gameID }, 
            { "$push": pu }, {returnOriginal: false}
        ).then(res => {
            console.log("After adding Turn missed");
            console.log(res.value.playerSelection);
            return res.value.playerSelection;
        });
    })
}

const addSelection = async (gameID, which, playerSelected) => { // Adds a -turn missed- to this users player selection, and return the effective player selection
    console.log(`addSelection called ${gameID} ${which} ${playerSelected}`);
    const db = globalClient.db('games');
    var pu = {};
    if(which === "user1") {
        pu["playerSelection.user1"] = playerSelected;
    } else if(which === "user2") {
        pu["playerSelection.user2"] = playerSelected;
    }
    return db.collection('matchedGames').findOneAndUpdate(
        { pendingGameID: gameID }, 
        { "$push": pu }, {returnOriginal: false}
    ).then(res => {
        console.log(res.value.playerSelection);
        return res.value.playerSelection;
    });
}

const updatePlayerSelectionCompleted = async (gameID) => {
    console.log(`updatePlayerSelectionCompleted called ${gameID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOneAndUpdate(
        { pendingGameID: gameID }, 
        { "$set": {"playerSelectionCompleted" : true} }, {returnOriginal: false}
    ).then(res => {
        return res.value.playerSelectionCompleted;
    });
}

const getPlayerSelectionCompleted = async (gameID) => {
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(res => {
        console.log(`getPlayerSelectionCompleted called ${gameID}, returned ${res.playerSelectionCompleted}`);
        return res.playerSelectionCompleted;
    });
}

const getGameStartTime = async (gameID) => {
    console.log(`getGameStartTime called ${gameID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(res => {
        return res.playerSelectionStartTime;
    });
}

const setGameStartTime = async (gameID) => {
    console.log(`setGameStartTime called ${gameID}`);
    const db = globalClient.db('games');
    db.collection('matchedGames').updateOne(
        { pendingGameID: gameID },
        { $set: {
                playerSelectionStartTime : (new Date()).getTime()
            }
        }
    );
}

const getPlayerStartTime = async (data) => {
    console.log(`getPlayerStartTime called ${data.gameID} ${data.memID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: data.gameID }
    ).then(res => {
        if(res.user1.memID === data.memID) {
            return res.gameStarted.user1;
        } else {
            return res.gameStarted.user2;
        }
    });
}

const setPlayerStartTime = async (data) => {
    console.log(`setPlayerStartTime called ${data.gameID} ${data.memID}`);
    const db = globalClient.db('games');
    var se = {};
    return db.collection('matchedGames').findOne(
        { pendingGameID: data.gameID }
    ).then(res => {
        var time = (new Date()).getTime()
        if(res.user1.memID === data.memID) {
            se["gameStarted.user1"] = time;
        } else {
            se["gameStarted.user2"] = time;
        }
        return db.collection('matchedGames').updateOne(
            { pendingGameID: data.gameID },
            { $set: se}
        ).then(() => {
            return time;
        });
    });
}

const getAccountDetails = async (data) => {
    console.log(`getAccountDetails called ${data.memID}`);
    const db = globalClient.db('games');
    return db.collection('users').findOneAndUpdate(
        {"_id" : data.memID}, { $set : {"_id" : data.memID, "name": data.name, "email": data.email}}, { upsert : true}
    ).then(res => {
        if(res.value === null) { // ie no record found, ie first time ie one document would have been upserted, return 0, 0, update account with 0s, 
            return db.collection('users').findOneAndUpdate(
                {"_id" : data.memID}, { $set : {"coins" : 0, "points" : 0}}, { upsert : true}
            ).then(res => {
                return {"coins" : 0, "points" : 0};
            });
        } else { // return the document that matches the id, ie the actual account details. 
            return {"coins" : res.value.coins, "points" : res.value.points}
        }
    });
}

const getUsers = async () => {
    console.log(`getUsers called`);
    const db = globalClient.db('games');
    return db.collection('users').find({}).toArray().then((array) => {
        return array;
    });
};

const editPoints = async (memID, data) => {
    console.log(`editPoints called ${memID} - points: ${data.points} coins: ${data.coins}`);
    const db = globalClient.db('games');
    return db.collection('users').updateOne({"_id" : memID}, {$set : {"coins" : data.coins, "points": data.points}}, {returnOriginal: true}).then((array) => {
        if(array.modifiedCount === 1) {
            return {status: "success"};
        } else if(array.modifiedCount === 0) {
            return {status: "no change made"};
        }
    }).catch(() => {
        return {status: "error"};
    })
}

const declareTossResult = async (matchID, winner) => {
    console.log(`declareTossResult called, match - ${matchID} - toss winner: ${winner}`);
    const db = globalClient.db('games');
    var se = {}
    se[`matchCards.${matchID}.tossResults`] = winner;
    return db.collection('matchData').updateOne({"_id" : "data"}, 
        {$set : se}, {returnOriginal: true}).then((array) => {
        if(array.modifiedCount === 1) {
            if(winner === "Undeclared") return {status: "success", msg: `Successfully Undeclared toss. Players will not be able to proceed to player selection`};
            else return {status: "success", msg: `Successfully declared toss. The "View results" button is now visible for this match. Players may proceed to player selection`};
        } else if(array.modifiedCount === 0) {
            return {status: "no change made"};
        }
    }).catch((err) => {
        return {status: "error", msg: err};
    });
};

const declareWinner = async (matchID, winner) => {
    console.log(`declareWinner called, match - ${matchID} - winner: ${winner}`);
    const db = globalClient.db('games');
    var se = {}
    se[`matchCards.${matchID}.matchWinner`] = winner;
    return db.collection('matchData').updateOne({"_id" : "data"}, 
        {$set : se}, {returnOriginal: true}).then((array) => {
        if(array.modifiedCount === 1) {
            if(winner === "Undeclared") return {status: "success", msg: `Successfully Undeclared match winner`};
            else return {status: "success", msg: `Successfully declared match winner`};
        } else if(array.modifiedCount === 0) {
            return {status: "no change made"};
        }
    }).catch((err) => {
        return {status: "error", msg: err};
    });
};

const editMatchCard = async (matchID, data) => {
    console.log(`declareWinner called, match - ${matchID}`);
    const db = globalClient.db('games');
    var se = {}
    se[`matchCards.${matchID}.team1`] = data.team1;
    se[`matchCards.${matchID}.team2`] = data.team2;
    se[`matchCards.${matchID}.team1abbr`] = data.team1abbr;
    se[`matchCards.${matchID}.team2abbr`] = data.team2abbr;
    se[`matchCards.${matchID}.date`] = data.date;
    se[`matchCards.${matchID}.time`] = data.time;
    se[`matchCards.${matchID}.entryRequirement`] = data.entryRequirement;
    se[`matchCards.${matchID}.coverImgHref`] = data.coverImgHref;
    return db.collection('matchData').updateOne({"_id" : "data"}, 
        {$set : se}, {returnOriginal: true}).then((array) => {
            if(array.modifiedCount === 1) {
                return {status: "success", msg : "Successfully reflected changes"};
            } else if(array.modifiedCount === 0) {
                return {status: "no change made"};
            }
    }).catch((err) => {
        return {status: "error", msg: err};
    });
};

const startGame = async (matchID, isStart) => {
    console.log(`startGame called, match - ${matchID}, ${isStart}`);
    const db = globalClient.db('games');
    var se = {}
    se[`matchCards.${matchID}.gameStarted`] = isStart === "True" ? true : false;
    return db.collection('matchData').updateOne({"_id" : "data"}, 
        {$set : se}, {returnOriginal: true}).then((array) => {
            if(array.modifiedCount === 1) {
                return {status: "success", msg : "Successfully reflected changes"};
            } else if(array.modifiedCount === 0) {
                return {status: "no change made"};
            }
    }).catch((err) => {
        return {status: "error", msg: err};
    });
}

const getPlayerSelectionIds = async (gameID) => {
    console.log(`getPlayerSelectionIds called ${gameID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(result => {
        if(result !== null) {
            var x = {};
            x[result.user1.memID] = result.playerSelection.user1;
            x[result.user2.memID] = result.playerSelection.user2;
            return x;
        }
    })
}

const getGamesAndPlayerSelectionHavingMatchID = async (matchID) => {
    console.log(`getGamesAndPlayerSelectionHavingMatchID called ${matchID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').find({}).toArray().then((array) => {
        var l = [];
        var games = array.filter(i => i.gameInfo["gameID"].toString() === matchID);
        games.forEach(game => {
            l.push({
                    "gameID" : game.pendingGameID, 
                    "playerSelection": {
                        "memId1" : game.user1.memID, 
                        "ps1" : game.playerSelection.user1, 
                        "memId2" : game.user2.memID, 
                        "ps2" : game.playerSelection.user2
                    }
                }
            );
        });
        return l;
    })
}

const levyFine = async (memID, gameID, fineAmount) => {
    console.log(`fineLevied called ${memID} - fine amount: ${fineAmount}`);
    const db = globalClient.db('games');
    db.collection('users').findOne({"_id" : memID}).then((result) => {
        if(result != null) 
        db.collection('users').findOneAndUpdate({"_id" : memID}, {$set : {"points" : String((parseInt(result.points) - 1000)) }}).then(() => {
            db.collection('matchedGames').findOneAndUpdate({ pendingGameID: gameID }, 
                {$set : {"fineLevied" : {
                    "reason" : "Selected less than 3 players",
                    "timestamp" : new Date().getTime(),
                    "beforeFine" : result.points,
                    "afterFine" : String((parseInt(result.points) - 1000)),
                    "fineAmount" : 1000,
            }}}).then(() => {
                return;
            });
        });
    }).catch(() => {
        return {status: "error"};
    })
}


module.exports = {
    getPlayerSelectionStartedStatus,
    setGameStartTime,
    addTurn,
    getTossWinner,
    getLatestTurn,
    getPlayerSelection,
    getComplimentUser,
    addSelectionMissed,
    updatePlayerSelectionCompleted,
    getPlayerSelectionCompleted,
    getGameStartTime,
    setGameStartTime,
    setPlayerStartTime,
    getPlayerStartTime,
    addSelection,
    getUsers,
    editPoints,
    declareTossResult,
    declareWinner, 
    editMatchCard,
    startGame,
    getAccountDetails,
    getPlayerSelectionIds,
    levyFine,
    getGamesAndPlayerSelectionHavingMatchID
}