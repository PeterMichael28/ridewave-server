import { NextFunction, Response } from 'express';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

export const isAuthenticated = (
 req: any,
 res: Response,
 next: NextFunction,
) => {
 try {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
   res
    .status(401)
    .json({ message: 'Please Log in to access this content!' });
   return;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
   res.status(401).json({ message: 'Token missing' });
   return;
  }

  // Verify the token
  jwt.verify(
   token,
   process.env.ACCESS_TOKEN_SECRET!,
   async (err: any, decoded: any) => {
    if (err) {
     res.status(401).json({ message: 'Invalid token' });
     return;
    }

    const userData = await prisma.user.findUnique({
     where: {
      id: decoded.id,
     },
    });
    // Attach the user data to the request object
    req.user = userData;
    next();
   },
  );
 } catch (error) {
  console.log(error);
 }
};

export const isAuthenticatedDriver = (
 req: any,
 res: Response,
 next: NextFunction,
) => {
 try {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
   res
    .status(401)
    .json({ message: 'Please Log in to access this content!' });
   return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
   res.status(401).json({ message: 'Token missing' });
   return;
  }

  // Verify the token
  jwt.verify(
   token,
   process.env.ACCESS_TOKEN_SECRET!,
   async (err: any, decoded: any) => {
    if (err) {
     res.status(401).json({ message: 'Invalid token' });
     return;
    }

    const driverData = await prisma.driver.findUnique({
     where: {
      id: decoded.id,
     },
    });
    // Attach the user data to the request object
    req.driver = driverData;
    next();
   },
  );
 } catch (error) {
  console.log(error);
 }
};
