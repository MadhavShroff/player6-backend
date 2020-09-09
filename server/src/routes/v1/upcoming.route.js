const express = require('express');

const router = express.Router();
const axios = require('axios');

router.get('/upcoming-three', (req, res) => {
  axios
    .get(`https://cricapi.com/api/matches?apikey=nbPnAktEZbV7hEUVcSZEnJiwLJk2`)
    .then((response) => {
      const threeMatches = response.data.matches
        .sort((match1, match2) => {
          return Date.parse(match1.dateTimeGMT) - Date.parse(match2.dateTimeGMT);
        })
        .filter((match, index) => {
          return index < 3;
        });
      res.send({ result: 'Success', threeMatches });
      console.log(`API: called cricAPI at /upcoming/upcoming-three, Credits Left: ${response.data.creditsLeft}`);
    })
    .catch((error) => {
      res.send({ result: 'Error. Could not fetch matches' });
      console.trace(error);
    });
});

module.exports = router;
