import { emailVerifyTokenValidator } from './../middlewares/users.middlewares'
//nơi lưu các controllers liên quan đến users
import { NextFunction, Request, Response } from 'express'
import databaseService from '../services/database.services'
import User from '../models/schemas/User.schema'
import usersService from '../services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody, loginReqBody, logoutReqBody, tokenPayload } from '../models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '../constants/messages'
import { UserVerifyStatus } from '../constants/enums'
export const loginController = async (req: Request<ParamsDictionary, any, loginReqBody>, res: Response) => {
  //nếu đăng nhập thành công (loginValidator) thì sẽ vào được đây
  const user = req.user as User //lấy user từ req
  const user_id = user._id as ObjectId //OnjectId trong mongdoDB
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
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, logoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  //logout sẽ nhận vào refresh_token để tìm và xóa
  const result = await usersService.logout(refresh_token)
  res.json({
    message: 'logout success'
  })
}

export const emailVerifyController = async (req: Request, res: Response) => {
  //kiểm tra xem user này đã verify hay chưa
  const { user_id } = req.decoded_email_verify_token as tokenPayload
  const user = req.user as User
  if (user.verify == UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu xuống được đây nghĩa là user này chưa verify, chưa bị banned, và khớp mã
  //Mình tiến hành update: verify: 1, xóa email_verify_token, update_at
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}
