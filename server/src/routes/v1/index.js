const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/docs', docsRoute);
router.get('/static', (req, res) => {
    res.sendFile("./static/script.js", { root: __dirname });
});

module.exports = router;
