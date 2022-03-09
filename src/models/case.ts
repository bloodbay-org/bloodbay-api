'use strict';

import {Model, model, Schema} from 'mongoose';

import {MICase} from './types';

const CaseSchema = new Schema({
    country: {
        type: String,
        required: [true, 'country is required'],
    },
    reportedByName: {
        type: String,
        required: [true, 'reportedByName is required'],
    },
    reportedById: {
        type: String,
        required: [true, 'reportedById is required'],
    },
    title: {
        type: String,
        required: [true, 'title is required'],
    },
    description: {
        type: String,
        required: [true, 'description is required'],
    },
    tags: [{
        type: String
    }]
});

// @ts-ignore
export const CaseModel: Model<MICase> = model('Case', CaseSchema);
