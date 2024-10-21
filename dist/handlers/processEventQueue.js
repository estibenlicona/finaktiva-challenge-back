"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const ulid_1 = require("ulid");
const dynamoDB = new aws_sdk_1.DynamoDB.DocumentClient();
const getTableName = () => {
    const tableName = process.env.EVENTS_TABLE_NAME;
    if (!tableName) {
        throw new Error('EVENTS_TABLE_NAME environment variable is required.');
    }
    return tableName;
};
const parseEventMessage = (body) => {
    try {
        const eventMessage = JSON.parse(body);
        if (!eventMessage.Type) {
            throw new Error('Missing Type in the event log.');
        }
        return eventMessage;
    }
    catch (error) {
        throw new Error(`Failed to parse event message: ${error.message}`);
    }
};
const createEventLogItem = (eventMessage) => {
    const generatedUlid = (0, ulid_1.ulid)();
    return {
        TableName: getTableName(),
        Item: {
            Id: generatedUlid,
            Registration: (0, ulid_1.decodeTime)(generatedUlid),
            Type: eventMessage.Type,
            Description: eventMessage.Description,
        }
    };
};
const saveEventLog = (eventLogItem) => __awaiter(void 0, void 0, void 0, function* () {
    yield dynamoDB.put(eventLogItem).promise();
});
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (const record of event.Records) {
            const eventMessage = parseEventMessage(record.body);
            const eventLogItem = createEventLogItem(eventMessage);
            yield saveEventLog(eventLogItem);
        }
    }
    catch (error) {
        console.error("Error processing records:", error);
    }
});
exports.handler = handler;
