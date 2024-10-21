import serverless from "serverless-http";
import express, { Request, Response } from "express";
import { SQS } from "aws-sdk";
import cors from "cors";
import { registerEventLogSchema } from "../validators/event-log-validator";
import { BusinessException } from "../exceptions/bussines";

const app = express();
app.use(express.json());
app.use(cors());

const sqs = new SQS();

export const validateEventLog = (body: any): void => {
  const { error } = registerEventLogSchema.validate(body);
  if (error) {
      throw new BusinessException(`Validation Error: ${error.details[0].message}`);
  }
};

const createSqsParams = (body: any): { MessageBody: string; QueueUrl: string } => {
    return {
        MessageBody: JSON.stringify(body),
        QueueUrl: process.env.EVENTS_QUEUE_URL as string,
    };
};

const enqueueMessage = async (params: { MessageBody: string; QueueUrl: string }): Promise<void> => {
    await sqs.sendMessage(params).promise();
};

app.post("/events", async (req: Request, res: Response) => {
    try {
        validateEventLog(req.body);

        const params = createSqsParams(req.body);
        await enqueueMessage(params);

        return res.status(200).json({
            message: "Message enqueued successfully!",
        });
    } catch (error: any) {
        console.error("Error enqueuing message:", error);
        if (error instanceof BusinessException) {
            return res.status(error.statusCode).json({
                error: error.message,
            });
        }

        return res.status(500).json({
            error: "Failed to enqueue message",
        });
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
});

export const handler = serverless(app);
