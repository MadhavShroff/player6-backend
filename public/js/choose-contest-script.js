const pointsRequired = {
	"Five" : 1250,
	"Ten" : 1500,
	"Twenty" : 2000,
	"Free" : 0
}

$(document).ready(() => {
	MemberStack.onReady.then(async function(member) {
		member.updateMetaData({gameState: null})
		$("#contest-five").click((event) => clickListener(event, "Five", member)); // empty gameState when reach choose-contest page
		$("#contest-ten").click((event) => clickListener(event, "Ten", member));
		$("#contest-twenty").click((event) => clickListener(event, "Twenty", member));
		$("#contest-free").click((event) => clickListener(event, "Free", member));
	});
});

var clickListener = async (event, contest, member) => {
	event.preventDefault();
	console.log("Clicked");
	socket.off("my points");
	socket.on("my points", (myPoints) => {
		console.log("my points");
		member.updateMetaData({ gameState : { "contestChosen" : contest} }).then(() => {
                   window.location = "/select-match/select-match-testing";
                   });
		
	});
	socket.emit("get my points", member["id"]);
};
