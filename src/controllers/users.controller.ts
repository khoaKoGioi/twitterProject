import { ErrorWithStatus } from './../models/Errors'
import { emailVerifyTokenValidator } from './../middlewares/users.middlewares'
//nơi lưu các controllers liên quan đến users
import { NextFunction, Request, Response } from 'express'
import databaseService from '../services/database.services'
import User from '../models/schemas/User.schema'
import usersService from '../services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody, loginReqBody, logoutReqBody, resetPasswordReqBody, tokenPayload } from '../models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '../constants/messages'
import { UserVerifyStatus } from '../constants/enums'
import HTTP_STATUS from '../constants/httpStatus'
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

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  //nếu code vào được đây nghĩa là nó đã đi qua được tầng accessTokenValidator
  //trong req đã có decoded_authorization
  const { user_id } = req.decoded_authorization as tokenPayload
  //Lấy user từ database
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  //nếu có thì kiểm tra xem thằng này đã bị banned chưa ?
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  //user đã verify chưa ?
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu chưa verify thì tiến hành update cho user mã mới
  const result = await usersService.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  //lấy user_id từ req.user
  const { _id } = req.user as User
  //tiến hành update lại forgot_password_token
  const result = await usersService.forgotPassword((_id as ObjectId).toString())
  return res.json(result)
}
export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  //nếu đã đến bước này nghĩa là ta đã tìm có forgot_password_token hợp lệ
  //và đã lưu vào req.decoded_forgot_password_token
  //thông tin của user
  //ta chỉ cần thông báo rằng token hợp lệ
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (req: Request<ParamsDictionary, any, resetPasswordReqBody>, res: Response) => {
  //nếu muốn đổi mật khẩu thì cần user_id và mật khẩu mới
  const { user_id } = req.decoded_forgot_password_token as tokenPayload
  const { password } = req.body
  //cập nhật
  const result = await usersService.resetPassword({ user_id, password })
  return 
}
