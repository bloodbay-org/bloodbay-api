import {isNil, omitBy} from 'lodash';

import {UserModel} from '../../models/user';
import {MIUser} from '../../models/types';

export async function getAllUsers(): Promise<MIUser[]> {
    return UserModel.find({}).sort({_id: -1}).lean();
}

export async function getUserByEmail(email: string): Promise<MIUser> {
    return UserModel.findOne({email}).lean();
}

export async function getUserByUsername(username: string): Promise<MIUser> {
    return UserModel.findOne({username}).lean();
}

export async function deleteUserById(id: string): Promise<MIUser> {
    return UserModel.deleteOne({_id: id}).lean();
}

export async function createUser(email: string, password: string, username: string, role: string = 'USER'): Promise<MIUser> {
    return UserModel.create({
        username,
        email,
        password,
        role
    });
}

export async function updateUserEntry(id: string, email?: string, username?: string, password?: string): Promise<MIUser> {
    const fieldsToUpdate: IUserUpdates = {};
    if (email) {
        fieldsToUpdate.email = email
    }
    if (username) {
        fieldsToUpdate.username = username
    }
    if (password) {
        fieldsToUpdate.password = password
    }
    return UserModel.findOneAndUpdate(
        {
            _id: id,
        },
        omitBy(fieldsToUpdate, isNil),
        {new: false},
    ).lean();
}

interface IUserUpdates {
    username?: string,
    email?: string,
    password?: string,
}
