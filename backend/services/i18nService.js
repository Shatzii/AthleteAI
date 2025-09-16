// Internationalization Service for AthleteAI
// Handles language detection, translation loading, and localization

const i18nConfig = require('../config/i18n');
const fs = require('fs');
const path = require('path');

class InternationalizationService {
  constructor() {
    this.translations = new Map();
    this.currentLanguage = 'en';
    this.fallbackLanguage = 'en';
    this.userPreferences = new Map();
    this.cache = new Map();
  }

  /**
   * Initialize the i18n service
   */
  async initialize() {
    try {
      // Load all translation files
      await this.loadTranslations();

      // Set default language
      this.currentLanguage = i18nConfig.supportedLanguages.en.code;

      console.log('✅ Internationalization service initialized');
      console.log(`📍 Loaded ${this.translations.size} language(s)`);

    } catch (error) {
      console.error('❌ Failed to initialize i18n service:', error);
      throw error;
    }
  }

  /**
   * Load translation files from locales directory
   */
  async loadTranslations() {
    const localesPath = path.join(__dirname, '../locales');

    try {
      const files = fs.readdirSync(localesPath);

      for (const file of files) {
        if (file.endsWith('.js')) {
          const langCode = file.replace('.js', '');
          const translationPath = path.join(localesPath, file);

          try {
            const translations = require(translationPath);
            this.translations.set(langCode, translations);
            console.log(`📄 Loaded translations for ${langCode}`);
          } catch (error) {
            console.error(`❌ Failed to load translations for ${langCode}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to read locales directory:', error);
    }
  }

  /**
   * Detect user's preferred language
   * @param {Object} request - HTTP request object
   * @param {string} userId - User ID for stored preferences
   * @returns {string} Detected language code
   */
  detectLanguage(request, userId = null) {
    // Check user preference first
    if (userId && this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId);
    }

    // Check Accept-Language header
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage) {
      const preferredLanguage = this.parseAcceptLanguage(acceptLanguage);
      if (preferredLanguage && this.translations.has(preferredLanguage)) {
        return preferredLanguage;
      }
    }

    // Check query parameter
    if (request.query && request.query.lang) {
      const queryLang = request.query.lang.toLowerCase();
      if (this.translations.has(queryLang)) {
        return queryLang;
      }
    }

    // Return default language
    return this.fallbackLanguage;
  }

  /**
   * Parse Accept-Language header
   * @param {string} acceptLanguage - Accept-Language header value
   * @returns {string|null} Language code or null
   */
  parseAcceptLanguage(acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const [code, quality] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0], // Get primary language code
        quality: quality ? parseFloat(quality) : 1.0
      };
    });

    // Sort by quality and return highest
    languages.sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (this.translations.has(lang.code)) {
        return lang.code;
      }
    }

    return null;
  }

  /**
   * Get translated text
   * @param {string} key - Translation key (dot notation)
   * @param {string} language - Language code
   * @param {Object} variables - Variables to interpolate
   * @returns {string} Translated text
   */
  translate(key, language = null, variables = {}) {
    const lang = language || this.currentLanguage;
    const translations = this.translations.get(lang) || this.translations.get(this.fallbackLanguage);

    if (!translations) {
      return key; // Return key if no translations available
    }

    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, try fallback language
        if (lang !== this.fallbackLanguage) {
          return this.translate(key, this.fallbackLanguage, variables);
        }
        return key; // Return key if not found in any language
      }
    }

    // Handle string interpolation
    if (typeof value === 'string' && variables && Object.keys(variables).length > 0) {
      return this.interpolateString(value, variables);
    }

    return value;
  }

  /**
   * Interpolate variables in string
   * @param {string} text - Text with placeholders
   * @param {Object} variables - Variables to interpolate
   * @returns {string} Interpolated text
   */
  interpolateString(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Set user's language preference
   * @param {string} userId - User ID
   * @param {string} language - Language code
   */
  setUserLanguage(userId, language) {
    if (this.translations.has(language)) {
      this.userPreferences.set(userId, language);
      return true;
    }
    return false;
  }

  /**
   * Get user's language preference
   * @param {string} userId - User ID
   * @returns {string} Language code
   */
  getUserLanguage(userId) {
    return this.userPreferences.get(userId) || this.fallbackLanguage;
  }

  /**
   * Format date according to locale
   * @param {Date} date - Date to format
   * @param {string} locale - Locale code
   * @param {string} format - Format type (short, medium, long)
   * @returns {string} Formatted date
   */
  formatDate(date, locale = 'en-US', format = 'medium') {
    const options = i18nConfig.dateTimeFormats[format] || i18nConfig.dateTimeFormats.medium;

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      // Fallback to default formatting
      return date.toLocaleDateString();
    }
  }

  /**
   * Format number according to locale
   * @param {number} number - Number to format
   * @param {string} locale - Locale code
   * @param {string} type - Format type (decimal, currency, percent)
   * @param {string} currency - Currency code for currency formatting
   * @returns {string} Formatted number
   */
  formatNumber(number, locale = 'en-US', type = 'decimal', currency = 'USD') {
    const options = { ...i18nConfig.numberFormats[type] };

    if (type === 'currency') {
      options.currency = currency;
    }

    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      // Fallback to basic formatting
      return number.toString();
    }
  }

  /**
   * Convert between measurement units
   * @param {number} value - Value to convert
   * @param {string} fromUnit - Source unit
   * @param {string} toUnit - Target unit
   * @param {string} type - Measurement type (weight, height, distance, speed)
   * @returns {number} Converted value
   */
  convertUnit(value, fromUnit, toUnit, type) {
    const unitConfig = i18nConfig.units[type];
    if (!unitConfig) return value;

    // If same unit, return original value
    if (fromUnit === toUnit) return value;

    // Convert to metric first, then to target unit
    let metricValue = value;

    if (fromUnit === unitConfig.imperial) {
      // Convert from imperial to metric
      metricValue = value / unitConfig.conversion(1);
    }

    if (toUnit === unitConfig.imperial) {
      // Convert from metric to imperial
      return unitConfig.conversion(metricValue);
    }

    return metricValue;
  }

  /**
   * Get supported languages
   * @returns {Array} Array of supported language objects
   */
  getSupportedLanguages() {
    return Object.values(i18nConfig.supportedLanguages);
  }

  /**
   * Get supported regions
   * @returns {Array} Array of supported region objects
   */
  getSupportedRegions() {
    return Object.values(i18nConfig.regions);
  }

  /**
   * Check if language is supported
   * @param {string} language - Language code
   * @returns {boolean} Whether language is supported
   */
  isLanguageSupported(language) {
    return this.translations.has(language);
  }

  /**
   * Get language info
   * @param {string} language - Language code
   * @returns {Object} Language information
   */
  getLanguageInfo(language) {
    return i18nConfig.supportedLanguages[language] || null;
  }

  /**
   * Get region info
   * @param {string} region - Region code
   * @returns {Object} Region information
   */
  getRegionInfo(region) {
    return i18nConfig.regions[region] || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      supportedLanguages: this.translations.size,
      userPreferences: this.userPreferences.size,
      cacheSize: this.cache.size,
      currentLanguage: this.currentLanguage,
      fallbackLanguage: this.fallbackLanguage
    };
  }
}

// Export singleton instance
const i18nService = new InternationalizationService();
module.exports = i18nService;