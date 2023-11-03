import { NextFunction, Request, RequestHandler, Response } from 'express'
import { tokenPayload } from '../models/requests/User.requests'
import User from '../models/schemas/User.schema'

//dùng để tạo try catch cho các hàm async, nghĩa là th nào có async thì bọc nó lại rồi thêm cho nó try catch
//Nhận vào 1 hàm chưa có try catch
//và sẽ trả ra hàm có try catch
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
//thêm thuộc tính cho Request

