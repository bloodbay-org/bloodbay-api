'use strict';

import {Model, model, Schema} from 'mongoose';

import {MIUser} from './types';

const validateEmail = (email: string) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email)
};

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'password is required'],
    },
    role: {
        type: String,
        required: [true, 'role is required'],
    }
});

// @ts-ignore
export const UserModel: Model<MIUser> = model('User', UserSchema);
