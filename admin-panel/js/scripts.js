// const socketEndpoint = 'wss://player6backendweb.com';
const socketEndpoint = 'ws://localhost:3000' 
const socket = io(socketEndpoint, {transports: ['websocket']});
console.log(socket);
$(document).ready( async () => {
    deselectAllOptions();
    await fetchMatchData();
    console.log(matchCards);
    $("#opt-cards").click( () => {
        deselectAllOptions();
        $("#opt-cards").removeClass("btn-secondary").addClass("btn-primary");
        $("#card-column-cards").show();
    });
    $("#opt-points").click( () => {
        deselectAllOptions();
        $("#opt-points").removeClass("btn-secondary").addClass("btn-primary");
        $("#card-column-points").show();
    })
    $.each(matchCards, (idx, match) => {
        console.log(idx);
        $(`#match-name-${idx}`).text("" + match.team1abbr + " vs " + match.team2abbr);
        $(`#match-id-${idx}`).text(match.matchID);
        $(`#team1-${idx}`).text(match.team1);
        $(`#team2-${idx}`).text(match.team2);
        $(`#team1-abbr-${idx}`).text(match.team1abbr);
        $(`#team2-abbr-${idx}`).text(match.team2abbr);
        $(`#date-${idx}`).text(match.date);
        $(`#time-${idx}`).text(match.match_time);
        $(`#entryReq-${idx}`).text(match.entryRequirement);
        $(`#game-started-${idx}`).text(match.gameStarted);
        $(`#toss-${idx}`).text(match.tossResults);
        $(`#winner-${idx}`).text(match.matchWinner);
        $(`#team1-players-${idx}`).innerHTML = "";
        $(`#edit-players-${idx}`).click(() => {
            $.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], (idx, i) => {
                $(`#ep-name-${i}-left`).val(match.players.team1[i-1]);
                $(`#ep-name-${i}-right`).val(match.players.team2[i-1]);
                if(match.players.team1[i-1] in match.scores) {
                    $(`#ep-score-${i}-left`).val(match.scores[match.players.team1[i-1]]);
                } else {
                    $(`#ep-score-${i}-left`).val("");
                }
                if(match.players.team2[i-1] in match.scores) {
                    $(`#ep-score-${i}-right`).val(match.scores[match.players.team2[i-1]]);
                } else {
                    $(`#ep-score-${i}-right`).val("");
                }
            })
            $("#modal-players-submit").unbind();
            $("#modal-players-submit").click(() => {
                var data = {
                    "secretKey" : $("#modal-secret-key-players").val(),
                    "matchID" : match.matchID,
                    players : {
                        team1 : [],
                        team2 : [],
                    }, scores : {}
                };
                $.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], (idx, i) => {
                    data.players.team1.push($(`#ep-name-${idx+1}-left`).val());
                    data.players.team2.push($(`#ep-name-${idx+1}-right`).val());
                    data.scores[$(`#ep-name-${idx+1}-left`).val()] = $(`#ep-score-${idx+1}-left`).val();
                    data.scores[$(`#ep-name-${idx+1}-right`).val()] = $(`#ep-score-${idx+1}-right`).val();
                })
                console.log(data);
                socket.emit("edit players", data);
            });
            $("#editPlayersModal").modal("show");
        });
        $.each(match.players.team1, (index, na) => {
            var st;
            if("scores" in match) { 
                if(na in match.scores) st = `${na} ${match.scores[na]}`;
                else st = na;
            }
            else st = na;
            $div = $("<div>", {"class":"badge badge-pill badge-primary mr-1 p-1", "style" : "font-size : 14px;"}).text(st);
            $(`#team1-players-${idx}`).append($div);
        })
        $.each(match.players.team2, (index, na) => {
            var st;
            if("scores" in match) { 
                if(na in match.scores) st = `${na} ${match.scores[na]}`;
                else st = na;
            }
            else st = na;
            $div = $("<div>", {"class":"badge badge-pill badge-primary mr-1 p-1", "style" : "font-size : 14px;"}).text(st);
            $(`#team2-players-${idx}`).append($div);
        })

        if( match.coverImgHref === null ) $(`#cover-img-${idx}`).text("null");
        else $("#cover-img-1").prepend($('<img>',{id:'coverImg', src:match.coverImgHref, style: "width: 100%"})); // set cover image in grid
        $(`#edit-${idx}`).click(() => {	
            $("#modal-match-name").val("Edit Match - " + match.team1abbr + " vs " + match.team2abbr);
            $(`#modal-match-id`).val(match.matchID);
            $(`#modal-team1`).val(match.team1);
            $(`#modal-team2`).val(match.team2);
            $(`#modal-team1-abbr`).val(match.team1abbr);
            $(`#modal-team2-abbr`).val(match.team2abbr);
            $(`#modal-date`).val(match.date);
            $(`#modal-time`).val(match.match_time);
            $(`#modal-entryReq`).val(match.entryRequirement);
            $(`#modal-cover-img`).val(match.coverImgHref);
            $("#modal-edit-submit").unbind();
            $("#modal-edit-submit").click(() => {
                socket.emit("edit match card", {
                    "secretKey" : $("#modal-secret-key-edit").val(),
                    "matchID" : idx,
                    "team1" : $(`#modal-team1`).val(),
                    "team2" : $(`#modal-team2`).val(),
                    "team1abbr" : $(`#modal-team1-abbr`).val(),
                    "team2abbr" : $(`#modal-team2-abbr`).val(),
                    "date" : $(`#modal-date`).val(),
                    "time" : $(`#modal-time`).val(),
                    "entryRequirement" : $(`#modal-entryReq`).val(),
                    "coverImgHref" : $(`#modal-cover-img`).val(),
                });
            });
            $("#editModal").modal("show");
        })
        $(`#declare-toss-${idx}`).click(() => {
            $("#declare-modal-match-name").text("Declare Toss for " + match.team1abbr + " vs " + match.team2abbr);
            $("#modal-declare-team1 > span").text(match.team1abbr);
            $("#modal-declare-team2 > span").text(match.team2abbr);
            $("#modal-declare-team3 > span").text("Undeclared");
            $("#modal-declare-team1").unbind();
            $("#modal-declare-team2").unbind();
            $("#modal-declare-team3").unbind();
            $("#modal-declare-team1").click(() => { $("#modal-team-chosen").val(match.team1abbr) });
            $("#modal-declare-team2").click(() => { $("#modal-team-chosen").val(match.team2abbr) });
            $("#modal-declare-team3").click(() => { $("#modal-team-chosen").val("Undeclared") });
            $("#modal-declare-submit").unbind();
            $("#modal-declare-submit").click(() => {
                socket.emit("declare toss", {
                    "secretKey" : $("#modal-secret-key-declare").val(),
                    "winner": $("#modal-team-chosen").val(),
                    "matchID" : idx
                });
                console.log("emitted declare toss");
                $("#declareModal").modal("hide");
            });
            $("#declareModal").modal("show");
        })
        $(`#declare-winner-${idx}`).click(() => {
            $("#declare-modal-match-name").text("Declare Winner for " + match.team1abbr + " vs " + match.team2abbr);
            $("#modal-declare-team1 > span").text(match.team1abbr);
            $("#modal-declare-team2 > span").text(match.team2abbr);
            $("#modal-declare-team3 > span").text("Undeclared");
            $("#modal-declare-team1").unbind();
            $("#modal-declare-team2").unbind();
            $("#modal-declare-team3").unbind();
            $("#modal-declare-team1").click(() => { $("#modal-team-chosen").val(match.team1abbr) });
            $("#modal-declare-team2").click(() => { $("#modal-team-chosen").val(match.team2abbr) });
            $("#modal-declare-team3").click(() => { $("#modal-team-chosen").val("Undeclared") });
            $("#modal-declare-submit").unbind();
            $("#modal-declare-submit").click(() => {
                socket.emit("declare winner", {
                    "secretKey" : $("#modal-secret-key-declare").val(),
                    "winner": $("#modal-team-chosen").val(),
                    "matchID" : idx
                });
                console.log("emitted declare winner");
                $("#declareModal").modal("hide");
            });
            $("#declareModal").modal("show");
        })
        $(`#start-game-${idx}`).click(() => {
            $("#declare-modal-match-name").text("Has the game - " + match.team1abbr + " vs " + match.team2abbr + " Started? (First Ball bowled)");
            $("#modal-declare-team1 > span").text("True");
            $("#modal-declare-team2 > span").text("False");
            $("#modal-declare-team3").hide();
            $("#modal-declare-team1").unbind();
            $("#modal-declare-team2").unbind();
            $("#modal-declare-team1").click(() => { $("#modal-team-chosen").val("True") });
            $("#modal-declare-team2").click(() => { $("#modal-team-chosen").val("False") });
            $("#modal-declare-submit").unbind();
            $("#modal-declare-submit").click(() => {
                socket.emit("start game", {
                    "secretKey" : $("#modal-secret-key-declare").val(),
                    "isStart": $("#modal-team-chosen").val(),
                    "matchID" : idx
                });
                console.log("emitted start game");
                $("#declareModal").modal("hide");
                $("#modal-declare-team3").show();
            });
            $("#declareModal").modal("show");
        })
    });
    setTimeout(() => {socket.emit("get user accounts"); } , 1000);
    socket.on("user accounts", (data) => {
        console.log(data);
        $("#points-table > tbody").text("");
        $.each(data, (idx, row) => { // each row
            var $tr = $("<tr>");
            $tr.append($("<th>", {"scope" : "row"}).text(row._id));
            $tr.append($("<td>").text(row.name));
            $tr.append($("<td>").text(row.email));
            $tr.append($("<td>").text(row.points));	
            $tr.append($("<td>").text(row.coins));
            $tr.append(getEditPointsButton(row));
            $("#points-table > tbody").append($tr);
        });
    });
    socket.on("edit points result", (data) =>{
        console.log(data);
        console.log("Got points results");
        if(data.status === "wrong key") {
            alert("Secret key entered is invalid");
        } else if (data.status === "error") {
            alert("Internal Server Error");
        } else if(data.status === "no change made") {
            alert(`No change in points`);
        } else if(data.status === "success") {
            alert(`Successfully modified points`);
        }
        socket.emit("get user accounts");
    });
    socket.on("edit players result", (data) =>{
        console.log(data);
        console.log("Got players results");
        if(data.status === "wrong key") {
            alert("Secret key entered is invalid");
        } else if (data.status === "error") {
            alert("Internal Server Error");
        } else if(data.status === "no change made") {
            alert(`No change was made in player data`);
        } else if(data.status === "success") {
            alert(data.msg);
            window.location = window.location;
        }
    });
    socket.on("declare toss/winner result", (data) => {
        console.log(data);
        console.log("Declare toss/winner results received");
        if(data.status === "wrong key") {
            alert("Secret key entered is invalid");
        } else if (data.status === "error") {
            alert("Internal Server Error");
        } else if(data.status === "no change made") {
            alert(`No change was made`);
        } else if(data.status === "success") {
            alert(data.msg);
            window.location = window.location;
        };
    });
});

const deselectAllOptions = () => {
    $("#card-column-cards").hide();
    $("#card-column-points").hide();
    $.each($("#options").children(), (idx, child) => {
        $(child).removeClass("btn-primary").addClass("btn-secondary");
    });
}

const getEditPointsButton = (row) => {
    return $("<button>", {"type" : "button", "class" : "btn btn-primary m-2 pl-3 pr-3 p-1"}).text("Edit").click(() => {
        $("#modal-points").val(row.points);
        $("#modal-coins").val(row.coins);
        $("#modal-points-submit").unbind();
        $("#modal-points-submit").click(() => {
            socket.emit("edit points", {
                "secretKey" : $("#modal-secret-key-points").val(),
            "points" : $("#modal-points").val() === "" ? "0" : $("#modal-points").val(),
                "memID": row._id,
                "coins" :$("#modal-coins").val() === "" ? "0" : $("#modal-coins").val(),
            });
            console.log("emitted edit points");
            $("#editPointsModal").modal("hide");
        });	
        $("#editPointsModal").modal("show");
    })
}