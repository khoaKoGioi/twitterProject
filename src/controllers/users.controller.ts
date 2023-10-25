//nơi lưu các controllers liên quan đến users
import { NextFunction, Request, Response } from 'express'
import databaseService from '../services/database.services'
import User from '../models/schemas/User.schema'
import usersService from '../services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody } from '../models/requests/User.requests'
export const loginController = async (req: Request, res: Response) => {
  //nếu đăng nhập thành công (loginValidator) thì sẽ vào được đây
  const { user }: any = req
  const user_id = user._id //OnjectId trong mongdoDB
  //server phải tạo ra access và refresh token để đưa cho client
  const result = await usersService.login(user_id.toString())
  return res.json({
    message: 'login successfully',
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: 'Register succesfully',
    result
  })
}
