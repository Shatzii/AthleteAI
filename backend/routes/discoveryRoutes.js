const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discoveryController');
const authMiddleware = require('../middleware/auth').authenticateToken;

// All discovery routes require authentication
router.use(authMiddleware);

// Scrape athletes from recruiting sites
router.get('/scrape', discoveryController.scrapeAthletes);

// Get highlighted athletes
router.get('/highlighted', discoveryController.getHighlightedAthletes);

// Highlight/unhighlight athletes
router.post('/:id/highlight', discoveryController.highlightAthlete);
router.delete('/:id/highlight', discoveryController.unhighlightAthlete);

// Get athlete highlights/videos
router.get('/:id/highlights', discoveryController.getAthleteHighlights);

// Update athlete social media
router.put('/:id/social-media', discoveryController.updateAthleteSocialMedia);

// Auto-highlight top athletes
router.post('/auto-highlight', discoveryController.autoHighlightAthletes);

// Get scraping statistics
router.get('/stats/scraping', discoveryController.getScrapingStats);

module.exports = router;
