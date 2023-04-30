const { Kafka } = require('kafkajs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());



const kafka = new Kafka({
    clientId: 'api-service',
    brokers: ['kafka:9092'],
    retry: {
        retries: 10,
        initialRetryTime: 1000,
        maxRetryTime: 5000
    }
});

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
})

const run = async () => {
    await producer.connect();
    console.log('Kafka producer connected');
};

app.post('/data', async (req, res) => {
    const { id, name, surname } = req.body;

    // Send the data to Kafka
    await producer.send({
        topic: 'data-topic-insert',
        messages: [{ value: JSON.stringify({ id, name, surname })}]
    });

    res.send('Data sent to Kafka a put');
});

app.post('/delete', async (req, res) => {
    const { id } = req.body;


    await producer.send({
        topic: 'data-topic-delete',
        messages: [{ value: JSON.stringify({ id })}]
    });

    res.send('Data sent to Kafka a delete');
});

app.listen(3000, async function(){
    console.log('api server started');
});
run().catch(console.error);