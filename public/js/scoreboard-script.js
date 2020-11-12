$(document).ready(async () => {
    await fetchMatchData();
    MemberStack.onReady.then(async function(member) {
        var metadata = await member.getMetaData();
        var selection = await getPlayerSelection(metadata.gameState.gameID);
        for(var i=1; i<=6; i++) {
            $(`#player-left-${i}`).text("Waiting...");
            $(`#player-right-${i}`).text("Waiting...");
        }
        if(metadata.gameState.joined === "First") {
            setName(metadata.gameState.user2.name);
            let a = 1;
            $.each(selection.user1, (idx, name) => {
                if(name !== "- Turn Missed -") {
                    $(`#player-left-${a}`).text(name);
                    a = a+1;
                }
            });
            
            a = 1;
            $.each(selection.user2, (idx, name) => {
                if(name !== "- Turn Missed -") {
                    $(`#player-right-${a}`).text(name);
                    a = a+1;
                }
            });
        } else if(metadata.gameState.joined === "Second") {
            setName(metadata.gameState.user1.name);
            let a = 1;
            $.each(selection.user1, (idx, name) => {
                if(name !== "- Turn Missed -") {
                    $(`#player-right-${a}`).text(name);
                    a = a+1;
                }
            });
            a = 1;
            $.each(selection.user2, (idx, name) => {
                if(name !== "- Turn Missed -") {
                    $(`#player-left-${a}`).text(name);
                    a = a+1;
                }
            });
        } else {
            setName("Opponent");
            console.log("Error: Opponent name not defined!");
        }
    });
})

const setName = (name) => {
    $("body > div.container-7.w-container > div.section-13._2 > h1").text(`${name}'s Team`);
}

async function getPlayerSelection(gameID) {
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
            "body": JSON.stringify({"gameID": gameID}),
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