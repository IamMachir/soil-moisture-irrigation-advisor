const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const readingRules = [
  body('zoneId').isInt({ min: 1 }).withMessage('zoneId must be a valid id'),
  body('moisturePercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('moisturePercent must be a number between 0 and 100'),
];

const zoneRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('gridX').optional().isInt().withMessage('gridX must be an integer'),
  body('gridY').optional().isInt().withMessage('gridY must be an integer'),
  body('moistureThreshold')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('moistureThreshold must be a number between 0 and 100'),
];

const manualWaterRules = [
  body('zoneId').isInt({ min: 1 }).withMessage('zoneId must be a valid id'),
];

module.exports = { handleValidation, readingRules, zoneRules, manualWaterRules };
