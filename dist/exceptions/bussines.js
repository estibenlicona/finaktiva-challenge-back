"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = void 0;
class BusinessException extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "BusinessException";
        this.statusCode = statusCode;
        Error.captureStackTrace(this, BusinessException);
    }
}
exports.BusinessException = BusinessException;
