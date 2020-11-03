const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { MongoClient } = require('mongodb');
const { getPlayerSelectionStartedStatus, 
	setStartTime, 
	addTurn, 
	getTossWinner, 
	getLatestTurn, 
	getPlayerSelection, 
	getComplimentUser,
	addSelectionMissed,
	updatePlayerSelectionCompleted,
	isPlayerSelectionCompleted,
	addSelection} = require("./utils/dbUtil");
const e = require('express');


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

	socket.on('arrived at player selection', async (gameID) => {
		socket.join(gameID);
		var startTime = await getPlayerSelectionStartedStatus(gameID);
		var isCompleted = await isPlayerSelectionCompleted(gameID);
		console.log("IsPlayerSelectionCompleted: " + isCompleted);
		if(startTime === -1) { 		// If player Selection has not started yet
			io.of('/').in(gameID).clients( async (error, clients) => {
				if (error) console.log(error);
				console.log(clients);
				if(clients.length === 2) {				// start player selection if both clients arrived. 
					io.to(gameID).emit("welcome to player selection", {"startGame": true}); 
					await setStartTime(gameID);
					var winner = await getTossWinner(gameID);
					console.log(`Toss Winner is : ${winner}`);
					var base =  await addTurn(gameID, winner);
					var sel = await getPlayerSelection(gameID);
					console.log(`Sent Update : ${winner} ${base.timestamp} ${isCompleted}  { ${sel.user1} , ${sel.user2} }`);
					io.to(gameID).emit("update", {turn: winner, countdownBase: base, playerSelectionCompleted: isCompleted, playerSelection: sel})
				} else 
					io.to(gameID).emit("welcome to player selection", {"startGame": false});
			});
		} else { // Player Selection has already started
			var turn = await getLatestTurn(gameID);
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
				io.to(gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel})
			} else {
				console.log(`Sent Update : ${turn.user} ${turn.timestamp} ${isCompleted}  { ${sel.user1} , ${sel.user2} }`);
				io.to(gameID).emit("update", {"turn": turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel})
			}
		}
	});

	const timerExpired = async (data) => {
		console.log("Timer Expired, data:");
		console.log(data);
		var turn; var sel; var user;
		turn = await getLatestTurn(data.gameID);
		console.log(turn);
		var isCompleted = isPlayerSelectionCompleted(data.gameID);
		if(turn.timestamp === data.expiredTime) { // if this timestamp is already added, return
			// If already added
			sel = await getPlayerSelection(data.gameID);
			io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel})
		} else {
			// If not added
			user = await getComplimentUser(data.gameID, data.expiredTurn); // gets compliment user
			turn = await addTurn(data.gameID, user, data.expiredTime); // adds next turn to the turns[], returns latest baseTime
			console.log(turn);
			sel = await addSelectionMissed(data.gameID, data.expiredTurn); // Adds a missed player to this user's player selection, if it was this players turn
			io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel})
		}
	}

	socket.on("timer expired", timerExpired);

	socket.on("player selected", async (data) => {
		// determine if it is a valid selection
			// ie, including the selected card, the player must not have selected more than 
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
		// Legal Player Selection
		var turn = await getLatestTurn(data.gameID);
		if(data.memID !== turn.user) console.log("ERROR - Player whos turn it isnt has made a selection");
		var user = await getComplimentUser(data.gameID, turn.user);
		turn = await addTurn(data.gameID, user);
		sel = await addSelection(data.gameID, data.whichUser, data.playerSelected);
		var isCompleted = isPlayerSelectionCompleted(data.gameID);
		io.to(data.gameID).emit("update", {"turn" : turn.user, countdownBase: turn, playerSelectionCompleted: isCompleted, playerSelection: sel})
	});

	socket.on("fine levied", (data) => {
		
	})

	socket.on("player selection completed", async (gameID) => {
		await updatePlayerSelectionCompleted(gameID);
	})
});

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
