require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route';
import Nylas from 'nylas';
import driverRouter from './routes/driver.route';
import cors from 'cors';
export const app = express();

export const nylas = new Nylas({
 apiKey: process.env.NYLAS_API_KEY!,
 apiUri: 'https://api.us.nylas.com',
});

// body parser
app.use(express.json({ limit: '50mb' }));

// cookie parserv
app.use(cookieParser());

app.use(
 cors({
  origin: ['*'],
  credentials: true,
 }),
);

// routes
app.use('/api/v1', userRouter);
app.use('/api/v1/driver', driverRouter);

// testing api
app.get(
 '/test',
 (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
   success: true,
   message: 'API is working',
  });
 },
);
