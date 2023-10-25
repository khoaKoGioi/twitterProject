import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { omit } from 'lodash'

export const defaultErrorHandle = (err: any, req: Request, res: Response, next: NextFunction) => {
  //đây là nơi mà tất cả lỗi trên hệ thống sẽ đồn về đây
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status'])) //sẽ có lỗi có status, còn k có thì
}
