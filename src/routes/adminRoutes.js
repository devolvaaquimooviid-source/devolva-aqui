const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 🔐 middleware
function isAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/auth/login');
  }
  next();
}

router.get('/orders', isAdmin, adminController.getOrdersPage);
router.post('/send/:id', isAdmin, adminController.sendOrder);

module.exports = router;