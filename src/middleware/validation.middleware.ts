import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";


const identifySchema = z.object({
    email: z.string().email().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
}).refine((data) => data.email || data.phoneNumber, {
        message: "Either email or phoneNumber must be provided",
});


export const validateIdentifyRequest = (req: Request, res: Response, next: NextFunction) => {

    try {

        identifySchema.parse(req.body);
        next();
    } catch (error) {

        if (error instanceof ZodError) {
            
            return res.status(400).json({
                errors: error.issues.map((err) => ({
                    path: err.path,
                    message: err.message,
                })),
            });
        }
        next(error);

    }
};
