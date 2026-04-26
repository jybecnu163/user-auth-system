const express = require('express');
const salesData = require('../db/sales');

const router = express.Router();

router.get('/sales', (req, res) => {
  res.json(salesData);
});

module.exports = router;
