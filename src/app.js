import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';

import logger from './logger.js';
import healthRouter from './routes/health.js';
import fragmentsRouter from './routes/fragments.js';
import convertRouter from './routes/convert.js';

const app = express();

app.use(pinoHttp({ logger }));

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/', healthRouter);
app.use('/v1', healthRouter);
app.use('/v1/fragments', convertRouter);
app.use('/v1/fragments', fragmentsRouter);

app.use((err, req, res, _next) => {
  const code = err.statusCode || err.status || 500;
  const message = err.message || 'internal server error';
  req.log?.error({ err, code }, 'Unhandled error');
  res.status(code).json({ status: 'error', error: { code, message } });
});

app.use((req, res) => {
  req.log?.warn({ path: req.originalUrl }, 'Not found');
  res.status(404).json({ status: 'error', error: { code: 404, message: 'not found' } });
});

export default app;