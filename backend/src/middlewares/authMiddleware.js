const jwt = require("jsonwebtoken");

require("dotenv").config();

exports.verifyToken = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                message: "No token"
            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret_key'
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }

};

exports.optionalVerifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret_key'
        );
        req.user = decoded;
        next();
    } catch (error) {
        // Nếu token sai hoặc hết hạn, vẫn coi là khách vãng lai thay vì chặn lại
        req.user = null;
        next();
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.toUpperCase() === "ADMIN") {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Admin only."
        });
    }
};

exports.isStaffOrAdmin = (req, res, next) => {
    const role = req.user?.role?.toUpperCase();
    if (role === "ADMIN" || role === "STAFF") {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Staff or Admin only."
        });
    }
};