import {Request, Response} from 'express';
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import {
    getUserByEmail,
    createUser,
    updateUserEntry, getUserByUsername
} from '../../services/user';
import config from '../../config/config.json';
import {PRECONDITION_FAILED_CODE, SERVER_ERROR_CODE, SUCCESS_CODE} from "../../utils/statusCodes";
import {
    AUTH_TOKEN_MUST_BE_SUPPLIED,
    AUTH_WEAK_PASSWORD,
    EMAIL_PASSWORD_REQUIRED_TO_LOGIN,
    INVALID_OLD_PASSWORD,
    INVALID_PASSWORD,
    USER_WITH_EMAIL_OR_USERNAME_ALREADY_EXISTS,
    USER_WITH_EMAIL_NOT_FOUND,
    USERNAME_EMAIL_OLD_NEW_PASSWORD_REQUIRED_TO_RESET_USER,
    USERNAME_EMAIL_PASSWORD_REQUIRED_TO_CREATE_USER,
    ACCOUNT_NOT_VERIFIED
} from "../../utils/errorMessages";
import {validatePassword} from "../../utils/validationUtils";
import logger from "../../helpers/logger";
import {createToken} from "../../utils/jwtUtils";
import {addPendingEmailVerification, getEmailVerificationForUserId} from "../../services/emailVerification";
import {v4 as uuidv4} from "uuid";
import {sendEmail} from "../../utils/emailUtils";
import {getUIUrl} from "../../utils/endpointUtils";
import {emailVerificationHTMLTemplate} from "../../utils/emailTemplateUtils";

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10)
}

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {username, email, password} = req.body;
        if (!(email && password && username)) {
            logger.log('error', USERNAME_EMAIL_PASSWORD_REQUIRED_TO_CREATE_USER)
            return res.status(PRECONDITION_FAILED_CODE).json({error: USERNAME_EMAIL_PASSWORD_REQUIRED_TO_CREATE_USER});
        }

        if (!validatePassword(password)) {
            logger.log('error', AUTH_WEAK_PASSWORD)
            return res.status(PRECONDITION_FAILED_CODE).json({error: AUTH_WEAK_PASSWORD});
        }

        const existingUserEmail = await getUserByEmail(email);
        const existingUserUsername = await getUserByUsername(username);
        const verificationToken = uuidv4()

        if (existingUserEmail || existingUserUsername) {
            logger.log('error', USER_WITH_EMAIL_OR_USERNAME_ALREADY_EXISTS)
            return res.status(PRECONDITION_FAILED_CODE).json({error: USER_WITH_EMAIL_OR_USERNAME_ALREADY_EXISTS});
        }

        const encryptedPassword = await hashPassword(password);

        const user = await createUser(email, encryptedPassword, username)

        await addPendingEmailVerification(verificationToken, user._id)

        if (process.env.NODE_ENV !== 'test') {
            await sendEmail(email,
                'Please, verify your email',
                ``,
                emailVerificationHTMLTemplate(`${getUIUrl()}/verify/${verificationToken}`))
        }

        return res.status(SUCCESS_CODE).send(`You should receive an email on ${user.email} with verification link.`);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {email, password} = req.body;
        if (!(email && password)) {
            logger.log('error', EMAIL_PASSWORD_REQUIRED_TO_LOGIN)
            return res.status(PRECONDITION_FAILED_CODE).json({error: EMAIL_PASSWORD_REQUIRED_TO_LOGIN});
        }

        const user = await getUserByEmail(email);

        if (!user) {
            logger.log('error', USER_WITH_EMAIL_NOT_FOUND)
            return res.status(PRECONDITION_FAILED_CODE).json({error: USER_WITH_EMAIL_NOT_FOUND});
        }

        if (!await bcrypt.compare(password, user.password)) {
            logger.log('error', INVALID_PASSWORD)
            return res.status(PRECONDITION_FAILED_CODE).json({error: INVALID_PASSWORD});
        }

        const verification = await getEmailVerificationForUserId(user._id);

        if (!verification || !verification.verified) {
            logger.log('error', ACCOUNT_NOT_VERIFIED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: ACCOUNT_NOT_VERIFIED});
        }

        const token = createToken(user._id, email, user.username)

        return res.status(SUCCESS_CODE).json(token);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {email, newPassword, oldPassword} = req.body;
        if (!(email && newPassword && oldPassword)) {
            logger.log('error', USERNAME_EMAIL_OLD_NEW_PASSWORD_REQUIRED_TO_RESET_USER)
            return res.status(PRECONDITION_FAILED_CODE).json({error: USERNAME_EMAIL_OLD_NEW_PASSWORD_REQUIRED_TO_RESET_USER});
        }

        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            logger.log('error', USER_WITH_EMAIL_NOT_FOUND)
            return res.status(PRECONDITION_FAILED_CODE).json({error: USER_WITH_EMAIL_NOT_FOUND});
        }

        if (!await bcrypt.compare(oldPassword, existingUser.password)) {
            logger.log('error', INVALID_OLD_PASSWORD)
            return res.status(PRECONDITION_FAILED_CODE).json({error: INVALID_OLD_PASSWORD});
        }

        const encryptedNewPassword = await hashPassword(newPassword);

        const updatedUser = await updateUserEntry(existingUser._id, undefined, undefined, encryptedNewPassword)

        const token = createToken(updatedUser._id, updatedUser.email, updatedUser.username)

        return res.status(SUCCESS_CODE).json(token);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const info = async (req: Request, res: Response): Promise<Response> => {

    const token: any = req.headers['token']

    if (!token) {
        logger.log('error', AUTH_TOKEN_MUST_BE_SUPPLIED)
        return res.status(PRECONDITION_FAILED_CODE).json({error: AUTH_TOKEN_MUST_BE_SUPPLIED});
    }

    try {
        const decodedUserData = jwt.verify(token, process.env.JWT_SECRET ? process.env.JWT_SECRET : config.jwt_secret);
        return res.status(SUCCESS_CODE).json(decodedUserData);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(PRECONDITION_FAILED_CODE).json({error: error.message})
    }
}
