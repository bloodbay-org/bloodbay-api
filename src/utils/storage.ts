import {Storage} from '@google-cloud/storage'
import config from "../config/config.json";

const storage = new Storage({
    projectId: 'bloodbay-org'
});

const bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : config.storage.bucketName;


export interface FileMetadata {
    mediaLink: string
    name: string
    timeCreated: string
    size: string
}

export interface UploadFileParams {
    fileName: string
    fileContent: Buffer
}

export interface GetFileByNameParams {
    fileName: string
}

export const uploadFile = async (params: UploadFileParams): Promise<any> => {
    const {fileName, fileContent} = params
    return await storage.bucket(bucketName).file(fileName).save(fileContent)
}

export const getFileById = async (params: GetFileByNameParams): Promise<FileMetadata|null> => {
    const {fileName} = params
    const metadata = await storage.bucket(bucketName).file(fileName).getMetadata()
    const fileMetadata = metadata.filter(meta => meta['kind'] === 'storage#object').map(meta => {
        return {
            mediaLink: meta['mediaLink'],
            name: meta['name'],
            timeCreated: meta['timeCreated'],
            size: meta['size']
        }
    })
    return fileMetadata.length >= 1 ? fileMetadata[0] : null
}

export const deleteAllFilesForTestEnvironmentOnly = async (): Promise<any> => {
    if (process.env.NODE_ENV !== 'test') {
        return Promise.reject('Cannot be executed in non-test environment.')
    }
    return await storage.bucket(bucketName).deleteFiles()
}