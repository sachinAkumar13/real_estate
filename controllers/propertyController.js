const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Property = require("../models/propertyModel");

// Database connection
const pool = require("../config/db");

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: "virtualTourImage", maxCount: 1 },
  { name: "floorPlanImage", maxCount: 1 },
  { name: "floorImage", maxCount: 1 },
  { name: "agentImage", maxCount: 1 },
  { name: "propertyImages[]", maxCount: 10 },
]);

// Controller methods
const propertyController = {
  // Create new property

  // Get all properties
  getAllProperties: async (req, res) => {
    console.log("test");
    try {
      const connection = await pool.getConnection();
      try {
        const [properties] = await connection.execute(`
          SELECT p.id, p.title, p.location, p.price, p.bedrooms, p.bathrooms, p.area, p.is_featured, p.is_for_rent, pi.image_url
          FROM properties p
          LEFT JOIN property_images pi ON p.id = pi.property_id
        `);

        const propertiesWithImages = properties.reduce((acc, property) => {
          if (!acc[property.id]) {
            acc[property.id] = {
              id: property.id,
              title: property.title,
              location: property.location,
              price: property.price,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              area: property.area,
              is_featured: property.is_featured,
              is_for_rent: property.is_for_rent,
              images: [],
            };
          }
          if (property.image_url) {
            acc[property.id].images.push(property.image_url);
          }
          return acc;
        }, {});

        const result = Object.values(propertiesWithImages);

        res.status(200).json({ success: true, properties: result });
      } catch (err) {
        console.error("Database Error:", err); // ✅ Log real error
        res
          .status(500)
          .json({ success: false, message: "Database error: " + err.message });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("Server Error:", err); // ✅ Log real error
      res
        .status(500)
        .json({ success: false, message: "Server error: " + err.message });
    }
  },
  // Get property by ID
  getPropertyById: async (req, res) => {
    try {
      const [propertyRows] = await pool.query(
        "SELECT * FROM properties WHERE id = ?",
        [req.params.id]
      );

      if (propertyRows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Property not found" });
      }

      const property = propertyRows[0];

      // Get property images
      const [imageRows] = await pool.query(
        "SELECT image_path FROM property_images WHERE property_id = ?",
        [req.params.id]
      );
      property.images = imageRows.map((row) => row.image_path);

      res.status(200).json({ success: true, property });
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching property: " + error.message,
      });
    }
  },

  // Update property
  updateProperty: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "File upload error: " + err.message,
        });
      }

      try {
        const connection = await pool.getConnection();

        try {
          await connection.beginTransaction();

          // Parse amenities from JSON string
          const amenities = req.body.amenities
            ? JSON.parse(req.body.amenities)
            : {};

          // Update property data
          await connection.execute(
            `UPDATE properties SET
              full_name = ?, description = ?, full_address = ?, zip_code = ?, country = ?, 
              province_state = ?, neighborhood = ?, property_location = ?, latitude = ?, longitude = ?,
              property_price = ?, unit_price = ?, before_price_label = ?, after_price_label = ?,
              property_type = ?, property_status = ?, property_label = ?, size = ?, land_area = ?,
              property_id = ?, rooms = ?, bedrooms = ?, bathrooms = ?, garages = ?, garage_size = ?,
              year_built = ?, amenities_air_condition = ?, amenities_ceiling_height = ?, 
              amenities_heating = ?, amenities_elevator = ?, amenities_fire_place = ?, 
              amenities_parking = ?, amenities_disabled_access = ?, amenities_recreation = ?,
              amenities_cable_tv = ?, amenities_garden = ?, amenities_wifi = ?,
              virtual_tour_embedded_code = ?, virtual_tour_description = ?, video_url = ?,
              enable_floor_plan = ?, floor_plan_embedded_code = ?, floor_plan_title = ?,
              floor_price_digits = ?, floor_price_postfix = ?, floor_size_digits = ?, 
              floor_size_postfix = ?, floor_bedrooms = ?, floor_bathrooms = ?, floor_description = ?,
              agent_information = ?, agent_embedded_code = ?, updated_at = NOW()
            WHERE id = ?`,
            [
              req.body.fullName,
              req.body.description,
              req.body.fullAddress,
              req.body.zipCode,
              req.body.country,
              req.body.provinceState,
              req.body.neighborhood,
              req.body.propertyLocation,
              req.body.latitude,
              req.body.longitude,
              req.body.propertyPrice,
              req.body.unitPrice,
              req.body.beforePriceLabel,
              req.body.afterPriceLabel,
              req.body.propertyType,
              req.body.propertyStatus,
              req.body.propertyLabel,
              req.body.size,
              req.body.landArea,
              req.body.propertyId,
              req.body.rooms,
              req.body.bedrooms,
              req.body.bathrooms,
              req.body.garages,
              req.body.garageSize,
              req.body.yearBuilt,
              amenities.airCondition ? 1 : 0,
              amenities.ceilingHeight ? 1 : 0,
              amenities.heating ? 1 : 0,
              amenities.elevator ? 1 : 0,
              amenities.firePlace ? 1 : 0,
              amenities.parking ? 1 : 0,
              amenities.disabledAccess ? 1 : 0,
              amenities.recreation ? 1 : 0,
              amenities.cableTV ? 1 : 0,
              amenities.garden ? 1 : 0,
              amenities.wifi ? 1 : 0,
              req.body.virtualTourEmbeddedCode,
              req.body.virtualTourDescription,
              req.body.videoUrl,
              req.body.enableFloorPlan ? 1 : 0,
              req.body.floorPlanEmbeddedCode,
              req.body.floorPlanTitle,
              req.body.floorPriceDigits,
              req.body.floorPricePostfix,
              req.body.floorSizeDigits,
              req.body.floorSizePostfix,
              req.body.floorBedrooms,
              req.body.floorBathrooms,
              req.body.floorDescription,
              req.body.agentInformation,
              req.body.agentEmbeddedCode,
              req.params.id,
            ]
          );

          // Handle file paths
          const fileFields = [
            { field: "virtualTourImage", dbColumn: "virtual_tour_image" },
            { field: "floorPlanImage", dbColumn: "floor_plan_image" },
            { field: "floorImage", dbColumn: "floor_image" },
            { field: "agentImage", dbColumn: "agent_image" },
          ];

          // Update property with file paths
          for (const fileField of fileFields) {
            if (
              req.files &&
              req.files[fileField.field] &&
              req.files[fileField.field][0]
            ) {
              const filePath =
                "/uploads/" + req.files[fileField.field][0].filename;
              await connection.execute(
                `UPDATE properties SET ${fileField.dbColumn} = ? WHERE id = ?`,
                [filePath, req.params.id]
              );
            }
          }

          // Add new property images
          if (req.files && req.files["propertyImages[]"]) {
            const propertyImages = req.files["propertyImages[]"];

            for (const image of propertyImages) {
              const imagePath = "/uploads/" + image.filename;
              await connection.execute(
                "INSERT INTO property_images (property_id, image_path) VALUES (?, ?)",
                [req.params.id, imagePath]
              );
            }
          }

          await connection.commit();
          res.status(200).json({
            success: true,
            message: "Property updated successfully",
            propertyId: req.params.id,
          });
        } catch (error) {
          await connection.rollback();
          console.error("Database error:", error);
          res.status(500).json({
            success: false,
            message: "Database error: " + error.message,
          });
        } finally {
          connection.release();
        }
      } catch (error) {
        console.error("Connection error:", error);
        res.status(500).json({
          success: false,
          message: "Connection error: " + error.message,
        });
      }
    });
  },

  // Delete property
  // Delete property
  deleteProperty: async (req, res) => {
    try {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // 1. Delete property images first (child rows)
        await connection.execute(
          "DELETE FROM property_images WHERE property_id = ?",
          [req.params.id]
        );

        // 2. Then delete property (parent row)
        await connection.execute("DELETE FROM properties WHERE id = ?", [
          req.params.id,
        ]);

        await connection.commit();
        res
          .status(200)
          .json({ success: true, message: "Property deleted successfully" });
      } catch (error) {
        await connection.rollback();
        console.error("Database error:", error);
        res.status(500).json({
          success: false,
          message: "Database error: " + error.message,
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Connection error:", error);
      res.status(500).json({
        success: false,
        message: "Connection error: " + error.message,
      });
    }
  },

  // Create Property
  createProperty: async (req, res) => {
    try {
      // Text fields from form-data
      const {
        category_id,
        title,
        location,
        bedrooms,
        bathrooms,
        area,
        price,
        is_featured,
        is_for_rent,
      } = req.body;

      // Uploaded files
      const files = req.files;

      if (!title || !location || !bedrooms || !bathrooms || !area || !price) {
        return res
          .status(400)
          .json({ success: false, message: "Missing fields" });
      }

      // Image URLs (from uploaded files)
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert into properties table
        const [result] = await connection.execute(
          `INSERT INTO properties 
            (category_id, title, location, bedrooms, bathrooms, area, price, is_featured, is_for_rent) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            category_id || 1,
            title,
            location,
            bedrooms,
            bathrooms,
            area,
            price,
            is_featured == "true" ? 1 : 0,
            is_for_rent == "true" ? 1 : 0,
          ]
        );

        const propertyId = result.insertId;

        // Insert property images
        for (const imgUrl of imageUrls) {
          await connection.execute(
            `INSERT INTO property_images (property_id, image_url) VALUES (?, ?)`,
            [propertyId, imgUrl]
          );
        }

        await connection.commit();

        res
          .status(201)
          .json({ success: true, message: "Property created", propertyId });
      } catch (err) {
        await connection.rollback();
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Database error: " + err });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = propertyController;
