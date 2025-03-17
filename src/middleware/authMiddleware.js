import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import io from '../server.js';
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.redirect('/auth/login');
        }
        req.io = io;
        req.user = user;
        next();
    } catch (err) {
        res.clearCookie('token');
        res.redirect('/auth/login');
    }
};

export default authMiddleware;