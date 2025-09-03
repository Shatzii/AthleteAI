const DataQualityMonitoringService = require('./services/dataQualityMonitoringService');

async function testQualityMonitoring() {
  const qualityService = new DataQualityMonitoringService();

  try {
    await qualityService.initialize();

    console.log('Testing data quality monitoring service...');

    // Test manual quality check
    console.log('Running manual quality check...');
    await qualityService.manualQualityCheck();

    // Test getting current alerts
    console.log('Getting current alerts...');
    const alerts = qualityService.getCurrentAlerts();
    console.log('Current alerts:', alerts.length);

    // Test getting quality metrics
    console.log('Getting quality metrics...');
    const metrics = await qualityService.getQualityMetricsHistory(24);
    console.log('Quality metrics count:', metrics.length);

    // Test monitoring status
    console.log('Getting monitoring status...');
    const status = qualityService.getMonitoringStatus();
    console.log('Monitoring status:', {
      isRunning: status.isRunning,
      activeAlerts: status.activeAlerts
    });

    // Test health check
    console.log('Running health check...');
    const health = await qualityService.healthCheck();
    console.log('Health status:', {
      service: health.service,
      healthy: health.healthy,
      alerts: health.alerts
    });

  } catch (error) {
    console.log('Error:', error.message);
  }
}

testQualityMonitoring();
