FROM node:12-slim

WORKDIR /usr/src/app
COPY package.json .
RUN yarn install

# ENV GRAPH_ACCESS_TOKEN
# ENV FeedFactory
# ENV SimpleGriefingFactory
# ENV CountdownGriefingFactory
# ENV CountdownGriefingEscrowFactory
ENV network local
CMD ["sh", "-c", "yarn deploy-${network}"]
# CMD ["sh", "-c", "yarn deploy-${network}", "&&", ]

COPY . .