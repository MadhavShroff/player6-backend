$(document).ready(async () => {
    await fetchMatchData();
    MemberStack.onReady.then(async function(member) {
        const metad = await member.getMetaData();
        $("#team-2").text(matchCards[metad.gameState.matchID].team2abbr);
        $("#team-1").text(matchCards[metad.gameState.matchID].team1abbr);
        $("#team-2").click((event) => {
            event.preventDefault();
            metad.gameState.tossSelection = matchCards[metad.gameState.matchID].team2abbr;
            member.updateMetaData(metad).then(() => {
                window.location = "/toss-selection/toss-selection-results";
            });
        });
        $("#team-1").click((event) => {
            event.preventDefault();
            metad.gameState.tossSelection = matchCards[metad.gameState.matchID].team1abbr;
            member.updateMetaData(metad).then(() => {
                window.location = "/toss-selection/toss-selection-results";
            });
        });
    });
});