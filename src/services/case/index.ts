import {isNil, omitBy} from 'lodash';

import {MICase} from '../../models/types';
import {CaseModel} from "../../models/case";

export async function getAllCases(): Promise<MICase[]> {
    return CaseModel.find({}).sort({_id: -1}).lean();
}

export async function searchCasesByTag(tag: string): Promise<MICase[]> {
    return CaseModel.find( { tags: tag } ).lean();
}

export async function getCasesByReportedUserId(id: string): Promise<MICase[]> {
    return CaseModel.find({reportedById: id}).lean();
}

export async function getCaseById(id: string): Promise<MICase> {
    return CaseModel.findOne({_id: id}).lean();
}

export async function deleteCaseById(id: string): Promise<MICase> {
    return CaseModel.deleteOne({_id: id}).lean();
}

export async function createCase(reportedById: string, title: string, description: string, tags: string[], reportedByName: string, country: string): Promise<MICase> {
    return CaseModel.create({
        country,
        reportedById,
        title,
        description,
        tags,
        reportedByName
    });
}

export async function updateCaseEntry(id: string, title?: string, description?: string): Promise<MICase> {
    const fieldsToUpdate: ICaseUpdates = {};
    if (title) {
        fieldsToUpdate.title = title
    }
    if (description) {
        fieldsToUpdate.description = description
    }
    return CaseModel.findOneAndUpdate(
        {
            _id: id,
        },
        omitBy(fieldsToUpdate, isNil),
        {new: false},
    ).lean();
}

interface ICaseUpdates {
    title?: string,
    description?: string,
}
