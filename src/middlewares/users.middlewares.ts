import { USERS_MESSAGES } from './../constants/messages';
import { JsonWebTokenError } from 'jsonwebtoken'
//hàm xử lí validate users
//ta sẽ làm chức năng đăng nhập
//cụ thể là: http://localhost:3000/users/login
//khi đăng nhập thì client sẽ truy cập vào /login
//thì khi đó sẽ tạo ra 1 req(request) và bỏ vào trong đó email, password
//nhét email, pass vào trong req.body
import { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import usersService from '../services/users.services'
import { ErrorWithStatus } from '../models/Errors'
import databaseService from '../services/database.services'
import { hashPassword } from '../utils/crypto'
import HTTP_STATUS from '../constants/httpStatus'
import { verifyToken } from '../utils/jwt'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../constants/enums'
import { tokenPayload } from '../models/requests/User.requests'
//phải import thì nó mới hiểu là được lấy từ express
//chứ k là nó hiểu là lấy từ fetch API là ở trong máy tính mà máy mình làm đéo gì có
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      // returnScore: false
      // false : chỉ return true nếu password mạnh, false nếu k
      // true : return về chất lượng password(trên thang điểm 10)
    }
  },
  errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}
const nameSchema: ParamSchema = {
    notEmpty: {
      errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 100
      },
      errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
    }
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
  }
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
      errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING ////messages.ts thêm IMAGE_URL_MUST_BE_A_STRING: 'Image url must be a string'
  },
  trim: true,//nên đặt trim dưới này thay vì ở đầu
  isLength: {
      options: {
      min: 1,
      max: 400
      },
      errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400 //messages.ts thêm IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400: 'Image url length must be less than 400'
  }
}
export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          //tìm user nào có email và pass giống client đưa k ?
          //nếu mà có thì đăng nhập thành công
          //k có thì nó nhập sai
          const user = await databaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
          }
          req.user = user //kêu th req giữ dùm cái user, để từ đo lấy cái id xử lí ở registerController
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    }
  })
)

export const registerValidator = validate(
  checkSchema({
    name: nameSchema,
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await usersService.checkEmailExist(value)
          if (isExist) {
            throw new Error('Email already exist')
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: dateOfBirthSchema
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            //value của Authorization là chuỗi "Bearer <access_token>"
            //ta sẽ tách chuỗi đó ra để lấy access_token bằng cách split
            const accessToken = value.split(' ')[1]
            //nếu k có accessToken thì ném lỗi 401
            if (!accessToken) {
              //throw new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)  //này trả ra 422(k hay)
              // thì k hay, ta phải trả ra 401(UNAUTHORIZED)
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED //401
              })
            }
            try {
              //còn nếu có thì mình phải verify cái accessToken đó và lấy ra cái decoded_authorization(payload)
              //kiểm tra xem access_token có hợp lệ hay không
              //ở đây mình trycath để tạo ra lỗi có status khác 422, nếu k thì khi phát sinh lỗi sẽ là 422
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              //lấy ra xong thì lưu vào req để dùng dần
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            //có 2 lỗi có thể xảy ra
            //1 là do jsonwebtoken
            //để xử lí thì mình phải hứng lỗi đó lại rồi set cho nó 1 cái errorWithStatus vì nó k có status
            //còn 2 là do mình tìm trong database k thấy refresh_token
            //còn này thì k cần custom, chỉ cần throw error thôi
            try {
              //verify refresh_token để lấy decoded_refresh_token
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                //tìm xem coi refresh_token này có tồn tại trong database hay k
                databaseService.refreshTokens.findOne({
                  token: value
                }) //nếu tìm k thành công thì ta thow error
              ])
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //nếu có thì ta lưu decoded_refresh_token vào req để khi nào muốn biết ai gữi req thì dùng
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              //trong middleware này ta throw để lỗi về default error handler xử lý
              if (error instanceof JsonWebTokenError) {
                //nếu lỗi thuộc verify thì ta sẽ trả về lỗi này
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  //để báo lỗi tường minh hơn
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //còn nếu không phải thì ta sẽ trả về lỗi do ta throw ở trên try
              throw error // này là lỗi đã tạo trên try
              //việc phân biệt lỗi này giúp server trả ra lỗi tường mình và cụ thể hơn
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //nếu k truyền lên email_verify_token thì báo lỗi
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              //verify email_verify_token để lấy decoded_email_verify_token
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              const user_id = decoded_email_verify_token.user_id
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })
              //nếu mà k có thì user not found
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
              //còn mà có user thì lưu lại
              req.user = user
              //nếu có user thì xem thử user này có bị banned không ?
              if (user.verify == UserVerifyStatus.Banned) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_BANNED,
                  status: HTTP_STATUS.FORBIDDEN //403
                })
              }
              //nếu truyền k đúng với database thì báo lỗi
              if (user.verify != UserVerifyStatus.Verified && user.email_verify_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_NOT_MATCH,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
            } catch (error) {
              //trong middleware này ta throw để lỗi về default error handler xử lý
              if (error instanceof JsonWebTokenError) {
                //nếu lỗi thuộc verify thì ta sẽ trả về lỗi này
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  //để báo lỗi tường minh hơn
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //còn nếu không phải thì ta sẽ trả về lỗi do ta throw ở trên try
              throw error // này là lỗi đã tạo trên try
              //việc phân biệt lỗi này giúp server trả ra lỗi tường mình và cụ thể hơn
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          //tìm trong database xem có user nào sở hữu email = value của email người dùng gữi lên không
          const user = await databaseService.users.findOne({
            email: value
          })
          //nếu không tìm đc user thì nói user không tồn tại
          //khỏi tiến vào controller nữa
          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            }) //422
          }
          //đến đâu thì oke
          req.user = user // lưu user mới tìm đc lại luôn, khi nào cần thì xài
          return true
        }
      }
    }
  })
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //nếu k truyền lên email_verify_token thì báo lỗi
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              //verify forgot_password_token để lấy decoded_forgot_password_token
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
              const user_id = decoded_forgot_password_token.user_id
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })
              //nếu mà k có thì user not found
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
              //còn mà có user thì lưu lại
              req.user = user
              //nếu truyền k đúng với database thì báo lỗi
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
            } catch (error) {
              //trong middleware này ta throw để lỗi về default error handler xử lý
              if (error instanceof JsonWebTokenError) {
                //nếu lỗi thuộc verify thì ta sẽ trả về lỗi này
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  //để báo lỗi tường minh hơn
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              //còn nếu không phải thì ta sẽ trả về lỗi do ta throw ở trên try
              throw error // này là lỗi đã tạo trên try
              //việc phân biệt lỗi này giúp server trả ra lỗi tường mình và cụ thể hơn
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, Next: NextFunction) => {
  const { verify } = req.decoded_authorization as tokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN //403: không đủ quyền truy cập
    })
  }
  Next() //verified rồi thì xuống function tiếp theo thôi
}
export const updateMeValidator = validate(
  checkSchema(
      {
      name: {
          optional: true, //đc phép có hoặc k
          ...nameSchema, //phân rã nameSchema ra
          notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      date_of_birth: {
          optional: true, //đc phép có hoặc k
          ...dateOfBirthSchema, //phân rã nameSchema ra
          notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
          optional: true,
          isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING ////messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
          },
          trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
          isLength: {
          options: {
              min: 1,
              max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
          }
      },
      //giống bio
      location: {
          optional: true,
          isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
          },
          trim: true,
          isLength: {
          options: {
              min: 1,
              max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
          }
      },
      //giống location
      website: {
          optional: true,
          isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING ////messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
          },
          trim: true,
          isLength: {
          options: {
              min: 1,
              max: 200
          },

          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
          }
      },
      username: {
          optional: true,
          isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING ////messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
          },
          trim: true,
          isLength: {
          options: {
              min: 1,
              max: 50
          },
          errorMessage: USERS_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50 //messages.ts thêm USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50'
          }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
      },
      ['body']
  )
)