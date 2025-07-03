import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/CustomError.js';
const SECRET_KEY = process.env.SECRET_KEY;

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

export { verifyToken };
