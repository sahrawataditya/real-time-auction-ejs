import prisma from "../config/prisma.js";

// Create Auction Controller
const createAuction = async (req, res) => {
    const { title, description, startPrice, endTime } = req.body;
    const userId = req.user.id;

    try {
        // Create auction in database
        const newAuction = await prisma.auction.create({
            data: {
                title,
                description,
                startPrice: parseFloat(startPrice),
                endTime: new Date(endTime),
                creatorId: userId,
            },
            include: { bids: true },
        });
        req.io.emit('new-auction', { title, description, startPrice, endTime, id: newAuction.id, bids: newAuction.bids, creator: req.user });
        // Redirect to home page
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('auction/create', { error: 'Something went wrong' });
    }
};

// Get Auction Details Controller
const getAuctionDetails = async (req, res) => {
    const auctionId = req.params.id

    try {
        // Find auction by ID
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                    include: { user: true },
                    orderBy: { amount: 'desc' },
                },
            },
        });

        if (!auction) {
            return res.status(404).render('404');
        }
        if (new Date() > new Date(auction.endTime)) {
            return res.status(400).render('auction/details', {
                auction,
                user: req.user,
                error: 'Auction has ended',
            });
        }
        res.render('auction/details', { auction, user: req.user });
    } catch (err) {
        console.log(err);
        res.status(500).render('500');
    }
};

export { createAuction, getAuctionDetails };