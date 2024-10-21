import { DynamoDB } from 'aws-sdk';
import { ulid, decodeTime } from 'ulid';
import { EventLog } from '../types/event-log';
import { PutItemInput, PutItemInputAttributeMap } from 'aws-sdk/clients/dynamodb';

const dynamoDB = new DynamoDB.DocumentClient();

const getTableName = (): string => {
    const tableName = process.env.EVENTS_TABLE_NAME;
    if (!tableName) {
        throw new Error('EVENTS_TABLE_NAME environment variable is required.');
    }
    return tableName;
};

const parseEventMessage = (body: string): EventLog => {
    try {
        const eventMessage: EventLog = JSON.parse(body);
        if (!eventMessage.Type) {
            throw new Error('Missing Type in the event log.');
        }
        return eventMessage;
    } catch (error: any) {
        throw new Error(`Failed to parse event message: ${error.message}`);
    }
};

const createEventLogItem = (eventMessage: EventLog): PutItemInput => {
    const generatedUlid = ulid();
    return {
        TableName: getTableName(),
        Item: {
            Id: generatedUlid,
            Registration: decodeTime(generatedUlid),
            Type: eventMessage.Type,
            Description: eventMessage.Description,
        } as PutItemInputAttributeMap
    };
};

const saveEventLog = async (eventLogItem: PutItemInput): Promise<void> => {
    await dynamoDB.put(eventLogItem).promise();
};

export const handler = async (event: { Records: { body: string }[] }): Promise<void> => {
    try {
        for (const record of event.Records) {
            const eventMessage = parseEventMessage(record.body);
            const eventLogItem = createEventLogItem(eventMessage);
            await saveEventLog(eventLogItem);
        }
    } catch (error: any) {
        console.error("Error processing records:", error);
    }
};
