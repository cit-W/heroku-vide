class CustomError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.status = options.status || 500;
        this.code = options.code || 'INTERNAL_ERROR';
    }
}

class ValidationError extends CustomError {
    constructor(message) {
        super(message, { status: 400, code: 'VALIDATION_ERROR' });
    }
}

class DatabaseError extends CustomError {
    constructor(message) {
        super(message, { status: 500, code: 'DATABASE_ERROR' });
    }
}

class NotFoundError extends CustomError {
    constructor(message) {
        super(message, { status: 404, code: 'NOT_FOUND' });
    }
}