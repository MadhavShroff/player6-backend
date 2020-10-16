/*
    feature set
    on page load:
        get player selection, turn to pick
            if player selection is completed, ie 6-6 players chosen, show completed overlay
            else get turn, using turn, show or hide overlay

*/

var thisGameID = null;
var selection = null;
var uname = null;
var uid = null;
var firstOrSecond = null;
$(document).ready(() => {
    showLoadingOverlay();
    console.log("Player Selection: ready() callback");
    MemberStack.onReady.then(async function(member) {
        var metadata = await member.getMetaData()
        thisGameID = metadata.gameState.gameID;     // get gameID
        uid = metadata.userInfo.memID;
        firstOrSecond = metadata.gameState.joined;
        selection = await getPlayerSelection()      // get player selection so far, print to console
        console.log(selection);
        console.log(uid);
        setCardsInDrawers(selection);
        if(metadata.gameState.joined === "First") {
            setName(metadata.gameState.user2.name);
        } else if(metadata.gameState.joined === "Second") {
            setName(metadata.gameState.user1.name);
        } else {
            setName("Opponent");
            console.log("Error: Opponent name not defined!");
        }
        if(myTurn(metadata.gameState.tossWinner, selection)) {
            showDrawers();
        } else {
            showOpponentSelectingPlayerOverlay();
        }
        for (let j = 1; j <=11; j++) {
            registerClickEvent($(`#card-left-${j}`), metadata);
            registerClickEvent($(`#card-right-${j}`), metadata);
            registerClickEvent($(`#faq-card-left-${j}`), metadata);
            registerClickEvent($(`#faq-card-right-${j}`), metadata);
            $(`#card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);
            $(`#faq-card-left-${j}`).text(matchCards[metadata.gameState.matchID].players.team1[j-1]);
            $(`#faq-card-right-${j}`).text(matchCards[metadata.gameState.matchID].players.team2[j-1]);
        }
        socket.emit('arrived at player selection', thisGameID);
        socket.on('player update', data => {
            console.log("Opponent made selection"); console.log(data);
            if(!(data.userID === uid)) { // if not this user
                removeCard(data.playerSelected);
                addCard("opp-team", data.playerSelected);
                showDrawers();
            } else {
                showOpponentSelectingPlayerOverlay();
            } // if this user, made a selection, do nothing
        })
    })
})

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
                console.log(data);
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

function registerClickEvent(card, metad) {
    card.click((event) => onPlayerSelect(event, card.text(), metad));
}

async function onPlayerSelect(event, playerSelected, metad) {
    event.preventDefault();
    removeCard(playerSelected);
    addCard("myteam", playerSelected);
    console.log(playerSelected);
    selection = await makeSelection(playerSelected);
}

function setCardsInDrawers(sel) {
    $("#opp-team")[0].innerHTML = "";
    $("#myteam")[0].innerHTML = "";
    if(firstOrSecond === "First") {
        if("user1" in sel)
            sel.user1.forEach(name => {
                removeCard(name);
                addCard("myteam", name)
            })
        if("user2" in sel)
            sel.user2.forEach(name => {
                removeCard(name);
                addCard("opp-team", name)
            })
    } else {
        if("user1" in sel)
            sel.user1.forEach(name => {
                removeCard(name);
                addCard("opp-team", name)
            })
        if("user2" in sel)
            sel.user2.forEach(name => {
                removeCard(name);
                addCard("myteam", name)
            })
    }
}

function makeSelection(playerSelected) { // returns the updated player selection, after inserting new selection in db
    // fetch("https://player6backendweb.com/v1/game/makeSelection", {
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
            socket.emit('player selected', {gameID: thisGameID, userID: uid, playerSelected: playerSelected});
            return response.json().then(data => {
                if(data.playerSelection.user1.length >= 6 && data.playerSelection.user2.length >= 6) {
                    showPlayerSelectionCompletedOverlay();
                    console.log("Player selection completed")
                }
                setCardsInDrawers(data.playerSelection);
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


// function getPlayerSelection(gameID) {
//     fetch("https://player6backendweb.com/v1/game/getPlayerSelection", {
//     // fetch("http://localhost:3000/v1/game/getPlayerSelection", {
//         "headers": {
//             "accept": "*/*",
//             "cache-control": "no-cache",
//             "content-type": "application/json",
//             "pragma": "no-cache",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "cross-site"
//         },
//         "referrerPolicy": "no-referrer-when-downgrade",
//         "body": JSON.stringify({"gameID": gameID}),
//         "method": "POST",
//         "mode": "cors"
//     }).then(response => {
//         response.json().then(data => {
//             console.log(data);
//             if(data.isData) {
//                 return 
//             }
//         });
//     }).catch( err => {
//         console.log('Fetch Error :-S', err);
//     });
// }


// var gameID;
// $(document).ready(() => {
//     hideCompletedOverlay();
//     MemberStack.onReady.then(async function(member) {
//         const metad = await member.getMetaData();
//         gameID = metad.gameState.gameID;
//         var name;
//         if(metad.gameState.joined === "First") {
//             name = metad.gameState.user2.name;
//         } else if(metad.gameState.joined === "Second") {
//             name = metad.gameState.user1.name;
//         } else {
//             name = "Opponent"
//             console.log("Error: Opponent name not defined!");
//         }
//         $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-14").text(`${name}'s Team`);
//         $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-15").text(`${name}'s team will appear in this box`);
//         //TODO:Insert player info from match-data into frontend
        // for (let j = 1; j <=11; j++) {
        //     registerClickEvent($(`#card-left-${j}`), metad);
        //     registerClickEvent($(`#card-right-${j}`), metad);
        //     registerClickEvent($(`#faq-card-left-${j}`), metad);
        //     registerClickEvent($(`#faq-card-right-${j}`), metad);
        // }
//         refreshPlayerSelection(gameID);
//         if(metad.gameState.tossWinner === "Me") {
//             hideOverlay();
//         } else {
//             showOverlay();
//         }
//         socket.emit('arrived at player selection', metad.gameState.gameID);
//         socket.on('player update', data => {
//             console.log("Opponent made selection");
//             console.log(data);
//             if(!(data.userID === metad.userInfo.memID)) { // if not this user
//                 removeCard(data.playerSelected);
//                 addCard("opp-team", data.playerSelected);
//                 hideOverlay();
//             } else; // if this user, made a selection, do nothing
//         })
//     });
// });


// function refreshPlayerSelection(gameID) {
//     fetch("https://player6backendweb.com/v1/game/getPlayerSelection", {
//     // fetch("http://localhost:3000/v1/game/getPlayerSelection", {
//         "headers": {
//             "accept": "*/*",
//             "cache-control": "no-cache",
//             "content-type": "application/json",
//             "pragma": "no-cache",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "cross-site"
//         },
//         "referrerPolicy": "no-referrer-when-downgrade",
//         "body": JSON.stringify({"gameID": gameID}),
//         "method": "POST",
//         "mode": "cors"
//     }).then(response => {
//         response.json().then(data => {
//             console.log(data);
//             if(data.isData) {
//                 console.log(data);
//                 $("#opp-team")[0].innerHTML = "";
//                 $("#myteam")[0].innerHTML = "";
//                 if(metad.gameState.joined === "First") {
//                     if("user1" in data.playerSelection) {
//                         data.playerSelection.user1.forEach(name => {
//                             removeCard(name);
//                             addCard("myteam", name)
//                         })
//                     }
//                     if("user2" in data.playerSelection) {
//                         data.playerSelection.user2.forEach(name => {
//                             removeCard(name);
//                             addCard("opp-team", name)
//                         })
//                     }
//                 } else {
//                     if("user1" in data.playerSelection) {
//                         data.playerSelection.user1.forEach(name => {
//                             removeCard(name);
//                             addCard("opp-team", name)
//                         })
//                     }
//                     if("user2" in data.playerSelection) {
//                         data.playerSelection.user2.forEach(name => {
//                             removeCard(name);
//                             addCard("myteam", name)
//                         })
//                     }
//                 }
//                 if(data.playerSelection.user1.length >= 6 && data.playerSelection.user2.length >= 6) {
//                     hideOverlay();
//                     showCompletedOverlay();
//                     console.log("Player selection completed")
//                 }
//             }
//         });
//     }).catch( err => {
//         console.log('Fetch Error :-S', err);
//     });
// }

const removeCard = (name) => {
    $.each($('div').filter(function(){ return $(this).text() === name;}), (index, value) => {value.remove()});
}

const addCard = (side, which) => {
    $div = $("<div>", {"class":"c-card__one"});
    $div.text(which);
    $(`#${side}`).append($div);
}


const hideAllOverlays = () => {
    $("body > div.div-block-53").css("display", "none"); // Player Selection Completed Overlay
    $("body > div.div-block-timer").css("display", "none"); // Opponent choosing...
    $("body > div.text-wrapper-2.loading").css("display", "none"); // Loading... Hold on
}

const showPlayerSelectionCompletedOverlay = () => {
    hideAllOverlays();
    clearInterval(timer);
    $("body > div.div-block-53").css("display", "block");
}

const hidePlayerSelectionCompletedOverlay = () => {
    $("body > div.div-block-53").css("display", "none");
}

var timer = null;
const showOpponentSelectingPlayerOverlay = () => {
    hideAllOverlays();
    $("#js-clock-seconds").text("")
    var i = 60;
    timer = setInterval(() => {
        $("#js-clock-seconds").text(i);
        i = i-1;
        if(i == 0) {
            hideOpponentSelectingPlayerOverlay();
            clearInterval(timer);
        };
    }, 1000)
    $("body > div.div-block-timer").css("display", "block");
}

const hideOpponentSelectingPlayerOverlay = () => {
    $("body > div.div-block-timer").css("display", "none");
    clearInterval(timer);
}

const showLoadingOverlay = () => {
    hideAllOverlays();
    $("body > div.text-wrapper-2.loading").css("display", "block");
}

const hideLoadingOverlay = () => {
    $("body > div.text-wrapper-2.loading").css("display", "none");
}

const showDrawers = () => {
    hideAllOverlays();
    $("body > div.div-block-52").css("display", "block");
}
const hideDrawers = () => {
    $("body > div.div-block-52").css("display", "none");
}