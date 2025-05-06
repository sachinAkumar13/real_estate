const db = require('../config/db');

const Property = {

    createProperty: (data, callback) => {
        const { category_id, title, location, bedrooms, bathrooms, area, price, is_featured, is_for_rent } = data;

        const sql = `INSERT INTO properties 
        (category_id, title, location, bedrooms, bathrooms, area, price, is_featured, is_for_rent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [category_id, title, location, bedrooms, bathrooms, area, price, is_featured, is_for_rent], callback);
    },

    addImages: (property_id, images, callback) => {
        const values = images.map(img => [property_id, img]);
        const sql = `INSERT INTO property_images (property_id, image_url) VALUES ?`;
        db.query(sql, [values], callback);
    }

};

module.exports = Property;
