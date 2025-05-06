const express = require('express');
const router = express.Router();
const Property = require('../models/property');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// CREATE
router.post('/', upload.single('image'), async (req, res) => {
  const { title, price, description, location } = req.body;
  const image = req.file ? req.file.filename : '';
  const property = await Property.create({ title, price, description, location, image });
  res.json(property);
});

// READ ALL
router.get('/', async (req, res) => {
  const properties = await Property.findAll();
  res.json(properties);
});

// READ ONE
router.get('/:id', async (req, res) => {
  const property = await Property.findByPk(req.params.id);
  res.json(property);
});

// UPDATE
router.put('/:id', upload.single('image'), async (req, res) => {
  const property = await Property.findByPk(req.params.id);
  const { title, price, description, location } = req.body;
  const image = req.file ? req.file.filename : property.image;

  await property.update({ title, price, description, location, image });
  res.json(property);
});

// DELETE
router.delete('/:id', async (req, res) => {
  await Property.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

module.exports = router;

