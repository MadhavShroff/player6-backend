var currentSelection;
var firstOrSecond = null;
var memID = null;
var gameID = null;
var matchID = null;
var timeout;
$(document).ready(() => {
    $("#close-button").click(() => {
        hideModal();
    })
    MemberStack.onReady.then(async function(member) {
        var metadata = await member.getMetaData()
        for(let j = 1; j <=11; j++) {
            $(`#card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);
            $(`#faq-card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#faq-card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);   
        }
        firstOrSecond = metadata.gameState.joined === "First" ? 1 : 2;
        memID = metadata.userInfo.memID;
        gameID = metadata.gameState.gameID;
        matchID = metadata.gameState.matchID;
        if(metadata.gameState.joined === "First") {
            setName(metadata.gameState.user2.name);
        } else if(metadata.gameState.joined === "Second") {
            setName(metadata.gameState.user1.name);
        } else {
            setName("Opponent");
            console.log("Error: Opponent name not defined!");
        }
        if(matchCards[matchID].gameStarted) {
            console.log("PlayerSelection Completed");
            showPlayerSelectionCompletedOverlay();
            clearTimeout(timeout);
            return;
        }
        for (let j = 1; j <=11; j++) {
            registerClickEvent($(`#card-left-${j}`));
            registerClickEvent($(`#card-right-${j}`));
            registerClickEvent($(`#faq-card-left-${j}`));
            registerClickEvent($(`#faq-card-right-${j}`));
        }
        socket.emit('arrived at player selection', { "gameID": gameID, "memID": memID, "whichUser" : `user${firstOrSecond}`,});
        socket.emit('join member room', metadata.userInfo.memID);
        socket.on("welcome to player selection", (data) => { 
            // triggers when any of the players arrive at /player-selection
            if(data.startGame) {
                console.log("Both players arrived at player selection");
                hideWaitingOverlay();
            } else {
                console.log("Waiting for opp to join");
                console.log(data.startTime);
                showWaitingOverlay(data.startTime);
            }
        });
        socket.on("update", (data) => {
            console.log("Received udpate");
            console.log(data);
            // Player Selection Completed
            if(matchCards[matchID].gameStarted || isPlayerSelectionCompleted(data.playerSelection)) {
                console.log("PlayerSelection Completed");
                showPlayerSelectionCompletedOverlay();
                clearTimeout(timeout);
                return;
            } else if(isOpponentPlayerSelectionCompleted(data.playerSelection)) { // If Opponent's player selection is completed
                console.log("Only Me");
                showDrawers(data.countdownBase.timestamp)
                stopCountdown();
                clearTimeout(timeout);
            } else {
                if(data.turn === metadata.userInfo.memID) { // if this user's turn
                    showDrawers(data.countdownBase.timestamp)
                } else {
                    showOpponentSelectingPlayerOverlay(data.countdownBase.timestamp);
                }
                var ms = (60 - Math.ceil(new Date().getTime()/1000 - data.countdownBase.timestamp/1000))*1000; // seconds remaining 
                if(ms > 0) {  // If timeout seconds is positive
                    clearTimeout(timeout);
                    var bias = metadata.gameState.joined === "First" ? 0 : 1000;
                    timeout = setTimeout(() => { // TODO: remove timeout if user clicks on a card. 
                        // (If "player selected" is invoked, "timer expired" must not)
                        console.log("Emitted timer expired");
                        socket.emit("timer expired", {"gameID": metadata.gameState.gameID, "userID": metadata.userInfo.memID, "expiredTurn": data.turn, "expiredTime": data.countdownBase.timestamp + 60000});
                    }, ms + bias);
                }
            }
            // Player Selection
            setCardsInDrawers(data.playerSelection);
        })
        socket.on("Illegal player selection", () => {
            showModal();
            $("#modal-popup > div.div-block-59 > div").text("Cannot pick >5 per team !!");
            $("#yes-button").unbind();
            $("#yes-button").text("OK").click(() => {
                hideModal();
                $("#yes-button").text("Yes").unbind();
            });
        })
    });
})

const showModal = () => {
    $("body > div.div-block-52 > div.container-19.w-container").css("display", "block");
    $("#modal-parent").css("display", "block");
} 
const hideModal = () => {
    $("body > div.div-block-52 > div.container-19.w-container").css("display", "none");
    $("#modal-parent").css("display", "none");
}

async function onPlayerSelect(event, playerSelected) {
    if(event!= null) event.preventDefault();
    //TODO : Come back from here. 
    // Add socket actions on playerSelect, add turns and update() function for server
    // Points, ask about coins
    // Finish admin page

    // socket.emit("player selected", {gameid, memid, player selected});

    showModal();
    $("#modal-popup > div.div-block-59 > div").text(`Sure about ${playerSelected}?`);
    $("#yes-button").text("Yes").unbind();
    $("#yes-button").click(() => {
        clearTimeout(timeout);
        hideModal();
        socket.emit("player selected", {
            "gameID": gameID,
            "memID" : memID,
            "whichUser" : `user${firstOrSecond}`,
            "playerSelected" : playerSelected,
            "team1" : matchCards[matchID].team1abbr,
            "team2" : matchCards[matchID].team2abbr,
            "players" : matchCards[matchID].players
        });
        $("#yes-button").text("Yes").unbind();
    });
}

function isPlayerSelectionCompleted(selection) {
    var count = 0;
    var u1count = 0; var u2count = 0;
    var missedCountUser1 = 0; var missedCountUser2 = 0;
    $.each(selection.user1, (idx, name) => {
        if(name !== "- Turn Missed -") u1count = u1count + 1;
        else missedCountUser1 = missedCountUser1 + 1;
    });
    $.each(selection.user2, (idx, name) => {
        if(name !== "- Turn Missed -") u2count = u2count + 1;
        else missedCountUser2 = missedCountUser2 + 1;
    });
    if(u1count === 6 && u2count === 6) {
        socket.emit("player selection completed", gameID);
        return true;
    }
    if(firstOrSecond === 1) {
        if(u1count >= 6) return true;
        else return false;
    } else if(firstOrSecond === 2) {
        if(u2count >= 6) return true;
        else return false;
    }
}

function isOpponentPlayerSelectionCompleted(sel) {
    var u1count = 0; var u2count = 0;
    var missedCountUser1 = 0; var missedCountUser2 = 0;
    var user = `user${firstOrSecond == 1 ? 2 : 1}`;
    if(user === "user1") {
		sel.user1.forEach((name) => {
			if(name !== "- Turn Missed -") u1count = u1count + 1;
			else missedCountUser1 = missedCountUser1 + 1;
		});
		if(u1count >= 6) return true;
        else return false;
	} else { // user2
		sel.user2.forEach((name) => {
			if(name !== "- Turn Missed -") u2count = u2count + 1;
			else missedCountUser2 = missedCountUser2 + 1;
		});
		if(u2count >= 6) return true;
        else return false;
	}
}

var waitingTimer = null;
var waitingSeconds = 300;
const showWaitingOverlay = (base) => {
    console.log("Showing Waiting Overlay"); 
    hideAllOverlays();
    stopCountdown();
    waitingSeconds = (300 - Math.ceil(new Date().getTime()/1000 - base/1000));
    if(waitingSeconds > 0) waitingTimer = setInterval(() => {
        var m = Math.floor(waitingSeconds/60);
        var s = waitingSeconds%60;
        if (s<10) s = `0${s}`;
        $("#js-clock-seconds-waiting").text(`${m}:${s}`);
        if(waitingSeconds == 0) {
            $("#js-clock-seconds-waiting").text(`00:00`);
            // TODO: some
            socket.emit("waiting timeout exhausted", {gameID, memID});
        }
        waitingSeconds = waitingSeconds - 1;
    }, 1000);
    else {
        console.log("Waiting time neagtive!");
        console.log(base);
    }

    $("#game-start-screen-freeze").css("display", "block");
}

const hideWaitingOverlay = () => {
    $("#game-start-screen-freeze").css("display", "none");
    clearInterval(waitingTimer);
    $("#js-clock-seconds-waiting").text("4:00");
}

const fastForward = (num) => {
    waitingSeconds = waitingSeconds + num;
}

function registerClickEvent(card) {
    card.click((event) => onPlayerSelect(event, card.text()));
}

function setName(name) {
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-14").text(`${name}'s Team`);
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-15").text(`${name}'s team will appear in this box`);
}

function setCardsInDrawers(sel) {
    $("#opp-team")[0].innerHTML = "";
    $("#my-team")[0].innerHTML = "";
    if(firstOrSecond === 1) {
        if("user1" in sel)
            $.each(sel.user1, (idx, name) => {
                removeCard(name);
                addCard("my-team", name)
            })
        if("user2" in sel)
        $.each(sel.user2, (idx, name) => {
                removeCard(name);
                addCard("opp-team", name)
            })
    } else {
        if("user1" in sel)
        $.each(sel.user1, (idx, name) => {
                removeCard(name);
                addCard("opp-team", name)
            })
        if("user2" in sel)
        $.each(sel.user2, (idx, name) => {
                removeCard(name);
                addCard("my-team", name)
        })
    }
}

const removeCard = (name) => {
    for (let j = 1; j <=11; j++) {
        if($(`#card-left-${j}`).text() === name) {
            $(`#card-left-${j}`).remove();
            $(`#faq-card-left-${j}`).remove();
            break;
        }
        if($(`#card-right-${j}`).text() === name) {
            $(`#card-right-${j}`).remove();
            $(`#faq-card-right-${j}`).remove();
            break;
        }
    }
}

const addCard = (side, which) => {
    if(which === "- Turn Missed -") $div = $("<div>", {"class":"c-card__one", "style": "background: darkred;"});
    else $div = $("<div>", {"class":"c-card__one"});
    $div.text(which);
    $(`#${side}`).append($div);
}

const hideAllOverlays = () => {
    stopCountdown();
    hidePlayerSelectionCompletedOverlay(); // Player Selection Completed Overlay
    hideOpponentSelectingPlayerOverlay(); // Opponent choosing...
    hideLoadingOverlay(); // Loading... Hold 
    hideModal(); // Are You sure?
    hideWaitingOverlay();
}

const showPlayerSelectionCompletedOverlay = () => {
    hideAllOverlays();
    stopCountdown();
    setTimeout( () => $("body > div.div-block-53").css("display", "block"), 200);
}

const hidePlayerSelectionCompletedOverlay = () => {
    $("body > div.div-block-53").css("display", "none");
}

var timer = null;
const showOpponentSelectingPlayerOverlay = (base) => {
    console.log("Show OpponentSelectingPlayerOverlay");
    hideAllOverlays();
    stopCountdown();
    var i = 60 - Math.ceil(new Date().getTime()/1000 - base/1000);
    timer = setInterval(() => {
        $("#js-clock-seconds").text(i);
        if(i == 0) {
            clearInterval(timer);
            hideOpponentSelectingPlayerOverlay();
        };
        i = i-1;
    }, 1000)
    $("#screen-freeze").css("display", "block");
}

const hideOpponentSelectingPlayerOverlay = () => {
    $("#screen-freeze").css("display", "none");
    clearInterval(timer);
    $("#js-clock-seconds").text(60);
}

const showLoadingOverlay = () => {
    hideAllOverlays();
    $("body > div.text-wrapper-2.loading").css("display", "block");
}

const hideLoadingOverlay = () => {
    $("body > div.text-wrapper-2.loading").css("display", "none");
}

var mainCountdown;
function startCountdown(i) { // starts a countdown for the main screen timer, and on its time out, selects a null player for this player (NaP)
    var countdownSeconds = 60 - Math.ceil(new Date().getTime()/1000 - i/1000);
    mainCountdown = setInterval(async () => {
        if(countdownSeconds >= 10 && countdownSeconds < 60) {
            $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:${countdownSeconds}`);
        } else if (countdownSeconds < 10){
            $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:0${countdownSeconds}`);
        }
        if (countdownSeconds === 0) {
            stopCountdown();
            addCard("my-team", "- Turn Missed -");
        }
        countdownSeconds = countdownSeconds - 1;
    }, 1000);
}

function stopCountdown() {
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:00`);
    clearInterval(mainCountdown);
}

const showDrawers = (i) => {
    console.log("Show Drawers");
    hideAllOverlays();
    stopCountdown();
    startCountdown(i);
    $("body > div.div-block-52").css("display", "block");
}
const hideDrawers = () => {
    stopCountdown();
    $("body > div.div-block-52").css("display", "none");
}