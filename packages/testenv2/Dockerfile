FROM node:12-slim

WORKDIR /usr/src/app
COPY package.json .
RUN yarn install

EXPOSE 8545
CMD [ "yarn", "deploy" ]

COPY . .