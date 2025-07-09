import express from 'express';
import pool from '../../config/db.js';
import User from '../../models/User.js';

const router = express.Router();

router.get('/verify-email', async (req, res, next) => {
  const { token } = req.query;
  const client = await pool.connect();
  try {
    const user = await User.verifyEmail(token, client);
    if (user) {
      res.json({ success: true, message: 'Email verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
});

export default router;
