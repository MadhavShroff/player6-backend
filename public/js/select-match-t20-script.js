$(document).ready(() => {
    $(".product-card-1 > a").click((event) => clickListener(event, 1));
    $(".product-card-2 > a").click((event) => clickListener(event, 2));
    $(".product-card-3 > a").click((event) => clickListener(event, 3));
    $(".product-card-4 > a").click((event) => clickListener(event, 4));
    $(".product-card-5 > a").click((event) => clickListener(event, 5));
    $(".product-card-1 > a").click((event) => clickListener(event, 6));
    $('body > div:nth-child(4) > div > div:nth-child(1)').text("");
    $("body > div:nth-child(4) > div > div.text-block-16.found-match").text("");
});

var clickListener = (event, gameObj) => {
    event.preventDefault();
    console.log("Clicked Button with match id: " + gameObj);
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
        metad.gameState = {...metad.gameState, matchID: gameObj};
        metad.userInfo = {email: member["email"], memID: member["id"], name: member["name"], phone: member["phone-number"]}
  	  	member.updateMetaData(metad).then(() => {
            lookingStart();
            fetch("https://player6backendweb.com/v1/game/createOrJoinGame", {
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
                            lookingStop("You are the first player in the room. Continue to Toss Selection!");
                            setTimeout(() => {
                                window.location = "/toss-selection/toss-selection";
                            }, 3000);
                        });
                    } else if(data.status === "Paired") {      
                        metad.gameState.status = "Paired";
                        metad.gameState.joined = "Second";
                        metad.gameState.user1 = data.user1;
                        metad.gameState.gameID = data.gameID;
                        $("body > div:nth-child(4) > div > div:nth-child(1)").text("Found Game!");
                        member.updateMetaData(metad).then(() => {
                            lookingStop("Paired with opponent! You are second in the room, wait for opponent's Toss Selection. Your opponent is : " + data.user1.name);
                            setTimeout(() => {
                                window.location = "/toss-selection/toss-selection-results";
                            }, 3000);
                        });
                    } else {
                        lookingStop("Internal Server Error. Please try again or contact administrator");
                        console.log("Internal Server Error!!");
                    }
                })
            }).catch( err => {
                console.log('Fetch Error :-S', err);
            });
   	  	});
    });
};

var isStop = false;
dots = ".";
oneDot = ".";
var i = 0;

function lookingStart() {    
    setTimeout(function() {  
        $('body > div:nth-child(4) > div > div:nth-child(1)').text("Looking for Games" + dots);
        dots = dots + oneDot; i++;
        if(i == 4) {
            i = 0;
            dots = "";
        }
        if (!isStop) { 
            lookingStart();
        }
    }, 500);
}

function lookingStop(someText) {
    isStop = true;
    $('body > div:nth-child(4) > div > div:nth-child(1)').text(someText);
}