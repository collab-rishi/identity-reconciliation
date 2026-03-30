import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response
) => {
  const statusCode = err instanceof AppError ? err.status : 500;

  const message =
    err instanceof AppError ? err.message : 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.path}:`, err);

  res.status(statusCode).json({
    error: {
      message,
    },
  });
  return;
};
