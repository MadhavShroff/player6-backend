const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { MongoClient } = require('mongodb');
const { getPlayerSelectionStartedStatus, 
	setGameStartTime, 
	addTurn, 
	getTossWinner, 
	getLatestTurn, 
	getPlayerSelection, 
	getComplimentUser,
	addSelectionMissed,
	updatePlayerSelectionCompleted,
	getPlayerSelectionCompleted,
	getPlayerStartTime,
	addSelection,
	getAccountDetails,
	getUsers,
	setPlayerStartTime} = require("./utils/dbUtil");
const e = require('express');

const serverSecretKey = "21df6974fff676c9032af96e9c3ca122";


let globalClient;
MongoClient.connect(config.mongoose.url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
	logger.info('Connected to MongoDB');
	globalClient = client;
});

server = app.listen(config.port, () => {
	logger.info(`Listening to port ${config.port}`);
	console.log();
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
	console.log('User connected');

	socket.on('disconnect', () => {
		console.log('User disconnected');
	});

	socket.on('join member room', (memID) => {
		socket.join(memID);
	})

	socket.on('arrived at player selection', async ( data ) => {
		var gameID = data.gameID;
		var memID = data.memID;
		socket.join(gameID);
		var startTime = await getPlayerSelectionStartedStatus(gameID);
		var isCompleted = await getPlayerSelectionCompleted(gameID);
		var turn =  await getLatestTurn(data.gameID);
		console.log("getPlayerSelectionCompleted: " + isCompleted);
		if(startTime === -1 || turn === null) { 		// If player Selection has not started yet
			io.of('/').in(gameID).clients( async (error, clients) => {
				if (error) console.log(error);
				console.log(clients);
				if(clients.length === 2) {				// start player selection if both clients arrived. 
					io.to(gameID).emit("welcome to player selection", {"startGame": true}); 
					await setGameStartTime(gameID);
					var winner = await getTossWinner(gameID);
					console.log(`Toss Winner is : ${winner}`);
					var base =  await addTurn(gameID, winner);
					var sel = await getPlayerSelection(gameID);
					console.log(`Sent Update : ${winner} ${base.timestamp} ${isCompleted}  { ${sel.user1} , ${sel.user2} }`);
					io.to(gameID).emit("update", {turn: winner, countdownBase: base, playerSelectionCompleted: isCompleted, playerSelection: sel, onlyMe: false})
				} else {
					console.log(data);
					var startTime = await getPlayerStartTime({gameID, memID});
					if(startTime === -1) {
						startTime = await setPlayerStartTime({gameID, memID});
					}
					io.to(gameID).emit("welcome to player selection", {"startGame": false, "startTime" : startTime});
				}
			});
		} else { // Player Selection has already started
			var sel = await getPlayerSelection(gameID);
			var ms = (60 - Math.ceil(new Date().getTime()/1000 - turn.timestamp/1000));
			console.log(ms);
			if(ms <= 0 && !isCompleted) {
				var user = turn.user;
				var time = turn.timestamp;
				while(ms < 0) { // add turns before sending if time is negative
					ms = ms + 60;
					time = time + 60000;
					sel = await addSelectionMissed(gameID, user);
					turn = await addTurn(gameID, user, time);
					user = await getComplimentUser(gameID, user); // gets compliment user
				}
				console.log(`Sent Update : ${turn.user} ${turn.timestamp} ${isCompleted}  { ${sel.user1} , ${sel.user2} }`);
				io.to(gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel, onlyMe: false})
			} else { // if neither player selection is completed, and refreshed within time, 
				console.log(`Sent Update : ${turn.user} ${turn.timestamp} ${isCompleted}  { ${sel.user1} , ${sel.user2} }`);
				io.to(gameID).emit("update", {"turn": turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel, onlyMe: false})
			}
		}
	});
	
	const timerExpired = async (data) => {
		console.log("Timer Expired, data:");
		console.log(data);
		var turn; var sel; var user;
		turn = await getLatestTurn(data.gameID);
		console.log(turn);
		var isCompleted = await getPlayerSelectionCompleted(data.gameID);
		if(turn.timestamp === data.expiredTime) { // if this timestamp is already added, return
			// If already added
			sel = await getPlayerSelection(data.gameID);
			io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel, onlyMe: false})
		} else {
			// If not added
			user = await getComplimentUser(data.gameID, data.expiredTurn); // gets compliment user
			turn = await addTurn(data.gameID, user, data.expiredTime); // adds next turn to the turns[], returns latest baseTime
			console.log(turn);
			sel = await addSelectionMissed(data.gameID, data.expiredTurn); // Adds a missed player to this user's player selection, if it was this players turn
			io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel, onlyMe: false})
		}
	}

	socket.on("timer expired", timerExpired);

	socket.on("get account", async (data) => {
		console.log("get account called");
		var account = await getAccountDetails(data);
		socket.emit("account details", account);
	})

	socket.on("get user accounts", async () => {
		var users = await getUsers();
		socket.emit("user accounts", users);
	})

	socket.on("edit points", (data) => {
		if(data.secretKey !== serverSecretKey) return;
		// TODO:
		
	})

	socket.on("player selected", async (data) => {
		// determine if it is a legal selection
			// ie, including the selected card, the player must not have selected more than 5 from a team
		var sel = await getPlayerSelection(data.gameID);
		sel[data.whichUser].push(data.playerSelected);
		var count = 0;
		sel[data.whichUser].forEach(element => {
			if(data.players["team1"].includes(element)) {
				count = count+1;
			}
		});
		if(count > 5) {
			io.to(data.memID).emit("Illegal player selection");
			console.log("Illegal Player Selection");
			return;
		}
		count = 0;
		sel[data.whichUser].forEach(element => {
			if(data.players["team2"].includes(element)) {
				count = count+1;
			}
		});
		if(count > 5) { 
			io.to(data.memID).emit("Illegal player selection");
			console.log("Illegal Player Selection");
			return
		}
		// if Legal Player Selection
		var turn = await getLatestTurn(data.gameID);
		if(data.memID !== turn.user) console.log("ERROR - INCONSISTENCY - Player whos turn it isnt has made a selection");
		var newSel = await addSelection(data.gameID, data.whichUser, data.playerSelected);
		var compUser = await getComplimentUser(data.gameID, turn.user);
		var newTurn = await addTurn(data.gameID, compUser);
		io.to(data.gameID).emit("update", {"turn" : newTurn.user, countdownBase: newTurn, playerSelectionCompleted: false, playerSelection: newSel})
	});

	socket.on("waiting timeout exhausted", async (data) => {
		// means that for this memID, 4 mins have exhausted, 
		//and opp has not appeared, start with this users turn
		var sel = await getPlayerSelection(data.gameID);
		var turn = await addTurn(data.gameID, data.memID)
		io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: false, playerSelection: sel})
	});

	socket.on("player selection completed", async (gameID) => {
		await updatePlayerSelectionCompleted(gameID);
	})
});

const getPlayerSelectionCompletedFor = (user, sel) => { // returns if player selection completed overlay should be shown for a particulat user
    var u1count = 0; var u2count = 0;
    var missedCountUser1 = 0; var missedCountUser2 = 0;
	if(user === "user1") {
		sel.user1.forEach((name) => {
			if(name !== "- Turn Missed -") u1count = u1count + 1;
			else missedCountUser1 = missedCountUser1 + 1;
		});
		if(u1count >= 6) return true;
        else return false;
	} else { // user2
		sel.user1.forEach((name) => {
			if(name !== "- Turn Missed -") u2count = u2count + 1;
			else missedCountUser2 = missedCountUser2 + 1;
		});
		if(u2count >= 6) return true;
        else return false;
	}
}

const exitHandler = () => {
	if (server) {
		server.close(() => {
			logger.info('Server closed');
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
};

const unexpectedErrorHandler = (error) => {
	logger.error(error);
	exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
	logger.info('SIGTERM received');
	if (server) {
		server.close();
	}
});
