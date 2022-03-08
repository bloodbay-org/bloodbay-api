import {MIFile} from '../../models/types';
import {FileModel} from "../../models/file";


export async function createFileLink(uploadedById: string, name: string, linkedToId: string): Promise<MIFile> {
    return FileModel.create({
        uploadedById,
        name,
        linkedToId
    });
}

export async function getFileLinks(caseId: string): Promise<MIFile[]> {
    return FileModel.find({linkedToId: caseId}).lean();
}
