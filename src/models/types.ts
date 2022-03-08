import {Document} from 'mongoose';

export interface IUser {
    username: string,
    email: string,
    password: string,
    role?: string,
}

export interface MIUser extends IUser, Document {}

export interface ICase {
    reportedById: string
    reportedByName: string
    title: string
    description: string
    tags: string[]
}

export interface MICase extends ICase, Document {}

export interface IFile {
    uploadedById: string
    name: string
    linkedToId: string
}

export interface MIFile extends IFile, Document {}

export interface IEmailVerification {
    token: string
    userId: string
    verified: boolean
}

export interface MIEmailVerification extends IEmailVerification, Document {}
