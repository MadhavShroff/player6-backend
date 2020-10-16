$(document).ready(() => {
    MemberStack.onReady.then(async function(member) {
        const metadata = await member.getMetaData();
        $("#toss-result").text(`${matchCards[metadata.gameState.matchID].tossResults} won the toss.`)
        if(metadata.gameState.tossSelection === matchCards[metadata.gameState.matchID].tossResults) {
            $("#toss-result-description").text("You are the winner of the toss! You get first pick. Proceed to Player Selection.");
            metadata.gameState.tossWinner = "Me";
            member.updateMetaData(metadata);
        } else { // Second
            $("#toss-result-description").text("You have lost the toss :( You get second pick. Proceed to Player Selection.");
            metadata.gameState.tossWinner = "Opponent";
            member.updateMetaData(metadata);
        }
    });
})