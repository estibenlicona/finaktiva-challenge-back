export class BusinessException extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "BusinessException";
        this.statusCode = statusCode;
        Error.captureStackTrace(this, BusinessException);
    }
}