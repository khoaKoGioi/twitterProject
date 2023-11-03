import { tokenPayload } from '../models/requests/User.requests'
import User from '../models/schemas/User.schema'
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: tokenPayload
    decoded_refresh_token?: tokenPayload
    decoded_email_verify_token?: tokenPayload
    decoded_forgot_password_token?: tokenPayload
  }
}
