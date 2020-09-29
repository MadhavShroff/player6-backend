$(document).ready(() => {
    MemberStack.onReady.then(async function(member) {
        const metad = await member.getMetaData();
        var name;
        if(metad.gameState.joined === "First") name = metad.gameState.user2.name;
        else if(metad.gameState.joined === "Second") name = metad.gameState.user1.name;
        else name = "Opponent"
        $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-14").text(`${name}'s Team`);
        $("body > div.div-block-52 > div.c-wrapper.w-container > div.div-block-48 > div.text-block-15").text(`${name}'s team will appear in this box`);
        // Insert player info from match-data into frontend
        for (let j = 1; j <=11; j++) {
            registerClickEvent($(`#card-left-${j}`), metad);
            registerClickEvent($(`#card-right-${j}`), metad);
        }
        refreshPlayerSelection(metad);
        if(metad.gameState.joined === "First") {
            hideOverlay();
        } else {
            setTimeout(() => {
                hideOverlay();
            }, 30000)
        }
    });
    
});

function refreshPlayerSelection(metad) {
    fetch("https://player6backendweb.com/v1/game/getPlayerSelection", {
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
        "body": JSON.stringify({gameID: metad.gameState.gameID}),
        "method": "POST",
        "mode": "cors"
    }).then(response => {
        response.json().then(data => {
            console.log(data);
            if(data.isData) {
                console.log(data);
                $("#opp-team")[0].innerHTML = "";
                $("#myteam")[0].innerHTML = "";
                if(metad.gameState.joined === "First") {
                    if("user1" in data.playerSelection) {
                        data.playerSelection.user1.forEach(name => {
                            removeCard(name);
                            addCard("myteam", name)
                        })
                    }
                    if("user2" in data.playerSelection) {
                        data.playerSelection.user2.forEach(name => {
                            removeCard(name);
                            addCard("opp-team", name)
                        })
                    }
                } else {
                    if("user1" in data.playerSelection) {
                        data.playerSelection.user1.forEach(name => {
                            removeCard(name);
                            addCard("opp-team", name)
                        })
                    }
                    if("user2" in data.playerSelection) {
                        data.playerSelection.user2.forEach(name => {
                            removeCard(name);
                            addCard("myteam", name)
                        })
                    }
                }
                if(data.playerSelection.isNew)  {
                    hideOverlay();
                    gotData = true;
                }
            }
        });
    }).catch( err => {
        console.log('Fetch Error :-S', err);
    });
}

function getElementsByText(str, tag = 'a') {
    return Array.prototype.slice.call(document.getElementsByTagName(tag)).filter(el => el.textContent.trim() === str.trim());
}

const removeCard = (name) => {
    $(`#right-team > div:contains(${name})`).hide();
    $(`#left-team > div:contains(${name})`).hide();
}

const addCard = (side, which) => {
    $div = $("<div>", {"class":"c-card__one"});
    $div.text(which);
    $(`#${side}`).append($div);
}

const hideOverlay = () => {
    $("body > div.div-block-timer").hide();
}

const showOverlay = () => {
    $("body > div.div-block-timer").show();
}

function registerClickEvent(card, metad) {
    card.click((event) => onPlayerSelect(event, card, metad));
}

var checkTimer = 2000;
var gotData = false;
function startChecking() {
    console.log("Checking...");
    setTimeout(() => {
        if(!gotData) {
            MemberStack.onReady.then(async function(member) {
                console.log("Refreshed Player selection");
                const m = await member.getMetaData();
                refreshPlayerSelection(m);
                startChecking();
            });
        }
    }, checkTimer)
}

function onPlayerSelect(event, card, metad) {
    var player = card.text();
    removeCard(player)
    addCard("myteam", player)
    showOverlay();
    setTimeout(() => {
        hideOverlay();
    }, 60000);
    startChecking();
    console.log(player);
    fetch("https://player6backendweb.com/v1/game/makeSelection", {
    // fetch("http://localhost:3000/v1/game/makeSelection", {
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
        "body": JSON.stringify({gameID: metad.gameState.gameID, userID:metad.userInfo.memID, playerSelected: player, joined: metad.gameState.joined}),
        "method": "POST",
        "mode": "cors"
    }).then(response => {
        response.json().then(data => {
            console.log(data);
        });
    }).catch( err => {
        console.log('Fetch Error :-S', err);
    });
}