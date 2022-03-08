'use strict';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import config from './config/config.json';
import logger from './helpers/logger';
import auth from './routes/auth';
import cases from './routes/cases';
import files from './routes/files';
import verify from './routes/emailVerification';
import morgan from "morgan";

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const options: cors.CorsOptions = {
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'token'],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: '*',
    preflightContinue: true,
};

app.use(limiter);
app.use(cors(options));
app.use(bodyParser.json());

const url = process.env.MONGO ? process.env.MONGO : config.db.url;

(async () => {
    logger.info(`Connecting to ${url}`);
    await mongoose.connect(
        url,
        {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true,
        },
        (err) => {
            if (err) {
                logger.error(err);
                process.exit(1);
            }
            logger.info('Connected to Mongo DB');
        },
    );
})();

app.use(morgan('combined'))

app.use('/auth', auth);
app.use('/cases', cases);
app.use('/files', files);
app.use('/verify', verify);

export const closeMongoose = async () => {
    await mongoose.connection.close();
}

export const server = app.listen(config.port, () => {
    logger.info(`bloodbay-api API listening on port ${config.port}!`);
});
