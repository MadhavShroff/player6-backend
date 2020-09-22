$(document).ready(() => {
    $(".product-card-1 > a").click((event) => clickListener(event, {
        gameID: 1,
        team1abbr: "RCB",
        team1: "Royal Challengers Bangalore",
        team2abbr: "SRH",
        team2: "Sun Risers Hyderabad",
        match_time: "7:30 PM", 
        date: "21 September 2020",
        entryRequirement: 1250
    }));
    $(".product-card-2 > a").click((event) => clickListener(event, {
        gameID: 2,
        team1abbr: "CSK",
        team1: "Chennai Super Kings",
        team2abbr: "RR",
        team2: "Rajasthan Royals",
        match_time: "7:30 PM", 
        date: "22 September 2020",
        entryRequirement: 1250
    }));
    $(".product-card-3 > a").click((event) => clickListener(event, {
        gameID: 3,
        team1abbr: "KKR",
        team1: "Kolkata Knight Riders",
        team2abbr: "MI",
        team2: "Mumbai Indians",
        match_time: "7:30 PM", 
        date: "23 September 2020",
        entryRequirement: 1250
    }));
    $(".product-card-4 > a").click((event) => clickListener(event, {
        gameID: 4,
        team1abbr: "RCB",
        team1: "Royal Challengers Bangalore",
        team2abbr: "KXIP",
        team2: "Kings XI Punjab",
        match_time: "7:30 PM", 
        date: "24 September 2020",
        entryRequirement: 1250
    }));
    $(".product-card-5 > a").click((event) => clickListener(event, {
        gameID: 5,
        team1abbr: "CSK",
        team1: "Chennai Super Kings",
        team2abbr: "DC",
        team2: "Delhi Capitals",
        match_time: "7:30 PM", 
        date: "22 September 2020",
        entryRequirement: 1250
    }));
    $(".product-card-1 > a").click((event) => clickListener(event, {
        gameID: 6,
        team1abbr: "SRH",
        team1: "Sun Risers Hyderabad",
        team2abbr: "KKR",
        team2: "Kolkata Knight Riders",
        match_time: "7:30 PM", 
        date: "22 September 2020",
        entryRequirement: 1250
    }));
});

var clickListener = (event, gameObj) => {
    event.preventDefault();
    console.log("Clicked Button with match id: " + gameObj);
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
        metad.gameState = {...metad.gameState, game: gameObj};
        metad.userInfo = {email: member["email"], memID: member["id"], name: member["name"], phone: member["phone-number"]}
  	  	member.updateMetaData(metad).then(() => {
            fetch("http://localhost:3000/v1/game/getGame", {
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
                response.json().then( data => {
                    if(data.status === "Waiting") {
                        alert("Game room created. \nYou are the first player here. \nChoose a team!");
                        window.location = "/toss-selection/toss-selection";
                        member.updateMetaData({"gameState": {...metad.gameState, "status": "Waiting"}})
                    }
                    if(data.status === "Still Waiting") {
                        alert("Already in pending match\n Please wait until we find you an opponent");
                        $("body > div:nth-child(4) > div > div:nth-child(1)").text("Still Waiting for the other player...");
                        member.updateMetaData({"gameState": {...metad.gameState, "status": "Waiting"}})
                    }
                    if(data.status === "Paired") {      // Paired with waiting player, second to arrive
                        alert("Paired with opponent!\n Your opponent is : " + data.user1.name);
                        window.location = "/toss-selection/toss-selection";
                        $("body > div:nth-child(4) > div > div:nth-child(1)").text("Found Match!");
                        console.log(data)
                        member.updateMetaData({"gameState": {...metad.gameState, "status": "Paired", user1: data.user1}})
                    }
                    console.log(data);
                })
            }).catch( err => {
                console.log('Fetch Error :-S', err);
            });
   	  	});
    });
};
