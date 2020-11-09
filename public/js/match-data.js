var matchCards;
var fetchMatchData = async () => {
    // const response = fetch("https://player6backendweb.com/v1/game/getMatchData", {
    return await fetch("http://localhost:3000/v1/game/getMatchData", {
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
                "method": "GET",
                "mode": "cors"
        }).then(response => {
            return response.json().then(data => {
                matchCards = data;
                return data;
            });
        }).catch( err => {
            console.log('Fetch Error :-S', err);
        });
};
