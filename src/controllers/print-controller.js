// src/controllers/printController.js

const Print = require('../models/print');
const { Op } = require('sequelize');

exports.getPrints = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      galleryId, 
      technique, 
      year, 
      plateType, 
      paperType 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (galleryId) whereClause.galleryId = galleryId;
    if (technique) whereClause.technique = technique;
    if (year) whereClause.year = year;
    if (plateType) whereClause.plateType = plateType;
    if (paperType) whereClause.paperType = paperType;

    const prints = await Print.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      prints: prints.rows,
      totalCount: prints.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(prints.count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.createPrint = async (req, res, next) => {
  try {
    const print = await Print.create(req.body);
    res.status(201).json(print);
  } catch (error) {
    next(error);
  }
};

exports.getPrint = async (req, res, next) => {
  try {
    const print = await Print.findByPk(req.params.printId);
    if (!print) {
      return res.status(404).json({ message: 'Print not found' });
    }
    res.json(print);
  } catch (error) {
    next(error);
  }
};

exports.updatePrint = async (req, res, next) => {
  try {
    const print = await Print.findByPk(req.params.printId);
    if (!print) {
      return res.status(404).json({ message: 'Print not found' });
    }
    await print.update(req.body);
    res.json(print);
  } catch (error) {
    next(error);
  }
};

exports.deletePrint = async (req, res, next) => {
  try {
    const print = await Print.findByPk(req.params.printId);
    if (!print) {
      return res.status(404).json({ message: 'Print not found' });
    }
    await print.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
