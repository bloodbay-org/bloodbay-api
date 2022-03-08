import express from 'express';

const router = express.Router();

import {
    verifyEmail

} from './handlers';

router.post('/', verifyEmail);

export = router;
