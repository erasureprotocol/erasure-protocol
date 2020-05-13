FROM node:12-slim

WORKDIR /testenv
COPY package.json .
RUN yarn install

CMD node deploy.js

COPY . .