FROM node:14-slim

WORKDIR /usr/src/app
COPY package.json .
RUN npm install

EXPOSE 8080
CMD [ "npm", "deploy" ]

COPY . .

# FROM graphprotocol/graph-node
# FROM ipfs/go-ipfs