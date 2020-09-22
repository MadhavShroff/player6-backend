$(document).ready(() => {
    $(".product-card-1 > a").click((event) => clickListener(event, 1));
    $(".product-card-2 > a").click((event) => clickListener(event, 2));
    $(".product-card-3 > a").click((event) => clickListener(event, 3));
    $(".product-card-4 > a").click((event) => clickListener(event, 4));
    $(".product-card-5 > a").click((event) => clickListener(event, 5));
    $(".product-card-1 > a").click((event) => clickListener(event, 6));
});

var clickListener = (event, gameObj) => {
    event.preventDefault();
    console.log("Clicked Button with match id: " + gameObj);
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
        metad.gameState = {...metad.gameState, matchID: gameObj};
        metad.userInfo = {email: member["email"], memID: member["id"], name: member["name"], phone: member["phone-number"]}
  	  	member.updateMetaData(metad).then(() => {
            fetch("http://localhost:3000/v1/game/createOrJoinGame", {
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
                "body": JSON.stringify(metad),
                "method": "POST",
                "mode": "cors"
            }).then(response => {
                response.json().then(data => {
                    console.log(data);
                    if(data.status === "Waiting" || data.status === "Still Waiting") {
                        metad.gameState.status = "Waiting";
                        metad.gameState.joined = "First";
                        metad.gameState.pendingID = data.pendingGameID;
                        member.updateMetaData(metad).then(() => {
                            alert("Game room created. \nYou are the first player here. \nChoose a team!");
                            window.location = "/toss-selection/toss-selection";
                        });
                    }
                    if(data.status === "Paired") {      // Paired with waiting player, second to arrive
                        metad.gameState.status = "Paired";
                        metad.gameState.joined = "Second";
                        metad.gameState.user1 = data.user1;
                        metad.gameState.gameID = data.gameID;
                        $("body > div:nth-child(4) > div > div:nth-child(1)").text("Found MGame!");
                        member.updateMetaData(metad).then(() => {
                            alert("Paired with opponent!\n You are second in the room, wait for your opponent to choose a team for the toss\n Your opponent is : " + data.user1.name);
                            window.location = "/toss-selection/toss-selection-results";
                        });
                    }
                })
            }).catch( err => {
                console.log('Fetch Error :-S', err);
            });
   	  	});
    });
};
