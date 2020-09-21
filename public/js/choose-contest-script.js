$(document).ready(() => {
	MemberStack.onReady.then(async function(member) {
  	  	member.updateMetaData({gameState: null})
	}); // empty gameState when reach choose-contest page
	$("#contest-five").click((event) => clickListener(event, "Five"));
	$("#contest-ten").click((event) => clickListener(event, "Ten"));
	$("#contest-twenty").click((event) => clickListener(event, "Twenty"));
	$("#contest-free").click((event) => clickListener(event, "Free"));
});

var clickListener = (event, contest) => {
	event.preventDefault();
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
		metad.gameState = {...metad.gameState, contestChosen: contest};
  	  	member.updateMetaData(metad).then(() => {
   	  		window.location = "/select-match/select-match";
   	  	});
    });
};