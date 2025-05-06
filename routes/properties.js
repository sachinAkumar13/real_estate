const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

const upload = require('../middlewares/multer'); // path to multer config above

// Property routes
// router.post('/', propertyController.createProperty);
router.get('/get-properties', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// const propertyController = require('../controllers/propertyController');

// router.post('/create', propertyController.createProperty);
router.post('/create', upload.array('images', 10), propertyController.createProperty);


module.exports = router;