import http from "http";
import { Server as socketIo } from "socket.io";
("socket.io");
import app from "./app.js";
import prisma from "./config/prisma.js";
const server = http.createServer(app);
import cron from "node-cron";
const io = new socketIo(server);

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

cron.schedule("* * * * *", async () => {
  try {
    const newAuctions = await prisma.auction.findMany({
      where: {
        endTime: {
          lte: new Date(),
        },
        bids: {
          some: {
            amount: {
              gt: 0,
            },
          },
        },
        status: "open",
      },
    });
    if (newAuctions.length > 0) {
      const updatedAuctions = await Promise.all(
        newAuctions.map(async (auction) => {
          return await prisma.auction.update({
            where: {
              id: auction.id,
              status: "open",
              endTime: { lte: new Date() },
            },
            data: { status: "closed" },
            include: {
              bids: { include: { user: true }, orderBy: { amount: "desc" } },
              creator: true,
            },
          });
        })
      );
      const finalAuctions = updatedAuctions.map((auction) => {
        return {
          id: auction.id,
          title: auction.title,
          startPrice: auction.startPrice,
          creator: auction.creator.name,
          highestBid: auction.bids[0]?.amount || 0,
          totalBids: auction.bids.length,
          highestBidder: auction.bids[0]?.user.name || "No bids",
          status: auction.status,
        };
      });
      io.emit("leaderboardUpdate", finalAuctions);
    }
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await prisma
    .$connect()
    .then(() => console.log("Database connected 🚀"))
    .catch((err) => console.log(err));
});

export default io;
