import {Request, Response} from 'express';
import {PRECONDITION_FAILED_CODE, SERVER_ERROR_CODE, SUCCESS_CODE} from "../../utils/statusCodes";
import {
    AUTH_TOKEN_MUST_BE_SUPPLIED, CASE_ID_REQUIRED, CASE_NOT_FOUND,
    FILE_CAN_BE_LINKED_ONLY_BY_CASE_REPORTER, FILE_NAME_MUST_BE_SUPPLIED, FILE_NOT_FOUND,
    FILE_SHOULD_BE_LINKED_TO_EXISTING_CASE,
    NO_FILES_OR_LINKS_SPECIFIED,
} from "../../utils/errorMessages";
import {
    createFileLink, getFileLinks,
} from "../../services/files";
import {decodeToken} from "../../utils/jwtUtils";
import logger from "../../helpers/logger";
import {FileMetadata, getFileById, uploadFile} from "../../utils/storage";
import {v4 as uuidv4} from 'uuid';
import {getCaseById} from "../../services/case";

export const uploadNewFile = async (req: Request, res: Response): Promise<Response> => {
    try {
        const token: any = req.headers['token']

        if (!token) {
            logger.log('error', AUTH_TOKEN_MUST_BE_SUPPLIED)
            return res.status(PRECONDITION_FAILED_CODE).json({error: AUTH_TOKEN_MUST_BE_SUPPLIED});
        }

        const decodedUser = decodeToken(token);

        const {linkedToId} = req.query

        if (!linkedToId || !req.files || req.files.length <= 0) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: NO_FILES_OR_LINKS_SPECIFIED});
        }

        const caseToBeLinked = await getCaseById(`${linkedToId}`)

        if (!caseToBeLinked) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: FILE_SHOULD_BE_LINKED_TO_EXISTING_CASE});
        }

        if (caseToBeLinked.reportedById !== decodedUser.id) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: FILE_CAN_BE_LINKED_ONLY_BY_CASE_REPORTER});
        }

        const uploadedFiles: any[] = []

        // @ts-ignore
        for (const fileNameToUpload: File of req.files) {
            const uploadedFileId = uuidv4()
            await uploadFile({fileName: uploadedFileId, fileContent: fileNameToUpload.buffer})
            uploadedFiles.push(await createFileLink(fileNameToUpload.originalname, uploadedFileId, `${linkedToId}`))
        }

        return res.status(SUCCESS_CODE).json(uploadedFiles);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};

export const getFilesForCaseId = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {caseId} = req.query

        if (!caseId) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: CASE_ID_REQUIRED});
        }

        const caseToFetchFilesFor = await getCaseById(`${caseId}`)

        if (!caseToFetchFilesFor) {
            return res.status(PRECONDITION_FAILED_CODE).json({error: CASE_NOT_FOUND});
        }

        const fileLinks = await getFileLinks(caseToFetchFilesFor._id)

        if (!fileLinks || fileLinks.length <= 0) {
            return res.status(SUCCESS_CODE).json([]);
        }

        const fileMetadata: FileMetadata[] = []

        for (const fileLink of fileLinks) {
            const fetchedFileMetadata = await getFileById({fileName: fileLink.name})
            if (fetchedFileMetadata) {
                fileMetadata.push(fetchedFileMetadata)
            }
        }

        return res.status(SUCCESS_CODE).json(fileMetadata);
    } catch (error: any) {
        logger.log('error', error.message)
        return res.status(SERVER_ERROR_CODE).json({error: error.message})
    }
};
