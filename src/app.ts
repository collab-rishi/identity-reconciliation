import express from 'express';

import cors from 'cors';

import identityRoutes from './routes/identity.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "Identity Reconciliation Service is running",
    timestamp: new Date().toISOString()
  });
});

app.use('/', identityRoutes);

app.use(errorHandler);

export default app;
