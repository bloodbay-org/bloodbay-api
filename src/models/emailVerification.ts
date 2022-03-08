'use strict';

import {Model, model, Schema} from 'mongoose';

import {MIEmailVerification} from './types';

const EmailVerificationSchema = new Schema({
    token: {
        type: String,
        required: [true, 'token is required'],
    },
    userId: {
        type: String,
        required: [true, 'userId is required'],
    },
    verified: {
        type: Boolean,
        required: [true, 'verified is required'],
    }
});

// @ts-ignore
export const EmailVerificationModel: Model<MIEmailVerification> = model('EmailVerification', EmailVerificationSchema);
