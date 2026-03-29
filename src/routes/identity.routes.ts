import { Router } from 'express';
import { IdentityController } from '../controllers/identity.controller';
import { validateIdentifyRequest } from '../middleware/validation.middleware';


const router = Router();

const controller = new IdentityController();


router.post('/identify', validateIdentifyRequest, controller.handleIdentify);


export default router;