import { Request, Response, NextFunction } from 'express';
import { IdentityService } from '../services/identity.service';

export class IdentityController {

    private identityService: IdentityService;

    constructor() {
        this.identityService = new IdentityService();
    }

    handleIdentify = async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { email, phoneNumber } = req.body;

            const result = await this.identityService.processIdentification(email, phoneNumber);

             res.status(200).json(result);
             return;

        } catch (error) {

            next(error);
        }
    };


}