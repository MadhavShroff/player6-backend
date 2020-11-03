$(document).ready(() => {
    $("body > div.section-9.cta-player-selection > div > div > div").hide();
    MemberStack.onReady.then(async function(member) {
        const metadata = await member.getMetaData();
        $("#toss-result").text(`${matchCards[metadata.gameState.matchID].tossResults} won the toss.`)
        if(metadata.gameState.tossSelection === matchCards[metadata.gameState.matchID].tossResults) {
            $("#toss-result-description").text("You are the winner of the toss! You get first pick. Proceed to Player Selection.");
            metadata.gameState.tossWinner = "Me";
            member.updateMetaData(metadata).then(() => {
                $("body > div.section-9.cta-player-selection > div > div > div").show();
                console.log(metadata); 
            });
            updateTossWinner(metadata.gameState.gameID, metadata.userInfo.memID);
        } else { // Second
            $("#toss-result-description").text("You have lost the toss :( You get second pick. Proceed to Player Selection.");
            metadata.gameState.tossWinner = "Opponent";
            member.updateMetaData(metadata).then(() => {
                $("body > div.section-9.cta-player-selection > div > div > div").show();
                console.log(metadata); 
            });
            updateTossWinner(metadata.gameState.gameID, metadata.userInfo.memID);
        }
    });
})

async function updateTossWinner(gameID, winner) {
    // return fetch("https://player6backendweb.com/v1/game/updateTossWinner", {
        fetch("http://localhost:3000/v1/game/updateTossWinner", {
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
            "body": JSON.stringify({"gameID": gameID, "winner": winner}),
            "method": "POST",
            "mode": "cors"
        }).then(response => {
            response.json().then(data => {
                console.log(data);
            });
        }).catch(err => {
            console.log('Fetch Error :-S', err);
            return null;
        });
}