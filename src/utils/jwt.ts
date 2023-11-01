import { tokenPayload } from './../models/requests/User.requests'
import jwt from 'jsonwebtoken'
//file này dùng để tạo access và refresh token
import { config } from 'dotenv'
config()

export const singToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey: string
  options: jwt.SignOptions
}) => {
  //privatekey: signature, options: tgian bat dau va het han cua token
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      resolve(token as string)
    })
  })
}

//hàm nhận vào token và secretOrPublicKey ?
export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  return new Promise<tokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as tokenPayload)
    })
  })
}
