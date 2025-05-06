const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Property = sequelize.define('Property', {
  title: DataTypes.STRING,
  price: DataTypes.FLOAT,
  description: DataTypes.TEXT,
  location: DataTypes.STRING,
  image: DataTypes.STRING
});

sequelize.sync();
module.exports = Property;