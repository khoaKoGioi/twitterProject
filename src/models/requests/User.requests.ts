import { TokenType } from './../../constants/enums'
import { JwtPayload } from 'jsonwebtoken'

export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface loginReqBody {
  email: string
  password: string
}

export interface logoutReqBody {
  refresh_token: string
}

export interface tokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}
