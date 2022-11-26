import express from 'express';
import _ from 'lodash';
import cors from 'cors';
import axios from 'axios';
import logger from 'node-color-log'
import TelegramBot from 'node-telegram-bot-api';
import { MongoClient, ServerApiVersion } from 'mongodb';
import FlighActivityTracker from './flightActivityTracker.js';

let dbCache = {};
const PORT = 3000;
const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);
const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: { [process.env.AUTH_HEADER_KEY]: process.env.DEDRONE_AUTH_TOKEN }
});
const flyTracker = new FlighActivityTracker(bot, axiosInstance);

const connectToMongo = async () => {
  if (dbCache.client) return Promise.resolve(dbCache);

  const uri = "mongodb+srv://m001-student:m001-mongodb-basics@sandbox.wiznw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

  try {
    await client.connect();
    console.log('CONNECTED TO MONGODB');
  } catch (e) {
    console.log('FAILED CONNECT TO MONGO', e);
  }
  dbCache = { client };

  return Promise.resolve({ client });
}

app.use(express.json());
app.use(cors({ origin: true }));
app.use(async (req, res, next) => {
  await connectToMongo();
  next();
})


app.post('/dedrone', async (req, res) => {
  let alertId = _.get(req, 'body.data.alertId');
  

  if (!alertId) {
    logger.info(`push message does not contain alertId`);
    res.status(428).send('"alertId" field is required');
    return
  }

  const result = await flyTracker.sendMessagesV2(alertId);
  res.send({ result });
});

// app.post('/dedrone', async (req, res) => {
//   let data = _.get(req.body, 'data', { msg: 'noData' });

//   const { client } = dbCache;
//   logger.info('new push event');
//   await client.db('dedrone').collection('holidays2022test').insertOne({ ...req.body });
//   return;

//   flyTracker.sendMessages(data);


//   res.send('<b>health: ok </b>');
// });


app.listen(PORT, async () => {
  console.log('summer_holidays_2022 is listening on port', PORT)
});
