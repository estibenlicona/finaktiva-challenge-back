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
exports.handler = exports.validateEventLog = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const express_1 = __importDefault(require("express"));
const aws_sdk_1 = require("aws-sdk");
const cors_1 = __importDefault(require("cors"));
const event_log_validator_1 = require("../validators/event-log-validator");
const bussines_1 = require("../exceptions/bussines");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const sqs = new aws_sdk_1.SQS();
const validateEventLog = (body) => {
    const { error } = event_log_validator_1.registerEventLogSchema.validate(body);
    if (error) {
        throw new bussines_1.BusinessException(`Validation Error: ${error.details[0].message}`);
    }
};
exports.validateEventLog = validateEventLog;
const createSqsParams = (body) => {
    return {
        MessageBody: JSON.stringify(body),
        QueueUrl: process.env.EVENTS_QUEUE_URL,
    };
};
const enqueueMessage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    yield sqs.sendMessage(params).promise();
});
app.post("/events", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, exports.validateEventLog)(req.body);
        const params = createSqsParams(req.body);
        yield enqueueMessage(params);
        return res.status(200).json({
            message: "Message enqueued successfully!",
        });
    }
    catch (error) {
        console.error("Error enqueuing message:", error);
        if (error instanceof bussines_1.BusinessException) {
            return res.status(error.statusCode).json({
                error: error.message,
            });
        }
        return res.status(500).json({
            error: "Failed to enqueue message",
        });
    }
}));
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
exports.handler = (0, serverless_http_1.default)(app);
