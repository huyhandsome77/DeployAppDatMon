const { Category, Product } = require('../models');
const { Op } = require('sequelize');

exports.getAllCategories = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};

        if (search) {
            where = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        const categories = await Category.findAll({
            where,
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id']
            }]
        });

        // Map to include product count
        const result = categories.map(cat => {
            const data = cat.toJSON();
            data.productCount = data.products ? data.products.length : 0;
            delete data.products;
            return data;
        });

        res.json(result);
    } catch (error) {
        console.error("Get All Categories Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Not found" });
        res.json(category);
    } catch (error) {
        console.error("Get All Categories Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const [updated] = await Category.update(req.body, {
            where: { id: req.params.id }
        });
        if (!updated) return res.status(404).json({ message: "Not found" });
        const updatedCategory = await Category.findByPk(req.params.id);
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.destroy({
            where: { id: req.params.id }
        });
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.status(204).send();
    } catch (error) {
        console.error("Get All Categories Error:", error);
        res.status(500).json({ message: error.message });
    }
};
