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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const aws_sdk_1 = require("aws-sdk");
const cors_1 = __importDefault(require("cors"));
const dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const validateDateRange = (start, end) => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
        return null;
    }
    return [startTimestamp, endTimestamp];
};
const getExclusiveStartKey = (pageNum, lastEvaluatedType, lastEvaluatedRegistration) => {
    if (pageNum > 1) {
        return {
            Type: lastEvaluatedType,
            Registration: Number(lastEvaluatedRegistration),
        };
    }
    return undefined;
};
const getQueryParams = (req) => {
    const { page, limit, type, registrationStart, registrationEnd } = req.params;
    const { lastEvaluatedType, lastEvaluatedRegistration } = req.query;
    return { page, limit, type, registrationStart, registrationEnd, lastEvaluatedType, lastEvaluatedRegistration };
};
app.get('/events/:page/:limit/:type/:registrationStart/:registrationEnd/:lastEvaluatedType?/:lastEvaluatedRegistration?', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, type, registrationStart, registrationEnd, lastEvaluatedType, lastEvaluatedRegistration } = getQueryParams(req);
    const dateRange = validateDateRange(registrationStart, registrationEnd);
    if (!dateRange) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    const [startTimestamp, endTimestamp] = dateRange;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const exclusiveStartKey = getExclusiveStartKey(pageNum, lastEvaluatedType, lastEvaluatedRegistration);
    const params = {
        TableName: process.env.EVENTS_TABLE_NAME,
        KeyConditionExpression: '#type = :type AND #registration BETWEEN :startTimestamp AND :endTimestamp',
        ExpressionAttributeNames: {
            '#registration': 'Registration',
            '#type': 'Type',
        },
        ExpressionAttributeValues: {
            ':startTimestamp': startTimestamp,
            ':endTimestamp': endTimestamp,
            ':type': type,
        },
        Limit: limitNum,
        ExclusiveStartKey: exclusiveStartKey,
    };
    try {
        const result = yield dynamoDb.query(params).promise();
        return res.status(200).json({
            page: pageNum,
            limit: limitNum,
            totalItems: result.Count || 0,
            totalPages: Math.ceil((result.Count || 0) / limitNum),
            items: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey,
        });
    }
    catch (error) {
        console.error('Error retrieving events:', error);
        return res.status(500).json({ error: 'Could not retrieve events' });
    }
}));
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
exports.handler = (0, serverless_http_1.default)(app);
