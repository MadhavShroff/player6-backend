MemberStack.onReady.then(async function(member) {
  console.log(member);
  if(member.loggedIn){
    socket.on("account details", (data) => {
      $("#nav-coins").text(`${data.coins} COINS`);
      $("#nav-points").text(`${data.points} POINTS`);
    });
    socket.emit("get account", {
      "memID" : member["id"],
      "email" : member["email"],
      "name" : member["name"]
    });
  }
});