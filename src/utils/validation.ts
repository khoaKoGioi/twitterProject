import { EntityError, ErrorWithStatus } from './../models/Errors';

import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req) //lia chuột dô run thấy có promise, nên phải có await

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    for (const key in errorObject) {
      //lấy message của từng lỗi ra
      const { msg } = errorObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      //nếu xuống được đây thì là lỗi 422
      entityError.errors[key] = msg
    }
    //xử lí lỗi luôn
    next(entityError)
  }
}
