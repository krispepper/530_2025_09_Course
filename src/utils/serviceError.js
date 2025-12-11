// Shared error type that lets services signal HTTP status codes to controllers.
class ServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "ServiceError";
        this.statusCode = statusCode;
    }
}

module.exports = { ServiceError };
