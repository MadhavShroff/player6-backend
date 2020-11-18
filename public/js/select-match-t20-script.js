$(document).ready(async () => {
    // TODO: delete any game objects from pendingGames collection in db, if arrived at this page (delete any empty, abandoned game rooms if they exist)
        // ie if user creates a pending game, and proceeds to either toss selection or results, 
        // and then returns to select-match, the previously created game object in pendingGames should be removed
    await fetchMatchData();
    $.each(matchCards, (idx, match) => {
        $(`#img-${idx}`).css("background-image", match.coverImgHref);
        $(`#match-date-${idx}`).text(match.date);
        $(`#match-name-${idx}`).text(match.team1abbr + " vs " + match.team2abbr);
        $(`#match-time-${idx}`).text(match.match_time);
    })
    $.each([1, 2, 3, 4, 5, 6], (idx, cardNum) => {
        $(`#card-${cardNum}`).click((event) => clickListener(event, cardNum));
    })
    $('.count').each(function () {
        $(this).stop();
    });
    $("body > div.section-19 > div.wrap").hide(); // Hide loading overlay
});

const showLoading = () => { /// Show Loading overlay
    $("body > div.section-19 > div.wrap").show();
    var count = 1;
    var countInterval = setInterval(() => {
        $('.count').text(count);
        if(count >= 100) {
            clearInterval(countInterval);
        }
        count = count + 1;
    }, 150);
}

var clickListener = (event, gameObj) => {
    event.preventDefault();
    showLoading();
    console.log("Clicked Button with match id: " + gameObj);
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
        metad.gameState = {...metad.gameState, matchID: gameObj};
        metad.userInfo = {email: member["email"], memID: member["id"], name: member["name"], phone: member["phone-number"]}
  	  	member.updateMetaData(metad).then(() => {
            // fetch("http://localhost:3000/v1/game/createOrJoinGame", {
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
                            window.location = "/toss-selection/toss-selection";
                        });
                    } else if(data.status === "Paired") {      
                        metad.gameState.status = "Paired";
                        metad.gameState.joined = "Second";
                        metad.gameState.user1 = data.user1;
                        metad.gameState.gameID = data.gameID;
                        $("body > div:nth-child(4) > div > div:nth-child(1)").text("Found Game!");
                        member.updateMetaData(metad).then(() => {
                            lookingStop("Paired with opponent! You are second in the room, wait for opponent's Toss Selection. Your opponent is : " + data.user1.name);
                            window.location = "/toss-selection/toss-selection-results";
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