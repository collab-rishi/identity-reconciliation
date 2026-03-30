import express from 'express';

import cors from 'cors';

import identityRoutes from './routes/identity.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', identityRoutes);

app.use(errorHandler);

export default app;
