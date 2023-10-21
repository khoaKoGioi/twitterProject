import {Request, Response, NextFunction} from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import {RunnableValidationChains} from 'express-validator/src/middlewares/schema';


export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
   await validation.run(req) //lia chuột dô run thấy có promise, nên phải có await

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.mapped() });
  };
};
