import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '../constants/enums'
import { RegisterRequestBody } from '../models/requests/User.requests'
import RefreshToken from '../models/schemas/RefreshToken.schema'
import User from '../models/schemas/User.schema'
import { hashPassword } from '../utils/crypto'
import { singToken } from '../utils/jwt'
import databaseService from './database.services'
import { config } from 'dotenv'
import { USERS_MESSAGES } from '../constants/messages'
config()

class UsersService {
  //viết hàm nhận vào user_id để bỏ vào payload tạo access token
  private SignAccessToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  private SignRefreshToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }

  private SignAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.SignAccessToken(user_id), this.SignRefreshToken(user_id)])
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user) //trả ra true false, ép kiểu cho user thành Boolean
  }

  async register(payload: RegisterRequestBody) {
    //payload: data
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseService.users.insertOne(
      new User({
        ...payload, //destructuring trong RegisterRequestBody(name, email, pass, confirmed_pass, date)
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password) //mã hóa password
      })
    )
    //Lấy user_id từ user mới tạo
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken(user_id.toString())
    //lưu refresh token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    //gia lap gui email
    console.log(email_verify_token)
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken(user_id)
    //lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }

  async verifyEmail(user_id: string) {
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified, //1
            email_verify_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //tạo accessToken và refreshToken
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken(user_id.toString())
    //lưu refresh token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //giả lập gửi email
    console.log(email_verify_token)
    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS }
  }

  async forgotPassword(user_id: string) {
    //tạo ra forgot_password token
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //giả lập gửi email
    console.log(forgot_password_token)
    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          update_at: '$$SNOW'
        }
      }
    ])
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user // sẽ k có những thuộc tính nêu trên, tránh bị lộ thông tin
  }
}

const usersService = new UsersService()
export default usersService
