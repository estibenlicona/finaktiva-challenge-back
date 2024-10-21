"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventLogSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerEventLogSchema = joi_1.default.object({
    Description: joi_1.default.string().required(),
    Type: joi_1.default.string().required()
});
