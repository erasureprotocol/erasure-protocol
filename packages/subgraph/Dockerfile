FROM node:12-slim

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update \
    && apt-get install -y git \
    && apt-get install -y ca-certificates wget

# Clone and install wait-for-it
WORKDIR /usr/local/bin
RUN wget https://raw.githubusercontent.com/derekmahar/docker-compose-wait-for-file/master/ubuntu-wait-for-file/wait-for-file.sh \
    && chmod +x /usr/local/bin/wait-for-file.sh

WORKDIR /subgraph
COPY package.json .
COPY yarn.lock .
RUN yarn install

ENV graph_node graph-node:8020
ENV ipfs ipfs:5001
ENV version v130
ENV network local

CMD wait-for-file.sh /data/config.json \
      node gen-subgraph.js ${network} \
    && yarn graph codegen \
    && yarn graph create --node http://${graph_node} erasureprotocol/${version} \ 
    && yarn graph deploy --node http://${graph_node} --ipfs http://${ipfs} erasureprotocol/${version}

COPY . .