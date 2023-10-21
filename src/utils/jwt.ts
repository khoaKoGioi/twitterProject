//file này dùng để tạo access và refresh token
import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
config()

export const singToken = ({
    payload,
    privateKey = process.env.JWT_SECRET as string, 
    options = {algorithm: 'HS256'}
} : {
    payload: string | object | Buffer,
    privateKey?: string,
    options?: jwt.SignOptions
}) => {
  //privatekey: signature, options: tgian bat dau va het han cua token
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}
