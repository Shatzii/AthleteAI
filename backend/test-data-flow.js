const DataScrapingService = require('./services/dataScrapingService');
const DataStorageService = require('./services/dataStorageService');

async function testDataStorage() {
  const scrapingService = new DataScrapingService();
  const storageService = new DataStorageService();

  try {
    await scrapingService.initialize();
    await storageService.initialize();

    console.log('Testing data scraping and storage...');

    // Scrape data
    const scrapedData = await scrapingService.collectAthleteData('Arch Manning', 'football');

    if (scrapedData) {
      console.log('Scraped data keys:', Object.keys(scrapedData));
      console.log('Sources used:', scrapedData.metadata?.sourcesUsed || []);

      // Store the data
      const storedData = await storageService.storeAthleteData(scrapedData);

      console.log('Data stored successfully:', {
        id: storedData._id,
        name: storedData.name,
        sourcesUsed: storedData.metadata?.sourcesUsed || [],
        dataQuality: storedData.metadata?.dataQuality || 0,
        confidence: storedData.metadata?.confidence || 0
      });

      // Test retrieval
      const retrievedData = await storageService.getAthleteData('Arch Manning', 'football');
      console.log('Data retrieved successfully:', !!retrievedData);

      if (retrievedData) {
        console.log('Retrieved data:', {
          name: retrievedData.name,
          sport: retrievedData.sport,
          stats: Object.keys(retrievedData.stats || {}),
          highlightsCount: (retrievedData.highlights || []).length
        });
      }

    } else {
      console.log('No data scraped');
    }

  } catch (error) {
    console.log('Error:', error.message);
  }
}

testDataStorage();
