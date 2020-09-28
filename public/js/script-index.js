$(document).ready(() => {
      fetch("https://player6backendweb.com/v1/upcoming/upcoming-three", {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).then(response => {
            response.json().then( data => {
                //TODO: insert fetched values into frontend for upcoming three page
                console.log(data);
            })
        }).catch( err => {
            console.log('Fetch Error :-S', err);
        });
      $('#upcoming-heading-1').text("Hello Players");
    });
