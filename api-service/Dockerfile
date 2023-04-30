FROM node:18-alpine

WORKDIR /app

COPY api-service/package*.json ./

RUN npm install

COPY api-service/src ./src

EXPOSE 3000

CMD [ "node", "src/main.js" ]
