import jwt from 'jsonwebtoken';
const SECRET_KEY = process.env.SECRET_KEY;

// --------------------
// Clases de errores personalizados
// --------------------
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

class UnauthorizedError extends CustomError {
    constructor(message) {
        super(message, { status: 401, code: 'UNAUTHORIZED' });
    }
}

// --------------------
// Middleware para manejo de errores
// --------------------
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

// --------------------
// Middleware para verificar JWT
// --------------------
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer <token>"

    if (!token) {
        return next(new UnauthorizedError('Token requerido'));
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return next(new UnauthorizedError('Token inválido o expirado'));
        }

        req.user = user; // Información decodificada disponible en req.user
        next();
    });
};

// --------------------
// Exportaciones
// --------------------
export {
    errorHandler,
    verifyToken,
    CustomError,
    ValidationError,
    DatabaseError,
    NotFoundError,
    UnauthorizedError
};
