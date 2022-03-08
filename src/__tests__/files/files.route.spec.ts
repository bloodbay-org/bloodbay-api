import request from 'supertest';

import {server, closeMongoose} from '../../app';
import {IUser} from "../../models/types";
import {UserModel} from "../../models/user";
import {FileModel} from "../../models/file";
import {deleteAllFilesForTestEnvironmentOnly} from "../../utils/storage";
import {getUserByEmail} from "../../services/user";
import {completeVerification, getEmailVerificationForUserId} from "../../services/emailVerification";

describe('Files', () => {
    afterAll(async () => {
        await server.close();
        await closeMongoose();
    });
    beforeAll(async () => {
        await FileModel.deleteMany({});
        await UserModel.deleteMany({});
        await deleteAllFilesForTestEnvironmentOnly()
    });
    afterEach(async () => {
        await FileModel.deleteMany({});
        await UserModel.deleteMany({});
        await deleteAllFilesForTestEnvironmentOnly()
    });
    describe('POST /files/?linkedToId=', () => {
        it('should upload new file', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            const testCaseToCreate = {
                title: 'Pfizer Side Effects',
                description: 'Muscle Twitches',
                tags: ['pfizer', 'moderna'],
                reportedByName: 'Nick Shulhin'
            };

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

            const testFileBuffer = Buffer.from('test-data-content');

            //When
            const createdFilesResult = await request(server).post('/files/')
                .set('token', authToken)
                .query({linkedToId: createdCase._id})
                .attach('files', testFileBuffer, 'test_file_name.txt')
                .expect(200);

            const createdFiles = JSON.parse(createdFilesResult.text);

            //Then
            expect(createdFiles.length).toBe(1);
            expect(createdFiles[0].uploadedById).toBe('test_file_name.txt');
            expect(createdFiles[0].linkedToId).toBe(createdCase._id);
        });
    });
    describe('POST /files/?linkedToId=', () => {
        it('should throw an error linking file to non-existent resource', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            await request(server).post('/auth/register').send(testUserToCreate).expect(200);
            const createdUser = await getUserByEmail(testUserToCreate.email)
            const verificationRequest = await getEmailVerificationForUserId(createdUser._id)
            await completeVerification(verificationRequest.token)

            const result = await request(server).post('/auth/login').send({
                email: testUserToCreate.email,
                password: testUserToCreate.password
            }).expect(200);

            const authToken = JSON.parse(result.text);
            const testFileBuffer = Buffer.from('test-data-content');

            //When
            const createdFilesResult = await request(server).post('/files/')
                .set('token', authToken)
                .query({linkedToId: '6225a318424f8e43f330de34'})
                .attach('files', testFileBuffer, 'test_file_name.txt')
                .expect(412);

            const response = JSON.parse(createdFilesResult.text);

            //Then
            expect(response.error).toBe('File should be linked to existing case.');
        });
    });
    describe('GET /files/?caseId=', () => {
        it('should fetch linked to existing case file', async () => {
            //Given
            const testUserToCreate: IUser = {
                email: 'mshulhin@gmail.com',
                password: 'r1otPa$$1A',
                username: 'nickshulhin',
            };

            const testCaseToCreate = {
                title: 'Pfizer Side Effects',
                description: 'Muscle Twitches',
                tags: ['pfizer', 'moderna'],
                reportedByName: 'Nick Shulhin'
            };

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

            const testFileBuffer = Buffer.from('test-data-content');
            await request(server).post('/files/')
                .set('token', authToken)
                .query({linkedToId: createdCase._id})
                .attach('files', testFileBuffer, 'test_file_name.txt')
                .expect(200);

            //When
            const fetchedFilesResponse = await request(server).get('/files/')
                .query({caseId: createdCase._id})
                .expect(200);

            const fetchedFilesResult = JSON.parse(fetchedFilesResponse.text);

            //Then
            expect(fetchedFilesResult.length).toBe(1);
            expect(fetchedFilesResult[0].mediaLink).toBeTruthy();
            expect(fetchedFilesResult[0].name).toBeTruthy();
            expect(fetchedFilesResult[0].timeCreated).toBeTruthy();
            expect(fetchedFilesResult[0].size).toBeTruthy();
        });
    });
});
