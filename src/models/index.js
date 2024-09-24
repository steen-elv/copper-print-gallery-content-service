// src/models/index.js

const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

const basename = path.basename(__filename);
const db = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const { init, Model } = require(path.join(__dirname, file));
        const model = init(sequelize);
        db[model.name] = model;
        db[Model.name] = Model; // This line adds the Model class to db as well
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.Sequelize;

module.exports = db;