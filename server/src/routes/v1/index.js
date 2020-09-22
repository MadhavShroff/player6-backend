const path = require('path');
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const upcomingRoute = require('./upcoming.route');
const gameLogicRoute = require('./game.route');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/docs', docsRoute);
router.use('/upcoming', upcomingRoute);
router.use('/game', gameLogicRoute);

module.exports = router;

// TODO: Create routes in backend to fetch matches going on, and send to frontend, receive data and display in the matches.
// TODO: nginx reverse proxy, static site caching, load balancing setup (for performance)
// TODO: Change three upcoming matches route from API call to obtaining from cache or store
