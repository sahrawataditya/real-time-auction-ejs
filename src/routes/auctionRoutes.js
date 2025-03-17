import express from 'express';
import { createAuction, getAuctionDetails } from '../controllers/auctionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create Auction Page (Protected Route)
router.get('/create', authMiddleware, (req, res) => {
    res.render('auction/create', { user: req.user });
});

// Create Auction Form Submission (Protected Route)
router.post('/create', authMiddleware, createAuction);

// Auction Details Page
router.get('/:id', authMiddleware, getAuctionDetails);

export default router;