const ScheduledDataRefreshService = require('./services/scheduledDataRefreshService');

async function testScheduledRefresh() {
  const refreshService = new ScheduledDataRefreshService();

  try {
    await refreshService.initialize();

    console.log('Testing scheduled data refresh service...');

    // Test manual refresh
    console.log('Testing manual athlete refresh...');
    const jobId = await refreshService.refreshAthlete('Test Athlete', 'football');
    console.log('Manual refresh job created:', jobId);

    // Test refresh stats
    console.log('Testing refresh stats...');
    const stats = await refreshService.getRefreshStats();
    console.log('Refresh stats:', {
      isRunning: stats.isRunning,
      pendingJobs: stats.pendingJobs,
      completedJobs: stats.completedJobs,
      failedJobs: stats.failedJobs
    });

    // Test health check
    console.log('Testing health check...');
    const health = await refreshService.healthCheck();
    console.log('Health status:', {
      service: health.service,
      healthy: health.healthy,
      running: health.running
    });

  } catch (error) {
    console.log('Error:', error.message);
  }
}

testScheduledRefresh();
