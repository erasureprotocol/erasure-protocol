FROM node:12-slim

WORKDIR /usr/src/app
COPY package.json .
RUN yarn install

CMD [ "yarn", "deploy-local" ]

COPY . .