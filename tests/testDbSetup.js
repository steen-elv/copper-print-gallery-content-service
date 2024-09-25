// tests/testDbSetup.js

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create a new Sequelize instance for testing
const sequelize = new Sequelize('sqlite::memory:', {
    logging: false // disable logging; default: console.log
});

const modelsDir = path.join(__dirname, '../src/models');
const db = {};

// Read model files and initialize them
fs.readdirSync(modelsDir)
    .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && file !== 'index.js')
    .forEach(file => {
        const model = require(path.join(modelsDir, file));
        const modelInstance = model(sequelize);
        db[modelInstance.name] = modelInstance;
    });

// Run .associate for each model if it exists
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Function to sync all models to the database
const syncDatabase = async () => {
    await sequelize.sync({ force: true });
};

module.exports = {
    sequelize,
    ...db,
    syncDatabase
};