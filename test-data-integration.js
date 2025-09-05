const DataScrapingService = require('./backend/services/dataScrapingService');
const DataStorageService = require('./backend/services/dataStorageService');

async function testDataIntegration() {
    console.log('🧪 Testing Enhanced Data Integration System');
    console.log('==========================================');

    const scrapingService = new DataScrapingService();
    const storageService = new DataStorageService();

    try {
        // Initialize services
        console.log('📡 Initializing services...');
        await scrapingService.initialize();
        await storageService.initialize();
        console.log('✅ Services initialized successfully');

        // Test athlete data collection
        const testAthletes = [
            { name: 'Arch Manning', sport: 'football' },
            { name: 'Drake Maye', sport: 'football' },
            { name: 'Marvin Harrison Jr', sport: 'football' }
        ];

        console.log('\n🔍 Testing data collection for sample athletes...');

        for (const athlete of testAthletes) {
            try {
                console.log(`\n📊 Collecting data for: ${athlete.name}`);

                const athleteData = await scrapingService.collectAthleteData(athlete.name, athlete.sport);

                if (athleteData) {
                    console.log(`✅ Found data for ${athlete.name}`);
                    console.log(`   Sport: ${athleteData.sport || 'N/A'}`);
                    console.log(`   Position: ${athleteData.position || 'N/A'}`);
                    console.log(`   School: ${athleteData.school || 'N/A'}`);
                    console.log(`   Data Quality: ${athleteData.metadata?.dataQuality || 0}%`);
                    console.log(`   Sources Used: ${(athleteData.metadata?.sourcesUsed || []).length}`);

                    // Store the data
                    console.log(`💾 Storing data for ${athlete.name}...`);
                    const storedData = await storageService.storeAthleteData(athleteData);
                    console.log(`✅ Data stored successfully for ${athlete.name}`);

                    // Add delay to avoid overwhelming external services
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log(`❌ No data found for ${athlete.name}`);
                }

            } catch (error) {
                console.error(`❌ Error processing ${athlete.name}:`, error.message);
            }
        }

        // Test data retrieval
        console.log('\n🔍 Testing data retrieval...');
        const storedAthletes = await storageService.searchAthletes('', { limit: 10 });
        console.log(`📊 Found ${storedAthletes.length} athletes in database`);

        if (storedAthletes.length > 0) {
            console.log('\n📋 Sample stored athletes:');
            storedAthletes.slice(0, 3).forEach((athlete, index) => {
                console.log(`   ${index + 1}. ${athlete.name} (${athlete.sport}) - Confidence: ${athlete.metadata?.confidence || 0}%`);
            });
        }

        // Test data quality statistics
        console.log('\n📈 Testing data quality statistics...');
        const qualityStats = await storageService.getDataQualityStats();
        console.log(`📊 Data Quality Overview:`);
        console.log(`   Total Athletes: ${qualityStats.totalAthletes || 0}`);
        console.log(`   Average Quality: ${qualityStats.averageQuality?.toFixed(1) || 0}%`);
        console.log(`   Average Confidence: ${qualityStats.averageConfidence?.toFixed(1) || 0}%`);
        console.log(`   High Quality Count: ${qualityStats.highQualityCount || 0}`);

        console.log('\n🎉 Data integration test completed successfully!');
        console.log('==========================================');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testDataIntegration().catch(console.error);
}

module.exports = { testDataIntegration };
