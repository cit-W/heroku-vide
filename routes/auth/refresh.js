import express from 'express';
import { verifyRefreshToken } from '../../models/Authentication.js';
import pool from '../../config/db.js';

const router = express.Router();

router.post('/refresh-token', async (req, res, next) => {
  console.log("RefreshToken")
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token no proporcionado' });
  }

  const client = await pool.connect();
  try {
    const accessToken = await verifyRefreshToken(refreshToken, client);
    if (accessToken) {
      res.json({ success: true, accessToken });
    } else {
      res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
});

export default router;
