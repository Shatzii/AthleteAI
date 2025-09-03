const DataStorageService = require('./services/dataStorageService');

async function testDataStorageOnly() {
  const storageService = new DataStorageService();

  try {
    await storageService.initialize();

    console.log('Testing data storage service...');

    // Create sample athlete data
    const sampleData = {
      name: 'Test Athlete',
      sport: 'football',
      position: 'Quarterback',
      school: 'Test High School',
      stats: {
        passingYards: 2500,
        touchdowns: 28,
        completionPercentage: 68.5
      },
      highlights: [
        {
          title: 'Game Highlights',
          url: 'https://example.com/highlight1',
          views: 1500,
          platform: 'YouTube'
        }
      ],
      recruitingData: {
        rating: 0.95,
        stars: 5,
        ranking: 15
      },
      metadata: {
        sourcesUsed: ['maxpreps'],
        dataQuality: 85,
        lastUpdated: new Date()
      }
    };

    // Store the data
    console.log('Storing sample data...');
    const storedData = await storageService.storeAthleteData(sampleData);

    console.log('Data stored successfully:', {
      id: storedData._id,
      name: storedData.name,
      normalizedName: storedData.nameLower,
      dataQuality: storedData.metadata?.dataQuality,
      confidence: storedData.metadata?.confidence
    });

    // Test retrieval
    console.log('Testing data retrieval...');
    const retrievedData = await storageService.getAthleteData('Test Athlete', 'football');
    console.log('Data retrieved successfully:', !!retrievedData);

    if (retrievedData) {
      console.log('Retrieved athlete data:', {
        name: retrievedData.name,
        sport: retrievedData.sport,
        position: retrievedData.position,
        statsCount: Object.keys(retrievedData.stats || {}).length,
        highlightsCount: (retrievedData.highlights || []).length
      });
    }

    // Test search
    console.log('Testing athlete search...');
    const searchResults = await storageService.searchAthletes('Test', { limit: 5 });
    console.log('Search found', searchResults.length, 'results');

    // Test data quality stats
    console.log('Testing data quality stats...');
    const qualityStats = await storageService.getDataQualityStats();
    console.log('Quality stats:', {
      totalAthletes: qualityStats.totalAthletes,
      averageQuality: qualityStats.averageQuality?.toFixed(1),
      averageConfidence: qualityStats.averageConfidence?.toFixed(1)
    });

  } catch (error) {
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testDataStorageOnly();
