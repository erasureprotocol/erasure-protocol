FROM node:12-slim

WORKDIR /testenv
COPY package.json .
COPY yarn.lock .
RUN yarn install

EXPOSE 8545
CMD [ "yarn", "deploy" ]

COPY . .