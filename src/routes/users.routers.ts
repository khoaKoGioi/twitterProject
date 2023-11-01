import { Router } from 'express'
import { accessTokenValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, verifyForgotPasswordValidator } from '../middlewares/users.middlewares'
import { emailVerifyController, forgotPasswordController, loginController, logoutController, registerController, resendEmailVerifyController, verifyForgotPasswordController } from '../controllers/users.controller'
import { wrapAsync } from '../utils/handlers'
const usersRouter = Router()

//controller
usersRouter.get('/login', loginValidator, wrapAsync(loginController))
//đầu tiên khi mà truy cập vào login
//thì sẽ đi qua loginValidator, sẽ kiểm tra email, pass xem có tồn tại hay k
//oke rồi thì sẽ next qua tầng tiếp theo là loginController
usersRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
des: đăng xuất
path: user/logout
method: post
headers: {Authorization: 'Bearer <access_token>'}
body: {refresh_token: string}
*/
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des: verify email
method: post
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyController))
/*
des: resend verify email
method: post
path: /users/resend-verify-email
headers: {Authorization: "Bearer access_token"}
 */
usersRouter.post('/resend-verify-enail', accessTokenValidator, wrapAsync(resendEmailVerifyController))
/*
des: forgot password
method: post
path: /users/forgot-password
body: {
    email: string
}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))
/*
des: verify forgot password
method: post
path: /users/verify-forgot-password
body: {
    forgot_password_token: string
}
*/
usersRouter.post('/verify-forgot--password', verifyForgotPasswordValidator, wrapAsync(verifyForgotPasswordController))
export default usersRouter
