$(document).ready(() => {
	$("#t-20").click((event) => clickListener(event, "t20"));
	$("#odi").click((event) => clickListener(event, "odi"));
	$("#test").click((event) => clickListener(event, "test"));
});

var clickListener = (event, game) => {
	event.preventDefault();
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
		metad.gameState = {...metad.gameState, gameType: game};
  	  	member.updateMetaData(metad).then(() => {
   	  		window.location = "/select-match/select-match-t20-testing";
   	  	});
    });
};
