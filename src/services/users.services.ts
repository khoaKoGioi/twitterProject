import { TokenType } from '../constants/enums'
import { RegisterRequestBody } from '../models/requests/User.requests'
import User from '../models/schemas/User.schema'
import { hashPassword } from '../utils/crypto'
import { singToken } from '../utils/jwt'
import databaseService from './database.services'
import { config } from 'dotenv'
config()

class UsersService {
  //viết hàm nhận vào user_id để bỏ vào payload tạo access token
  private SignAccessToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }

  private SignRefreshToken(user_id: string) {
    return singToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
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
    const result = await databaseService.users.insertOne(
      new User({
        ...payload, //destructuring trong RegisterRequestBody(name, email, pass, confirmed_pass, date)
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password) //mã hóa password
      })
    )
    //Lấy user_id từ user mới tạo
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken(user_id)
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken(user_id)
    return { access_token, refresh_token }
  }
  
  
}

const usersService = new UsersService()
export default usersService
