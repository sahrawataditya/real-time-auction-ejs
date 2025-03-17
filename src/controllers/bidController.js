import prisma from "../config/prisma.js";

const placeBid = async (req, res) => {
    const auctionId = req.params.id
    const { amount } = req.body;
    const userId = req.user.id;
    try {
        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { bids: true },
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

        // Find highest bid
        const highestBid = auction.bids.length > 0 ? auction.bids[0].amount : auction.startPrice;

        // Validate bid amount
        if (parseFloat(amount) <= highestBid) {
            return res.status(400).render('auction/details', {
                auction,
                user: req.user,
                error: 'Bid must be higher than the current highest bid',
            });
        }

        // Create bid in database
        const newBid = await prisma.bid.create({
            data: {
                amount: parseFloat(amount),
                userId,
                auctionId,
            },
            include: { user: true },
        });

        const updatedAuction = await prisma.auction.findUnique({
            where: { id: auctionId },
            include: { bids: true },
        });
        // Emit real-time update
        req.io.emit('new-bid', { newBidAmount: amount, bidderName: newBid.user.name, createdAt: newBid.createdAt });

        req.io.emit('bid-placed', {
            auctionId: updatedAuction.id,
            totalBids: updatedAuction.bids.length,
        });
        // Redirect to auction details page
        res.redirect(`/auctions/${auctionId}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('500');
    }
};

export { placeBid };