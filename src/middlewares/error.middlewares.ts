import { USERS_MESSAGES } from './../constants/messages'
import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '../models/Errors'
import { error } from 'console'

export const defaultErrorHandle = (err: any, req: Request, res: Response, next: NextFunction) => {
  //đây là nơi mà tất cả lỗi trên hệ thống sẽ đồn về đây
  if (err instanceof ErrorWithStatus) {
    res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status'])) //sẽ có lỗi có status, còn k có thì
  }
  //nếu mà lỗi xuống được đây thì lỗi k thuộc errorWithStatus
  //nghĩa là k phải do mình tạo ra mà là lỗi mặc định
  //set name, stack, message về enumerable true
  Object.getOwnPropertyNames(err).forEach((key) => {
    //Giúp lấy ra các thuộc tính của error
    Object.defineProperty(err, key, { enumerable: true })
  })
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack']) //dùng omit giúp loại bỏ message của stack(chỉ ra bug ở chỗ nào) để giúp tăng bảo mật
  })
}
