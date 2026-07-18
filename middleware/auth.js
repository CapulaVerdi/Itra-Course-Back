import { prisma } from "../db.js";

const requireAuth = async (req, res, next) => {
    const email = req.headers['x-user-email'];
    if (!email) {
        res.status(401).json({error: "unauthorized"})
        return
    }
    const user = await prisma.user.findUnique({
        where: {email: email}
    })
    if (!user) {
        res.status(401).json({error: "unauthorized"})
        return
    }
    req.user = user
    next();
}

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        res.status(403).json({error: "access denied"})
        return
    }
    next();
}

export { requireAuth, requireRole }