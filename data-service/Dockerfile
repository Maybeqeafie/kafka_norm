FROM node:18-alpine

WORKDIR /app

COPY data-service/package*.json ./

RUN npm install

COPY data-service/src ./src

EXPOSE 5000

CMD [ "node", "src/main.js" ]
