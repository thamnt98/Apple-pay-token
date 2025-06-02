const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'adyen-apple-pay' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

// Add a simple wrapper to also console.log in development for easier debugging
const enhancedLogger = {
  error: (message, meta) => {
    logger.error(message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.error(`ERROR: ${message}`, meta || '');
    }
  },
  warn: (message, meta) => {
    logger.warn(message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`WARNING: ${message}`, meta || '');
    }
  },
  info: (message, meta) => {
    logger.info(message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`INFO: ${message}`, meta || '');
    }
  },
  debug: (message, meta) => {
    logger.debug(message, meta);
  }
};

module.exports = enhancedLogger; 