$(document).ready(() => {
    $(".product-card-1 > a").click((event) => clickListener(event, 1));
    $(".product-card-2 > a").click((event) => clickListener(event, 2));
    $(".product-card-3 > a").click((event) => clickListener(event, 3));
    $(".product-card-4 > a").click((event) => clickListener(event, 4));
    $(".product-card-5 > a").click((event) => clickListener(event, 5));
    $(".product-card-1 > a").click((event) => clickListener(event, 6));
});

var clickListener = (event, game) => {
	event.preventDefault();
	MemberStack.onReady.then(async function(member) {
		const metad = await member.getMetaData();
		metad.gameState = {...metad.gameState, gameID: game};
  	  	member.updateMetaData(metad).then(() => {
            // fetch("/v1/upcoming/upcoming-three", {
            //     method: "GET",
            //     headers: {
            //         'Accept': 'application/json',
            //         'Content-Type': 'application/json'
            //     },
            // }).then(response => {
            //     response.json().then( data => {
            //         //TODO: insert fetched values into frontend for upcoming three page
            //         console.log(data);
            //     })
            // }).catch( err => {
            //     console.log('Fetch Error :-S', err);
            // });
   	  	});
    });
};
