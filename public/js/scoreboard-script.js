$(document).ready(() => {
    MemberStack.onReady.then(async function(member) {
        var metadata = await member.getMetaData();
        var selection = await getPlayerSelection(metadata.gameState.gameID);
        console.log(selection);
        $.each(["one", "two", "three", "four", "five", "six"], (i) => {
            $(`#player-left-${i}`).text("")
        })
        $("#player-left-one").text(selection.user1[0]);
        $("#player-left-two").text(selection.user1[1]);
        $("#player-left-three").text(selection.user1[2]);
        $("#player-left-four").text(selection.user1[3]);
        $("#player-left-five").text(selection.user1[4]);
        $("#player-left-six").text(selection.user1[5]);
        $("#player-right-one").text(selection.user2[0]);
        $("#player-right-two").text(selection.user2[1]);
        $("#player-right-three").text(selection.user2[2]);
        $("#player-right-four").text(selection.user2[3]);
        $("#player-right-five").text(selection.user2[4]);
        $("#player-right-six").text(selection.user2[5]);
    });
})

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