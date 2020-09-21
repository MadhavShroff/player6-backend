MemberStack.onReady.then(async function(member) {
  console.log(member);
  if(member.loggedIn){
    const metadata = await member.getMetaData();
    console.log(metadata);
  }
});