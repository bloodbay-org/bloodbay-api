import request from 'supertest';
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'

import {server, closeMongoose} from '../../app';
import {UserModel} from '../../models/user';
import {getUserByEmail} from '../../services/user';
import {IUser} from "../../models/types";
import config from '../../config/config.json';
import {
    completeVerification,
    getEmailVerificationForUserId
} from "../../services/emailVerification";
import {EmailVerificationModel} from "../../models/emailVerification";

describe('Auth', () => {
    afterAll(async () => {
        await server.close();
        await closeMongoose();
    });
    beforeAll(async () => {
        await UserModel.deleteMany({});
        await EmailVerificationModel.deleteMany({});
    });
    afterEach(async () => {
        await UserModel.deleteMany({});
        await EmailVerificationModel.deleteMany({});
    });
    describe('POST /auth/register', () => {
        it('should register a new user in the system', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            //When
            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const matchedPasswords = await bcrypt.compare(testUserToCreate.password, createdUser.password)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)

            //Then
            expect(verificationRequest.userId).toBe(createdUser._id.toString());
            expect(verificationRequest.token).toBeTruthy();
            expect(verificationRequest.verified).toBe(false);
            expect(createdUser.email).toBe(testUserToCreate.email);
            expect(createdUser.username).toBe(testUserToCreate.username);
            expect(createdUser.password).toBeDefined();
            expect(matchedPasswords).toBeTruthy();
        });
    });
    describe('POST /auth/login', () => {
        it('should login with existing user credentials', async () => {
            //Given
            const testUserToLogin: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            await request(server).post('/auth/register').send(testUserToLogin).expect(200);
            const createdUser = await getUserByEmail(testUserToLogin.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)

            //When
            const result = await request(server).post('/auth/login').send({
                email: testUserToLogin.email,
                password: testUserToLogin.password
            }).expect(200);
            const authToken = JSON.parse(result.text);

            //Then
            try {
                jwt.verify(authToken, config.jwt_secret);
            } catch (error) {
                expect(error).toBeNaN()
            }
        });
    });
    describe('POST /auth/info', () => {
        it('should return info about user auth token', async () => {
            //Given
            const testUserToLogin: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            await request(server).post('/auth/register').send(testUserToLogin).expect(200);
            const createdUser = await getUserByEmail(testUserToLogin.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)

            const result = await request(server).post('/auth/login').send({
                email: testUserToLogin.email,
                password: testUserToLogin.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            //When
            const infoResult = await request(server).post('/auth/info').set('token', authToken).expect(200);
            const info = JSON.parse(infoResult.text);

            //Then
            expect(info.email).toBe(testUserToLogin.email)
            expect(info.username).toBe(testUserToLogin.username)
            expect(info.exp).toBeTruthy()
            expect(info.iat).toBeTruthy()
            expect(info.id).toBeTruthy()
        });
    });
    describe('POST /auth/info', () => {
        it('should return error on expired token', async () => {
            //Given
            const testUserToLogin: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            const authToken = jwt.sign(
                {id: 'test', email: testUserToLogin.email},
                config.jwt_secret,
                {
                    expiresIn: "0h",
                }
            );

            //When
            const infoResult = await request(server).post('/auth/info').set('token', authToken).expect(412);

            //Then
            expect(JSON.parse(infoResult.text).error).toBe("jwt expired")
        });
    });
    describe('POST /auth/reset', () => {
        it('should reset user password given email and an old one with a new one', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            const newPassword = 'root2'

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)

            //When
            await request(server).post('/auth/reset').send({
                email: testUserToCreate.email,
                oldPassword: testUserToCreate.password,
                newPassword,
            }).expect(200);

            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: newPassword
            }).expect(200);

            const authToken = JSON.parse(result.text);

            //Then
            try {
                const info: any = jwt.verify(authToken, config.jwt_secret);

                expect(info.email).toBe(testUserToCreate.email)
                expect(info.username).toBe(testUserToCreate.username)
                expect(info.exp).toBeTruthy()
                expect(info.iat).toBeTruthy()
                expect(info.id).toBeTruthy()
            } catch (error) {
                expect(error).toBeNaN()
            }
        });
    });
});
