import { tokenPayload } from './models/requests/User.requests'
import User from './models/schemas/User.schema'
import { Request } from 'express'
declare module 'express' {
  interface Request {
    user?: User //thêm ? vì k phải request nào cũng có user
    decoded_authorization?: tokenPayload
    decoded_refresh_token?: tokenPayload
  }
}
