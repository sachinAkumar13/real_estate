const express = require("express");
const cors = require("cors");
require("dotenv").config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const propertiesRoutes = require('./routes/properties');

// Use routes
app.use('/api/properties', propertiesRoutes);

app.get('/api/properties', async (req, res) => {
  try {
    const [properties] = await pool.query('SELECT * FROM properties');
    // For each property, fetch related images
    const data = await Promise.all(properties.map(async (prop) => {
      const [images] = await pool.query(
        'SELECT image_path FROM property_images WHERE property_id = ?',
        [prop.id]
      );
      // Attach image URLs (or paths) as an array
      return { ...prop, images: images.map(img => img.image_path) };
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
