import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/CustomError.js';

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('La variable de entorno SECRET_KEY no está definida.');
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Token requerido'));
  }

  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      return next(new UnauthorizedError('Token inválido o expirado'));
    }

    req.user = user;
    next();
  });
};

export { verifyToken };