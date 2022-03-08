import express from 'express';

const router = express.Router();

import {
    createNewCase, deleteCase, fetchCaseByID, listAllCases, searchCases,

} from './handlers';

router.post('/', createNewCase);
router.get('/search', searchCases);
router.get('/:caseId', fetchCaseByID);
router.get('/', listAllCases);
router.delete('/:caseId', deleteCase);

export = router;
