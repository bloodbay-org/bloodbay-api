import express from 'express';

const router = express.Router();

import {
    register,
    login,
    info,
    resetPassword
} from './handlers';

router.post('/register', register);
router.post('/login', login);
router.post('/info', info);
router.post('/reset', resetPassword);

export = router;
