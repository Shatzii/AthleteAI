// Performance Monitoring Utility
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // Monitor Core Web Vitals
    this.monitorCLS();
    this.monitorFID();
    this.monitorLCP();
    this.monitorTTFB();

    // Monitor custom metrics
    this.monitorPageLoad();
    this.monitorAPIRequests();
  }

  // Cumulative Layout Shift
  monitorCLS() {
    let clsValue = 0;
    let sessionEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          sessionEntries.push(entry);
        }
      }

      this.metrics.cls = clsValue;
      this.reportMetric('CLS', clsValue);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  // First Input Delay
  monitorFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.reportMetric('FID', this.metrics.fid);
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  // Largest Contentful Paint
  monitorLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.lcp = lastEntry.startTime;
      this.reportMetric('LCP', this.metrics.lcp);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  // Time to First Byte
  monitorTTFB() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.ttfb = entry.responseStart - entry.requestStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  // Page Load Time
  monitorPageLoad() {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.pageLoad = loadTime;
      this.reportMetric('Page Load Time', loadTime);
    });
  }

  // API Request Monitoring
  monitorAPIRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const response = await originalFetch(...args);
      const endTime = performance.now();

      const requestTime = endTime - startTime;
      this.reportMetric('API Request', requestTime, args[0]);

      return response;
    };
  }

  // Report metrics to console and potentially to monitoring service
  reportMetric(name, value, details = null) {
    const metric = {
      name,
      value: Math.round(value * 100) / 100,
      timestamp: Date.now(),
      details
    };

    console.log(`[Performance] ${name}: ${metric.value}ms`, details ? { details } : '');

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metric);
    }
  }

  // Send metrics to monitoring service (placeholder)
  sendToMonitoring(metric) {
    // Implement your monitoring service integration here
    // Examples: Sentry, DataDog, New Relic, etc.
    console.log('Sending metric to monitoring service:', metric);
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Performance budget checks
  checkBudgets() {
    const budgets = {
      cls: 0.1, // Cumulative Layout Shift
      fid: 100, // First Input Delay (ms)
      lcp: 2500, // Largest Contentful Paint (ms)
      ttfb: 800, // Time to First Byte (ms)
      pageLoad: 3000 // Page Load Time (ms)
    };

    const violations = [];

    Object.keys(budgets).forEach(metric => {
      if (this.metrics[metric] > budgets[metric]) {
        violations.push({
          metric,
          actual: this.metrics[metric],
          budget: budgets[metric],
          exceeded: this.metrics[metric] - budgets[metric]
        });
      }
    });

    if (violations.length > 0) {
      console.warn('[Performance Budget] Violations detected:', violations);
    }

    return violations;
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
