import winston from 'winston';

const {combine, colorize, timestamp, simple} = winston.format;

const logger = winston.createLogger({
    level: 'info',
    format: combine(colorize(), timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), simple()),
    defaultMeta: {service: 'bloodbay-api'},
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'app.log', level: 'info'}),
    ],
});

export = logger;
