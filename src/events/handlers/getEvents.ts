import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import { DynamoDB } from 'aws-sdk';
import cors from 'cors';

const dynamoDb = new DynamoDB.DocumentClient();
const app = express();

app.use(express.json());
app.use(cors());

const validateDateRange = (start: string, end: string): [number, number] | null => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
        return null;
    }

    return [startTimestamp, endTimestamp];
};

const getExclusiveStartKey = (pageNum: number, lastEvaluatedType?: any, lastEvaluatedRegistration?: any) => {
    if (pageNum > 1) {
        return {
            Type: lastEvaluatedType,
            Registration: Number(lastEvaluatedRegistration),
        };
    }
    return undefined;
};

const getQueryParams = (req: Request) => {
    const { page, limit, type, registrationStart, registrationEnd } = req.params;
    const { lastEvaluatedType, lastEvaluatedRegistration } = req.query;
    return { page, limit, type, registrationStart, registrationEnd, lastEvaluatedType, lastEvaluatedRegistration };
};

app.get('/events/:page/:limit/:type/:registrationStart/:registrationEnd/:lastEvaluatedType?/:lastEvaluatedRegistration?', async (req: Request, res: Response) => {
    const { page, limit, type, registrationStart, registrationEnd, lastEvaluatedType, lastEvaluatedRegistration } = getQueryParams(req);

    const dateRange = validateDateRange(registrationStart, registrationEnd);
    if (!dateRange) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    const [startTimestamp, endTimestamp] = dateRange;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const exclusiveStartKey = getExclusiveStartKey(pageNum, lastEvaluatedType, lastEvaluatedRegistration);

    const params: DynamoDB.DocumentClient.QueryInput = {
        TableName: process.env.EVENTS_TABLE_NAME!,
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
        const result = await dynamoDb.query(params).promise();
        return res.status(200).json({
            page: pageNum,
            limit: limitNum,
            totalItems: result.Count || 0,
            totalPages: Math.ceil((result.Count || 0) / limitNum),
            items: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey,
        });
    } catch (error) {
        console.error('Error retrieving events:', error);
        return res.status(500).json({ error: 'Could not retrieve events' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

export const handler = serverless(app);
