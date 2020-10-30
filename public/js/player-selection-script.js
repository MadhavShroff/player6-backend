/*
   TODO: 
   1. Add loading overlay before anything shows up
   2. Add logic for 

*/

var thisGameID = null;
var uname = null;
var uid = null;
var firstOrSecond = null;
var currentSelection = null;
$(document).ready(() => {
    showLoadingOverlay();
    console.log("Player Selection: ready() callback");
    MemberStack.onReady.then(async function(member) {
        var metadata = await member.getMetaData()
        thisGameID = metadata.gameState.gameID;     // get gameID
        uid = metadata.userInfo.memID;
        firstOrSecond = metadata.gameState.joined === "First" ? 1 : 2;
        currentSelection = await getPlayerSelection()      // get player selection so far, print to console
        setCardsInDrawers(currentSelection);
        if(metadata.gameState.joined === "First") {
            setName(metadata.gameState.user2.name);
        } else if(metadata.gameState.joined === "Second") {
            setName(metadata.gameState.user1.name);
        } else {
            setName("Opponent");
            console.log("Error: Opponent name not defined!");
        }
        if(myTurn(metadata.gameState.tossWinner, currentSelection)) {
            console.log("My turn")
            showDrawers();
        } else {
            console.log("Opponent's turn")
            showOpponentSelectingPlayerOverlay();
        }
        if(isPlayerSelectionCompleted(currentSelection)) {
            showPlayerSelectionCompletedOverlay();
            console.log("Player selection completed**")
        }
        for (let j = 1; j <=11; j++) {
            registerClickEvent($(`#card-left-${j}`));
            registerClickEvent($(`#card-right-${j}`));
            registerClickEvent($(`#faq-card-left-${j}`));
            registerClickEvent($(`#faq-card-right-${j}`));
            $(`#card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);
            $(`#faq-card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#faq-card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);
        }
        socket.emit('arrived at player selection', thisGameID);
        socket.on('player update', data => {
            console.log(data);
            currentSelection = data.playerSelection;
            if(!(data.userID === uid)) { // if not this user
                removeCard(data.playerSelected);
                addCard("opp-team", data.playerSelected);
                showDrawers();
            } else {
                showOpponentSelectingPlayerOverlay(); // if this user, made a selection, do nothing
            } 
            if(isPlayerSelectionCompleted(data.playerSelection)) {
                showPlayerSelectionCompletedOverlay();
                console.log("Player selection completed***")
            }
        })
    })
})

function isPlayerSelectionCompleted(selection) {
    var count = 0;
    $.each(selection.user1, (idx, name) => {
        if(name !== "- Turn Missed -") count = count + 1;
    });
    $.each(selection.user2, (idx, name) => {
        if(name !== "- Turn Missed -") count = count + 1;
    });
    if(count >= 12) {
        return true;
    } else {
        return false;
    }
}

function myTurn(isWinner, sel) { 
    var sum = sel.user1.length + sel.user2.length;   
    if(sum % 2 === 0) {
        if(isWinner === "Me") return true;
        else return false;
    } else {
        if(isWinner === "Opponent") return true;
        else return false;
    }
}

function setName(name) {
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-14").text(`${name}'s Team`);
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-15").text(`${name}'s team will appear in this box`);
}

async function getPlayerSelection() {
    return fetch("https://player6backendweb.com/v1/game/getPlayerSelection", {
        // fetch("http://localhost:3000/v1/game/getPlayerSelection", {
            "headers": {
                "accept": "*/*",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site"
            },
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": JSON.stringify({"gameID": thisGameID}),
            "method": "POST",
            "mode": "cors"
        }).then(response => {
            return response.json().then(data => {
                if(data.isData) {
                    return data.playerSelection;
                } else {
                    return null;
                }
            });
        }).catch(err => {
            console.log('Fetch Error :-S', err);
            return null;
        });
}

function registerClickEvent(card) {
    card.click((event) => onPlayerSelect(event, card.text()));
}

async function onPlayerSelect(event, playerSelected) {
    if(event !== null) event.preventDefault();
    if(isValidPlayerSelection(playerSelected, currentSelection)) {
        removeCard(playerSelected);
        addCard("my-team", playerSelected);
        currentSelection = await makeSelection(playerSelected);
    }
}

function isValidPlayerSelection(playerSelected, selection) {
    console.log("isValid received: ");
    console.log(playerSelected);
    console.log(currentSelection);
    if(firstOrSecond == 1) {
        console.log(selection.user1);
    } else {
        console.log(selection.user2);
    }
    console.log(firstOrSecond);
    return true;
}

function setCardsInDrawers(sel) {
    $("#opp-team")[0].innerHTML = "";
    $("#my-team")[0].innerHTML = "";
    if(firstOrSecond === "First") {
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

function makeSelection(playerSelected) { // returns the updated player selection, after inserting new selection in db
    // return fetch("https://player6backendweb.com/v1/game/makeSelection", {
        return fetch("http://localhost:3000/v1/game/makeSelection", {
            "headers": {
                "accept": "*/*",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site"
            },
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": JSON.stringify({gameID: thisGameID, userID: uid, playerSelected: playerSelected}),
            "method": "POST",
            "mode": "cors"
        }).then(response => {
            return response.json().then(data => {
                currentSelection = data.playerSelection;
                socket.emit('player selected', {gameID: thisGameID, userID: uid, playerSelected: playerSelected, playerSelection: currentSelection}); 
                console.log(currentSelection);
                if(data.playerSelection.user1.length >= 6 && data.playerSelection.user2.length >= 6) {
                    showPlayerSelectionCompletedOverlay();
                    console.log("Player selection completed")
                }
                console.log(data);
                showOpponentSelectingPlayerOverlay();
                return data.playerSelected;
            }).catch(err => {
                return null
            });
        }).catch( err => {
            console.log('Fetch Error :-S', err);
            return null;
        });
}

const removeCard = (name) => {
    for (let j = 1; j <=11; j++) {
        if($(`#card-left-${j}`).text() === name) {
            console.log("Removing " + name);
            $(`#card-left-${j}`).remove();
            $(`#faq-card-left-${j}`).remove();
            break;
        }
        if($(`#card-right-${j}`).text() === name) {
            console.log("Removing " + name);
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
    console.log("added " + which + " - " + side);
}


const hideAllOverlays = () => {
    clearInterval(timer);
    hidePlayerSelectionCompletedOverlay(); // Player Selection Completed Overlay
    hideOpponentSelectingPlayerOverlay(); // Opponent choosing...
    hideLoadingOverlay(); // Loading... Hold 
    hideModal(); // Are You sure?
}

const hideDrawersInSmallResolution = () => {
    $("body > div.div-block-52 > div.faq-wrap > div.faq-container").css("z-index", "-1");
}

const showDrawersInSmallResolution = () => {
    $("body > div.div-block-52 > div.faq-wrap > div.faq-container").css("z-index", "auto");
}

const hideModal = () => {
    $("#modal-parent").css("display", "none");
}

const showPlayerSelectionCompletedOverlay = () => {
    hideAllOverlays();
    hideDrawersInSmallResolution();
    stopCountdown();
    setTimeout( () => $("body > div.div-block-53").css("display", "block"), 200);
    clearInterval(timer);
}

const hidePlayerSelectionCompletedOverlay = () => {
    $("body > div.div-block-53").css("display", "none");
}

var timer = null;
const showOpponentSelectingPlayerOverlay = () => {
    hideAllOverlays();
    stopCountdown();
    $("#js-clock-seconds").text(60);
    var i = 59;
    timer = setInterval(() => {
        $("#js-clock-seconds").text(i);
        i = i-1;
        if(i == 0) {
            clearInterval(timer);
            hideOpponentSelectingPlayerOverlay();
        };
    }, 1000)
    $("#screen-freeze").css("display", "block");
}

const hideOpponentSelectingPlayerOverlay = () => {
    $("#screen-freeze").css("display", "none");
    clearInterval(timer);
}

const showLoadingOverlay = () => {
    hideAllOverlays();
    stopCountdown();
    $("body > div.text-wrapper-2.loading").css("display", "block");
}

const hideLoadingOverlay = () => {
    $("body > div.text-wrapper-2.loading").css("display", "none");
}

var mainCountdown;
function startCountdown() { // starts a countdown for the main screen timer, and on its time out, selects a null player for this player (NaP)
    var countdownSeconds = 59;
    mainCountdown = setInterval(async () => {
        if(countdownSeconds >= 10 && countdownSeconds < 60) {
            $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:${countdownSeconds}`);
        } else if (countdownSeconds < 10 && countdownSeconds > 0 ){
            $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:0${countdownSeconds}`);
        }
        if (countdownSeconds === 0) {
            stopCountdown();
            addCard("my-team", "- Turn Missed -");
            console.log("- Turn Missed -");
            currentSelection = await makeSelection("- Turn Missed -");
        }
        countdownSeconds = countdownSeconds - 1;
    }, 1000);
}

function stopCountdown() {
    $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-47 > div.text-block-18").text(`00:00`);
    clearInterval(mainCountdown);
}

const showDrawers = () => {
    showDrawersInSmallResolution();
    hideAllOverlays();
    stopCountdown();
    startCountdown();
    $("body > div.div-block-52").css("display", "block");
}
const hideDrawers = () => {
    stopCountdown();
    $("body > div.div-block-52").css("display", "none");
}