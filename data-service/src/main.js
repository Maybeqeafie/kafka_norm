const {Kafka} = require('kafkajs');
const express = require('express');
const bodyParser = require('body-parser');
const {Pool} = require('pg');
const { runMigrations } = require('node-pg-migrate');
const path = require('path');

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: 'postgres_list',
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

const app = express();
app.use(bodyParser.json());

const migrate = async () => {
    try {
        await runMigrations({
            databaseUrl: pool.options.connectionString,
            dir: path.join('1682875201080-migration1.js', 'migrations'),
            direction: 'up',
            migrationsTable: 'migrations',
        });
        console.log('Migrations ran successfully');
    } catch (error) {
        console.error('Error running migrations', error);
    }
};

migrate();

const kafka = new Kafka({
    clientId: 'data-service',
    brokers: ['kafka:9092'],
    retry: {
        retries: 10,
        initialRetryTime: 1000,
        maxRetryTime: 5000
    }
});

const consumer = kafka.consumer({groupId: 'data-service-group', partition: 0, autoCommit: false});

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({topic: 'data-topic-insert', fromBeginning: true});
    await consumer.subscribe({topic: 'data-topic-delete', fromBeginning: true});


    await consumer.run({

        eachMessage: async ({topic, partition, message}) => {
            if (message) {
                console.log({
                    key: message.key ? message.key.toString() : null,
                    value: message.value ? message.value.toString() : null,
                    headers: message.headers,
                });
            }

            const payload = JSON.parse(message.value.toString());

            if (topic.toString() === 'data-topic-insert') {
                const { id, name, surname } = payload;
                await pool.query('INSERT INTO users (id, name, surname) VALUES ($1, $2, $3)', [id, name, surname]);
                console.log('insert successfully!!!!!!!!!');
            }
            if(topic.toString() === 'data-topic-delete'){
                const { id } = payload;
                await pool.query('DELETE FROM users WHERE id = $1', [id]);
                console.log('delete successfully!!!!!!');
            }

        }
    });
};

app.get('/', function (req, res) {
    pool.query('SELECT * FROM users').then((data) => {
        res.json(data.rows);
    });
});

app.listen(5000, async function () {
    console.log('dataService server started');
});
run().catch(console.error);
