const express = require('express');
const router = express.Router();

const { activateTag, getTag } = require('../controllers/tagController');

// ativar tag
router.post('/activate', activateTag);

// buscar tag (pública)
router.get('/:codigo', getTag);

module.exports = router;