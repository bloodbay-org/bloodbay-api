import request from 'supertest';

import {server, closeMongoose} from '../../app';
import {getUserByEmail} from '../../services/user';
import {IUser} from "../../models/types";
import {CaseModel} from "../../models/case";
import {UserModel} from "../../models/user";
import {completeVerification, getEmailVerificationForUserId} from "../../services/emailVerification";

const testCaseToCreate = {
    title: 'Pfizer Side Effects',
    description: 'Muscle Twitches',
    tags: ['pfizer', 'moderna'],
    reportedByName: 'Nick Shulhin',
    country: 'Australia'
};

const testUserToCreate: IUser = {
    email: 'mshulhin@gmail.com',
    password: 'r1otPa$$1A',
    username: 'nickshulhin'
};

describe('Cases', () => {
    afterAll(async () => {
        await server.close();
        await closeMongoose();
    });
    beforeAll(async () => {
        await CaseModel.deleteMany({});
        await UserModel.deleteMany({});
    });
    afterEach(async () => {
        await CaseModel.deleteMany({});
        await UserModel.deleteMany({});
    });
    describe('POST /cases/', () => {
        it('should create new case in the system', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            //When
            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //Then
            expect(createdCase.reportedById).toBe(createdUser._id.toString());
            expect(createdCase.title).toBe(testCaseToCreate.title);
            expect(createdCase.description).toBe(testCaseToCreate.description);
            expect(createdCase.tags).toStrictEqual(testCaseToCreate.tags);
            expect(createdCase.reportedByName).toStrictEqual(testCaseToCreate.reportedByName);
        });
        it('should create new case in the system with tags', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            //When
            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //Then
            expect(createdCase.reportedById).toBe(createdUser._id.toString());
            expect(createdCase.title).toBe(testCaseToCreate.title);
            expect(createdCase.description).toBe(testCaseToCreate.description);
            expect(createdCase.tags).toStrictEqual(testCaseToCreate.tags);
            expect(createdCase.reportedByName).toStrictEqual(testCaseToCreate.reportedByName);
        });
    });
    describe('GET /cases/:caseId', () => {
        it('should retrieve case by caseId', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //When
            const fetchedCaseResult = await request(server).get(`/cases/${createdCase._id}`).expect(200);
            const fetchedCase = JSON.parse(fetchedCaseResult.text);

            //Then
            expect(fetchedCase.reportedById).toBe(createdUser._id.toString());
            expect(fetchedCase.title).toBe(testCaseToCreate.title);
            expect(fetchedCase.description).toBe(testCaseToCreate.description);
            expect(fetchedCase.tags).toStrictEqual(testCaseToCreate.tags);
            expect(fetchedCase.reportedByName).toStrictEqual(testCaseToCreate.reportedByName);
        });
    });
    describe('GET /cases/search', () => {
        it('should retrieve cases by matched tags', async () => {
            //Given
            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const testCaseToCreateUnmatched = {
                ...testCaseToCreate,
                title: 'Astra Side Effects',
                description: 'Blood clots',
                tags: ['astra', 'clots'],
                reportedByName: 'Jeffrey Goldman'
            };

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            await request(server).post('/cases/').send(testCaseToCreateUnmatched).set('token', authToken).expect(200);
            const createdMatchedCase = JSON.parse(createdCaseResult.text);

            //When
            const fetchedCaseResult = await request(server).get(`/cases/search`).query({tag: 'pfizer'}).expect(200);
            const matchedCases = JSON.parse(fetchedCaseResult.text);

            //Then
            expect(matchedCases.length).toBe(1);
            expect(matchedCases[0].reportedById).toBe(createdUser._id.toString());
            expect(matchedCases[0]._id).toBe(createdMatchedCase._id);
            expect(matchedCases[0].title).toBe(createdMatchedCase.title);
            expect(matchedCases[0].description).toBe(createdMatchedCase.description);
            expect(matchedCases[0].tags).toStrictEqual(createdMatchedCase.tags);
            expect(matchedCases[0].reportedByName).toStrictEqual(createdMatchedCase.reportedByName);
        });
        it('should retrieve all cases if no tags provided', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const testCaseToCreateUnmatched = {
                ...testCaseToCreate,
                title: 'Astra Side Effects',
                description: 'Blood clots',
                tags: ['astra', 'clots'],
                reportedByName: 'Jeffrey Goldman'
            };

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            await request(server).post('/cases/').send(testCaseToCreateUnmatched).set('token', authToken).expect(200);
            const createdMatchedCase = JSON.parse(createdCaseResult.text);

            //When
            const fetchedCaseResult = await request(server).get(`/cases/search`).query({tag: ''}).expect(200);
            const matchedCases = JSON.parse(fetchedCaseResult.text);

            //Then
            expect(matchedCases.length).toBe(2);
            expect(matchedCases[1].reportedById).toBe(createdUser._id.toString());
            expect(matchedCases[1]._id).toBe(createdMatchedCase._id);
            expect(matchedCases[1].title).toBe(createdMatchedCase.title);
            expect(matchedCases[1].description).toBe(createdMatchedCase.description);
            expect(matchedCases[1].tags).toStrictEqual(createdMatchedCase.tags);
            expect(matchedCases[1].reportedByName).toStrictEqual(createdMatchedCase.reportedByName);
        });
    });
    describe('GET /cases/', () => {
        it('should retrieve all cases', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //When
            const fetchedCasesResult = await request(server).get(`/cases/`).expect(200);
            const fetchedCases = JSON.parse(fetchedCasesResult.text);

            //Then
            expect(fetchedCases.length).toBe(1);
            expect(fetchedCases[0].reportedById).toBe(createdUser._id.toString());
            expect(fetchedCases[0].title).toBe(createdCase.title);
            expect(fetchedCases[0].description).toBe(createdCase.description);
            expect(fetchedCases[0].tags).toStrictEqual(testCaseToCreate.tags);
            expect(fetchedCases[0].reportedByName).toStrictEqual(testCaseToCreate.reportedByName);
        });
    });
    describe('GET /cases/?userId=', () => {
        it('should retrieve all cases reported by user', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //When
            const fetchedCasesResult = await request(server).get(`/cases`).query({userId: createdUser._id.toString()}).expect(200);
            const fetchedCases = JSON.parse(fetchedCasesResult.text);

            //Then
            expect(fetchedCases.length).toBe(1);
            expect(fetchedCases[0].reportedById).toBe(createdUser._id.toString());
            expect(fetchedCases[0].title).toBe(createdCase.title);
            expect(fetchedCases[0].description).toBe(createdCase.description);
            expect(fetchedCases[0].tags).toStrictEqual(createdCase.tags);
            expect(fetchedCases[0].reportedByName).toStrictEqual(createdCase.reportedByName);
        });
    });
    describe('DELETE /cases/:caseId', () => {
        it('should delete case by caseId', async () => {
            //Given

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)
            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);

            const createdCaseResult = await request(server).post('/cases/').send(testCaseToCreate).set('token', authToken).expect(200);
            const createdCase = JSON.parse(createdCaseResult.text);

            //When
            await request(server).delete(`/cases/${createdCase._id}`).set('token', authToken).expect(200);
            const fetchedCasesResult = await request(server).get(`/cases/`).expect(200);
            const fetchedCases = JSON.parse(fetchedCasesResult.text);

            //Then
            expect(fetchedCases.length).toBe(0);
        });
    });
});
