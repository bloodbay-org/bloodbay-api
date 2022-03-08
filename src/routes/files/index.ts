import express from 'express';

const router = express.Router();

import {
    uploadNewFile,
    getFilesForCaseId
} from './handlers';
import multer from "multer";

const upload = multer()

router.post('/', upload.array('files', 5), uploadNewFile);
router.get('/', getFilesForCaseId);

export = router;
