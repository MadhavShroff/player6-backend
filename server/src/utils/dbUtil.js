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

const setStartTime = async (gameID) => {
    const db = globalClient.db('games');
    db.collection('matchedGames').updateOne(
        { pendingGameID: gameID },
        { $set: {
                playerSelectionStartTime : (new Date()).getTime()
            }
        }
    );
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
        if(result !== null) return result.turns[result.turns.length - 1];
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

const isPlayerSelectionCompleted = async (gameID) => {
    console.log(`isPlayerSelectionCompleted called ${gameID}`);
    const db = globalClient.db('games');
    return db.collection('matchedGames').findOne(
        { pendingGameID: gameID }
    ).then(res => {
        return res.playerSelectionCompleted;
    });
}

module.exports = {
    getPlayerSelectionStartedStatus,
    setStartTime,
    addTurn,
    getTossWinner,
    getLatestTurn,
    getPlayerSelection,
    getComplimentUser,
    addSelectionMissed,
    updatePlayerSelectionCompleted,
    isPlayerSelectionCompleted,
    addSelection
}