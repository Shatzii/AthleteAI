const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const i18nService = require('../services/i18nService');

// Initialize i18n service
i18nService.initialize().catch(console.error);

// Middleware to detect and set language
const languageMiddleware = (req, res, next) => {
  const language = i18nService.detectLanguage(req, req.user?.id);
  req.language = language;
  res.locals.language = language;
  next();
};

// GET /api/v1/i18n/languages
// Get supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = i18nService.getSupportedLanguages();

    res.json({
      success: true,
      data: languages
    });

  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      details: error.message
    });
  }
});

// GET /api/v1/i18n/regions
// Get supported regions
router.get('/regions', (req, res) => {
  try {
    const regions = i18nService.getSupportedRegions();

    res.json({
      success: true,
      data: regions
    });

  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported regions',
      details: error.message
    });
  }
});

// GET /api/v1/i18n/translations/:language
// Get translations for a specific language
router.get('/translations/:language', (req, res) => {
  try {
    const { language } = req.params;

    if (!i18nService.isLanguageSupported(language)) {
      return res.status(404).json({
        success: false,
        message: 'Language not supported'
      });
    }

    // Return basic translations (not full translation object for security)
    const translations = {
      common: i18nService.translate('common', language),
      navigation: i18nService.translate('navigation', language),
      auth: i18nService.translate('auth', language),
      dashboard: i18nService.translate('dashboard', language),
      coaching: i18nService.translate('coaching', language),
      football: i18nService.translate('football', language)
    };

    res.json({
      success: true,
      data: {
        language,
        translations
      }
    });

  } catch (error) {
    console.error('Error getting translations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get translations',
      details: error.message
    });
  }
});

// POST /api/v1/i18n/language
// Set user's language preference
router.post('/language', authMiddleware.verifyToken, (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user?.id;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language code is required'
      });
    }

    if (!i18nService.isLanguageSupported(language)) {
      return res.status(400).json({
        success: false,
        message: 'Language not supported'
      });
    }

    const success = i18nService.setUserLanguage(userId, language);

    if (success) {
      res.json({
        success: true,
        message: 'Language preference updated',
        data: {
          language,
          userId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update language preference'
      });
    }

  } catch (error) {
    console.error('Error setting language:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set language preference',
      details: error.message
    });
  }
});

// GET /api/v1/i18n/language
// Get user's current language preference
router.get('/language', authMiddleware.verifyToken, (req, res) => {
  try {
    const userId = req.user?.id;
    const language = i18nService.getUserLanguage(userId);
    const languageInfo = i18nService.getLanguageInfo(language);

    res.json({
      success: true,
      data: {
        language,
        languageInfo
      }
    });

  } catch (error) {
    console.error('Error getting user language:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user language',
      details: error.message
    });
  }
});

// POST /api/v1/i18n/format/date
// Format date according to locale
router.post('/format/date', (req, res) => {
  try {
    const { date, locale = 'en-US', format = 'medium' } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const dateObj = new Date(date);
    const formattedDate = i18nService.formatDate(dateObj, locale, format);

    res.json({
      success: true,
      data: {
        original: date,
        formatted: formattedDate,
        locale,
        format
      }
    });

  } catch (error) {
    console.error('Error formatting date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format date',
      details: error.message
    });
  }
});

// POST /api/v1/i18n/format/number
// Format number according to locale
router.post('/format/number', (req, res) => {
  try {
    const { number, locale = 'en-US', type = 'decimal', currency = 'USD' } = req.body;

    if (typeof number !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Valid number is required'
      });
    }

    const formattedNumber = i18nService.formatNumber(number, locale, type, currency);

    res.json({
      success: true,
      data: {
        original: number,
        formatted: formattedNumber,
        locale,
        type,
        currency
      }
    });

  } catch (error) {
    console.error('Error formatting number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format number',
      details: error.message
    });
  }
});

// POST /api/v1/i18n/convert/unit
// Convert between measurement units
router.post('/convert/unit', (req, res) => {
  try {
    const { value, fromUnit, toUnit, type } = req.body;

    if (typeof value !== 'number' || !fromUnit || !toUnit || !type) {
      return res.status(400).json({
        success: false,
        message: 'Value, fromUnit, toUnit, and type are required'
      });
    }

    const convertedValue = i18nService.convertUnit(value, fromUnit, toUnit, type);

    res.json({
      success: true,
      data: {
        original: { value, unit: fromUnit },
        converted: { value: convertedValue, unit: toUnit },
        type
      }
    });

  } catch (error) {
    console.error('Error converting unit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert unit',
      details: error.message
    });
  }
});

// GET /api/v1/i18n/stats
// Get i18n service statistics
router.get('/stats', authMiddleware.verifyToken, (req, res) => {
  try {
    const stats = i18nService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting i18n stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get i18n statistics',
      details: error.message
    });
  }
});

// POST /api/v1/i18n/translate
// Translate text (for dynamic content)
router.post('/translate', languageMiddleware, (req, res) => {
  try {
    const { key, variables = {} } = req.body;
    const language = req.language;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Translation key is required'
      });
    }

    const translatedText = i18nService.translate(key, language, variables);

    res.json({
      success: true,
      data: {
        key,
        translation: translatedText,
        language,
        variables
      }
    });

  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate text',
      details: error.message
    });
  }
});

module.exports = router;