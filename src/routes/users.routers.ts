import { UpdateMeReqBody } from './../models/requests/User.requests';
import { Router } from 'express'
import { accessTokenValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordValidator } from '../middlewares/users.middlewares'
import { emailVerifyController, forgotPasswordController, getMeController, getProfileController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, updatemeController, verifyForgotPasswordController } from '../controllers/users.controller'
import { wrapAsync } from '../utils/handlers'
import { filterMiddleware } from '../middlewares/common.middlewares';
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

/*
des: reset password
path: '/reset-password'
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {forgot_password_token: string, password: string, confirm_password: string}
*/
usersRouter.post(
    "/reset-password",
    resetPasswordValidator,
    verifyForgotPasswordValidator,
    wrapAsync(resetPasswordController)
)

/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get("/me", accessTokenValidator, wrapAsync(getMeController))
usersRouter.patch(
    "/me", accessTokenValidator, verifiedUserValidator, filterMiddleware<UpdateMeReqBody>([
        'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
    ]) , updateMeValidator, wrapAsync(updatemeController)
)

/*
des: get profile của user khác bằng unsername
path: '/:username'
method: get
không cần header vì, chưa đăng nhập cũng có thể xem
*/
usersRouter.get("/:username", wrapAsync(getProfileController))

export default usersRouter


