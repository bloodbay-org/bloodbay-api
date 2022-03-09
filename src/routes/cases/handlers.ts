import {Request, Response} from 'express';
import {PRECONDITION_FAILED_CODE, SERVER_ERROR_CODE, SUCCESS_CODE} from "../../utils/statusCodes";
import {
    AUTH_TOKEN_MUST_BE_SUPPLIED, CASE_ID_REQUIRED, INVALID_COUNTRY, ONLY_REPORTER_CAN_DELETE_CASE,
} from "../../utils/errorMessages";
import {
    createCase,
    deleteCaseById,
    getAllCases,
    getCaseById,
    getCasesByReportedUserId,
    searchCasesByTag
} from "../../services/case";
import {decodeToken} from "../../utils/jwtUtils";
import logger from "../../helpers/logger";
import {getCountryByCode} from "../../utils/localityUtils";

export const listAllCases = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = req.query.userId

        if (userId) {
            const fetchedCases = await getCasesByReportedUserId(`${userId}`);
            return res.status(SUCCESS_CODE).json(fetchedCases);
        }

        const allCases = await getAllCases();
        return res.status(SUCCESS_CODE).json(allCases);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const searchCases = async (req: Request, res: Response): Promise<Response> => {
    try {
        const tag = req.query.tag
        if (!tag) {
            const allCases = await getAllCases();
            return res.status(SUCCESS_CODE).json(allCases);
        }
        const matchedCases = await searchCasesByTag(`${tag}`);
        return res.status(SUCCESS_CODE).json(matchedCases);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const fetchCaseByID = async (req: Request, res: Response): Promise<Response> => {
    try {
        const caseId = req.params.caseId
        if (!(caseId)) {
            logger.log('error', CASE_ID_REQUIRED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: CASE_ID_REQUIRED});
        }
        const fetchedCase = await getCaseById(caseId);
        return res.status(SUCCESS_CODE).json(fetchedCase);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const createNewCase = async (req: Request, res: Response): Promise<Response> => {
    try {
        const token: any = req.headers['token']

        if (!token) {
            logger.log('error', AUTH_TOKEN_MUST_BE_SUPPLIED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: AUTH_TOKEN_MUST_BE_SUPPLIED});
        }

        const decodedUserData = decodeToken(token);

        const {title, description, tags, reportedByName, country} = req.body;

        // @ts-ignore
        if (getCountryByCode(country) === 'UNKNOWN') {
            logger.log('error', INVALID_COUNTRY)
            return res.status(PRECONDITION_FAILED_CODE).json({error: INVALID_COUNTRY});
        }

        const createdCase = await createCase(decodedUserData.id, title, description, tags ? tags : [], reportedByName, country);

        return res.status(SUCCESS_CODE).json(createdCase);

    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const deleteCase = async (req: Request, res: Response): Promise<Response> => {
    try {
        const token: any = req.headers['token']

        if (!token) {
            logger.log('error', AUTH_TOKEN_MUST_BE_SUPPLIED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: AUTH_TOKEN_MUST_BE_SUPPLIED});
        }

        const decodedUserData = decodeToken(token);

        const caseId = req.params.caseId

        if (!(caseId)) {
            logger.log('error', CASE_ID_REQUIRED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: CASE_ID_REQUIRED});
        }

        const existingCase = await getCaseById(caseId)

        if (existingCase.reportedById !== decodedUserData.id) {
            logger.log('error', ONLY_REPORTER_CAN_DELETE_CASE)
            return res.status(PRECONDITION_FAILED_CODE).json({error: ONLY_REPORTER_CAN_DELETE_CASE});
        }

        const deletedCase = await deleteCaseById(caseId);

        return res.status(SUCCESS_CODE).json(deletedCase);

    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};