import {MIEmailVerification} from '../../models/types';
import {EmailVerificationModel} from "../../models/emailVerification";
import {isNil, omitBy} from "lodash";

export async function getEmailVerificationForUserId(userId: string): Promise<MIEmailVerification> {
    return EmailVerificationModel.findOne({
        userId,
    }).lean();
}

export async function getEmailVerification(token: string): Promise<MIEmailVerification> {
    return EmailVerificationModel.findOne({
        token,
    }).lean();
}

export async function addPendingEmailVerification(token: string, userId: string): Promise<MIEmailVerification> {
    return EmailVerificationModel.create({
        token,
        userId,
        verified: false
    });
}

export async function completeVerification(token: string): Promise<MIEmailVerification> {
    const fieldsToUpdate = {
        verified: true
    }
    return EmailVerificationModel.findOneAndUpdate(
        {
            token,
        },
        omitBy(fieldsToUpdate, isNil),
        {new: false},
    ).lean();
}
