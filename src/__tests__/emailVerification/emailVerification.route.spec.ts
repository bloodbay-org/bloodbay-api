import request from 'supertest';

import {server, closeMongoose} from '../../app';
import {createUser, getUserByEmail} from '../../services/user';
import {IUser} from "../../models/types";
import {EmailVerificationModel} from "../../models/emailVerification";
import {UserModel} from "../../models/user";
import {addPendingEmailVerification, getEmailVerification} from "../../services/emailVerification";
import {v4 as uuidv4} from 'uuid';
import {hashPassword} from "../../routes/auth/handlers";

describe('EmailVerification', () => {
    afterAll(async () => {
        await server.close();
        await closeMongoose();
    });
    afterEach(async () => {
        await EmailVerificationModel.deleteMany({});
        await UserModel.deleteMany({});
    });
    describe('POST /verify', () => {
        it('should verify new user in the system', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };
            const verificationToken = uuidv4()

            const encryptedPassword = await hashPassword(testUserToCreate.password);
            const createdUser = await createUser(testUserToCreate.email, encryptedPassword, testUserToCreate.username)
            await addPendingEmailVerification(verificationToken, createdUser._id)

            //When
            await request(server)
                .post('/verify')
                .send(testUserToCreate)
                .query({token: verificationToken})
                .expect(200);

            const verificationRequest = await getEmailVerification(verificationToken)

            //Then
            expect(verificationRequest.userId).toBe(createdUser._id.toString());
            expect(verificationRequest.token).toBe(verificationToken);
            expect(verificationRequest.verified).toBe(true);
        });
    });
});
