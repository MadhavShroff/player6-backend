# player6-backend

Node backend for player6cricket.com

## /public
Contains static JS files to integrate webflow with backend. 

## /admin-panel
Contains static JS files to communicate with the server.

## /server
Contains ExpressJS server files, with socket logic in index.js

To start the server : 
1. clone the repo
2. in /server create the .env file to hold config and secret keys :
```
PORT=3000
NODE_ENV=development
MONGODB_URL=***********************************
JWT_SECRET=**************
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
```
3. Install dependencies
```bash
$npm install

or 

$yarn install
```
4. start server : (Node v14.1
```bash
$pm2 start src/index.js

or 

$node src/index.js

or

(For development) $nodemon src/index.js
```
