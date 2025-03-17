import express from 'express';
import { placeBid } from '../controllers/bidController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:id/bid', authMiddleware, placeBid);

export default router;