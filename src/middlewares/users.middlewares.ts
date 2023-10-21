//hàm xử lí validate users
//ta sẽ làm chức năng đăng nhập
//cụ thể là: http://localhost:3000/users/login
//khi đăng nhập thì client sẽ truy cập vào /login
//thì khi đó sẽ tạo ra 1 req(request) và bỏ vào trong đó email, password
//nhét email, pass vào trong req.body
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { syncBuiltinESMExports } from 'module'
import { validate } from '../utils/validation'
import usersService from '../services/users.services'
//phải import thì nó mới hiểu là được lấy từ express
//chứ k là nó hiểu là lấy từ fetch API là ở trong máy tính mà máy mình làm đéo gì có
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  //đây là 1 middleware, bởi vì nó có next
  const { email, password } = req.body //tạo email avf pass ở trong req.body
  if (!email || !password) {
    //khi mà thiếu 1 trong 2 thì sẽ chạy bên dưới
    return res.status(400).json({
      message: 'Missing email or password'
    })
  }
  next() //khi k thiếu thì cứ next mà chạy các middleware khác
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value, {req}) => {
          const isExist = await usersService.checkEmailExist(value)
          if(isExist) {
            throw new Error('Email already exists')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      errorMessage: `Password must be at least 8 characters long, contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol`
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      errorMessage: `confirmed password must be at least 8 characters long, contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol`,
      custom: {//Hàm này dùng để check xem có trùng password không 
        options: (value, {req}) => {
          if(value !== req.body.password) { //value là confim_password
            throw new Error('confirmed password must match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
