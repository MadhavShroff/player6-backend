var $div = $("<div>", {"class": "text-block-17"});
var $a = $("<a>", {id: "refresh-page", "href":""});
$a.text("Refresh");
$div.append($a)

let metadata;
//Refresh click action

async function checkForOpponent(id, tossSel, userNum, matchID) {
    if(id == null) return;
    fetch("https://player6backendweb.com/v1/game/getGame", {
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
                "body": JSON.stringify({pendingID: id, tossSelection: tossSel, userNum: userNum, teams:[matchCards[matchID].team1abbr, matchCards[matchID].team2abbr]}),
                "method": "POST",
                "mode": "cors"
        }).then(response => {
            response.json().then(data => {
                console.log(data);
                if(data.isData) {
                    MemberStack.onReady.then(async function(member) {
                        const metad = await member.getMetaData();
                        metad.gameState.user2 = data.user2;
                        metad.gameState.gameID = data.gameID;
                        metad.gameState.pendingID = null;
                        metad.gameState.status = "Paired";
                        metad.gameState.tossSelection = data.tossSelection;
                        member.updateMetaData(metad).then(() => {
                            refreshData(metad, false);
                        });
                        metadata = metad;
                    });
                }   
            });
        }).catch( err => {
            console.log('Fetch Error :-S', err);
        });
}

$(document).ready(() => {
    MemberStack.onReady.then(async function(member) {
        metadata = await member.getMetaData();
        refreshData(metadata, true);
        $a.click(async function(event) { // Refresh button click listener. 
            event.preventDefault();
            refreshData(metadata, true);
        })
        setInterval(() => {
            refreshData(metadata, true);
        }, 15000);
    });
});

function refreshData(metad, check) { 
    var id = null;
    if(metad.gameState.pendingID == null) {
        if(metad.gameState.gameID != null) {
            id = metad.gameState.gameID
        }
    } else {
        id = metad.gameState.pendingID
    }
    //determine user number
    if(id != null && check) checkForOpponent(id, metad.gameState.tossSelection, metad.gameState.joined, metad.gameState.matchID);
    $("body > div.container-5.w-container").text("");
    appendString("Toss Results: " + "Waiting...")
    if("tossSelection" in metad.gameState) {
        if(metad.gameState.tossSelection != "undefined")
            appendString("Team Chosen: " + metad.gameState.tossSelection);
        else 
            appendString("Team Chosen: " + "Waiting for Opponent to choose team...");
    } else {
        appendString("Team Chosen: " + "Waiting for Opponent to choose team...");
    }
    appendString("Contest Chosen: " + metad.gameState.contestChosen);
    appendString("Match Type: " + metad.gameState.gameType);
    appendString("Match: " + matchCards[metad.gameState.matchID].team1abbr + " vs " + matchCards[metad.gameState.matchID].team2abbr);
    if("gameID" in metad.gameState) {
        appendString("Game room ID: " + metad.gameState.gameID);
    } else if(metad.gameState.pendingID != null) {
        appendString("Game room ID(pending): " + metad.gameState.pendingID);
    }
    var opponent = "Waiting...";
    if("user1" in metad.gameState) {
        opponent = metad.gameState.user1.name;
    } else if ("user2" in metad.gameState) {
        opponent = metad.gameState.user2.name;
    }
    appendString("Opponent: " + opponent);
    $("body > div.container-5.w-container").append($div);
}    

function appendString(s) {
    var $div = $("<div>", {"class": "text-block-17"});
    $div.text(s);
    $("body > div.container-5.w-container").append($div);
}