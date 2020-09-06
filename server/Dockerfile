FROM node:alpine

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app && npm install pm2 -g

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "NODE_ENV=production", "node", "src/index.js"]
