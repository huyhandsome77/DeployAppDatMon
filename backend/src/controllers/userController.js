const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let where = {};

        if (search) {
            where = {
                [Op.or]: [
                    { fullName: { [Op.like]: `%${search}%` } },
                    { username: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { phone: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        if (role) where.role = role;
        if (status) where.status = status;

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['id', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, email, phone, avatar } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        await user.update({
            fullName: fullName || user.fullName,
            email: email || user.email,
            phone: phone || user.phone,
            avatar: avatar || user.avatar
        });

        res.json({ message: "Cập nhật hồ sơ thành công", user });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { fullName, email, phone, username, password, role } = req.body;

        const userExists = await User.findOne({
            where: {
                [Op.or]: [{ username }, { phone }]
            }
        });

        if (userExists) {
            return res.status(400).json({ message: "Tài khoản hoặc số điện thoại đã tồn tại" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            phone,
            username,
            password: hashedPassword,
            role: role || "CUSTOMER"
        });

        res.status(201).json({
            message: "Tạo người dùng thành công",
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                username: newUser.username
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const targetUserId = Number(req.params.id);
        const currentUserId = req.user ? req.user.id : null;
        const currentUserRole = req.user ? String(req.user.role).toUpperCase() : 'STAFF';

        const user = await User.findByPk(targetUserId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        // BUG-USR-02 Defense: Prevent admin from blocking self
        if (currentUserId && currentUserId === targetUserId && req.body.status === 'INACTIVE') {
            return res.status(400).json({ message: "Bạn không thể tự khóa tài khoản của chính mình" });
        }

        // BUG-USR-01 Defense: DTO Sanitization & Mass Assignment Prevention
        const updateData = {};

        if (currentUserRole === 'ADMIN') {
            if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
            if (req.body.email !== undefined) updateData.email = req.body.email;
            if (req.body.phone !== undefined) updateData.phone = req.body.phone;
            if (req.body.username !== undefined) updateData.username = req.body.username;
            if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
            if (req.body.points !== undefined) updateData.points = Number(req.body.points);
            if (req.body.role !== undefined) updateData.role = req.body.role;
            if (req.body.status !== undefined) updateData.status = req.body.status;
        } else {
            // Non-admin roles (e.g. STAFF) can ONLY update points, fullName, phone, avatar
            if (req.body.points !== undefined) updateData.points = Number(req.body.points);
            if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
            if (req.body.phone !== undefined) updateData.phone = req.body.phone;
            if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
        }

        await user.update(updateData);

        const updatedUser = await User.findByPk(targetUserId, {
            attributes: { exclude: ['password'] }
        });

        res.json({ message: "Cập nhật thành công", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const targetUserId = Number(req.params.id);
        const currentUserId = req.user ? req.user.id : null;

        // BUG-USR-02 Defense: Prevent self deletion
        if (currentUserId && currentUserId === targetUserId) {
            return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của chính mình" });
        }

        const user = await User.findByPk(targetUserId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        await user.destroy();
        res.json({ message: "Xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserProfile,
    updateProfile,
    createUser,
    updateUser,
    deleteUser
};
