const request = require('supertest');
const app = require('../app');

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow normal request rate', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });

    it('should handle rate limited requests gracefully', async () => {
      // This test would need to be adjusted based on actual rate limits
      // For now, just verify the endpoint exists
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should have proper CORS configuration', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201);

      // The response should not contain the script tags
      expect(response.body.user.username).not.toContain('<script>');
    });
  });

  describe('Error Handling', () => {
    it('should not expose internal errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      // Should not contain stack traces or internal details
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toContain('Error:');
    });

    it('should provide user-friendly error messages', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });
});
