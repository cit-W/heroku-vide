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

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof CustomError) {
        return res.status(err.status).json({
            success: false,
            error: {
            code: err.code,
            message: err.message
            }
        });
    }

    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        }
    });
};

class UnauthorizedError extends CustomError {
    constructor(message) {
        super(message, { status: 401, code: 'UNAUTHORIZED' });
    }
}

export {
    errorHandler,
    CustomError,
    ValidationError,
    DatabaseError,
    NotFoundError,
    UnauthorizedError
}; 