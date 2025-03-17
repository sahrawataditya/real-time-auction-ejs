import cookieParser from "cookie-parser";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import prisma from "./config/prisma.js";
import authMiddleware from "./middleware/authMiddleware.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Set up EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);

// Home Route
app.get("/", authMiddleware, async (req, res) => {
    try {
        const auctions = await prisma.auction.findMany({
            where: {
                endTime: {
                    gte: new Date()
                }
            },
            include: {
                bids: {
                    include: { user: true },
                    orderBy: { amount: 'desc' },
                },
                creator: true
            },
            orderBy: { createdAt: "desc" },
        });
        res.render("auction/index", { auctions, user: req.user });
    } catch (err) {
        console.log(err);
        res.status(500).render("500", { error: err });
    }
});

// Profile Route
app.get("/profile", authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            bids: {
                include: { auction: true },
                orderBy: { createdAt: "desc" },
            }
        },
    });
    res.render("profile", { user });
});

app.get("/leaderboard", authMiddleware, async (req, res) => {
    try {

        const auctions = await prisma.auction.findMany({
            where: {
                endTime: {
                    lte: new Date()
                },
                status: "closed",
                bids: { some: { amount: { gt: 0 } } },
            },
            select: {
                title: true,
                startPrice: true,
                id: true,
                status: true,
                bids: {
                    select: {
                        user: {
                            select: {
                                name: true,
                            }
                        },
                        amount: true,
                    },
                    orderBy: { amount: "desc" },
                },
                creator: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });
        const newAuctions = auctions.map(auction => {
            return {
                id: auction.id,
                title: auction.title,
                totalBids: auction.bids.length,
                startPrice: auction.startPrice,
                creator: auction.creator.name,
                highestBid: auction.bids[0].amount,
                highestBidder: auction.bids[0].user.name,
            }
        })
        res.render("leaderboard", { auctions: newAuctions, user: req.user });
    } catch (error) {
        console.log(error);
        res.status(500).render("500", { error: error });
    }
})
// 404 Handler
app.use((req, res) => {
    res.status(404).render("404");
});

// Error Handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).render("500");
});

export default app;
