const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // keep the /api prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add any custom headers if needed
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
      },
    })
  );
};
