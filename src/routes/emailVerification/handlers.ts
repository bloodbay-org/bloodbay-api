import {Request, Response} from 'express';
import {PRECONDITION_FAILED_CODE, SERVER_ERROR_CODE, SUCCESS_CODE} from "../../utils/statusCodes";
import {
    VERIFICATION_REQUEST_ALREADY_PERFORMED,
    VERIFICATION_REQUEST_DOES_NOT_EXIST,
    VERIFICATION_TOKEN_NOT_SUPPLIED
} from "../../utils/errorMessages";
import logger from "../../helpers/logger";
import {completeVerification, getEmailVerification} from "../../services/emailVerification";

export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
    try {

        const verificationToken = req.query.token

        if (!verificationToken) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: VERIFICATION_TOKEN_NOT_SUPPLIED})
        }

        const verificationRequest = await getEmailVerification(`${verificationToken}`);

        if (!verificationRequest) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: VERIFICATION_REQUEST_DOES_NOT_EXIST})
        }

        if (verificationRequest.verified) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: VERIFICATION_REQUEST_ALREADY_PERFORMED})
        }

        await completeVerification(`${verificationToken}`)

        return res.status(SUCCESS_CODE).json({});
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};
