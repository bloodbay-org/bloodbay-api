'use strict';

import {Model, model, Schema} from 'mongoose';

import {MIFile} from './types';

const FileSchema = new Schema({
    uploadedById: {
        type: String,
        required: [true, 'uploadedById is required'],
    },
    name: {
        type: String,
        required: [true, 'name is required'],
    },
    linkedToId: {
        type: String,
        required: [true, 'linkedToId is required'],
    }
});

// @ts-ignore
export const FileModel: Model<MIFile> = model('File', FileSchema);
