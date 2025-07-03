import {
  CustomError,
} from '../errors/CustomError.js';

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof CustomError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

export { errorHandler };