const request = require('supertest');
const app = require('../server');

describe('Election Sahayak API Integration Tests', () => {
  
  // 1. i18n Endpoint Tests (Core Path & Edge Case)
  describe('GET /api/locale/:lang', () => {
    it('should return 200 and English translations for valid language code', async () => {
      const res = await request(app).get('/api/locale/en');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('app');
      expect(res.body.app.title).toBe('Election Sahayak');
    });

    it('should return 200 and Tamil translations for "ta"', async () => {
      const res = await request(app).get('/api/locale/ta');
      expect(res.statusCode).toBe(200);
      expect(res.body.app.title).toBe('தேர்தல் சகாயக்');
    });

    it('should return 404 for an unsupported language code (Edge Case)', async () => {
      const res = await request(app).get('/api/locale/invalid_lang');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Language not supported');
    });
  });

  // 2. ERO Search Endpoint Tests (Core Path & Edge Case)
  describe('GET /api/ero', () => {
    it('should return exact match for a valid Chennai pincode', async () => {
      const res = await request(app).get('/api/ero?pincode=600003');
      expect(res.statusCode).toBe(200);
      expect(res.body.source).toBe('static');
      expect(res.body.offices.length).toBeGreaterThan(0);
      expect(res.body.offices[0].pincode).toBe('600003');
    });

    it('should return prefix match for a pincode in the same region', async () => {
      // 600999 doesn't exist, but starts with 600
      const res = await request(app).get('/api/ero?pincode=600999');
      expect(res.statusCode).toBe(200);
      expect(res.body.source).toBe('static');
      expect(res.body.offices.length).toBeGreaterThan(0);
      // Verify the returned offices are in the 600xxx range
      expect(res.body.offices[0].pincode.startsWith('600')).toBe(true);
    });

    it('should return 400 when pincode parameter is missing (Edge Case)', async () => {
      const res = await request(app).get('/api/ero');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'pincode query parameter is required');
    });
  });

  // 3. ERO AI Fallback Endpoint Tests (Integration Flow)
  describe('POST /api/ero/search', () => {
    it('should return 400 when pincode is missing in request body', async () => {
      const res = await request(app).post('/api/ero/search').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'pincode is required');
    });

    it('should resolve using static data first if available', async () => {
      const res = await request(app).post('/api/ero/search').send({ pincode: '600003' });
      expect(res.statusCode).toBe(200);
      expect(res.body.source).toBe('static');
      expect(res.body.offices[0].pincode).toBe('600003');
    });
  });

  // 4. Config Endpoint
  describe('GET /api/config', () => {
    it('should return system configuration safely without exposing raw values if empty', async () => {
      const res = await request(app).get('/api/config');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mapsApiKey');
      expect(res.body).toHaveProperty('hasTranslation');
      expect(res.body).toHaveProperty('hasGemini');
    });
  });

  // 5. Chat Endpoint (Edge Case / Validation)
  describe('POST /api/chat', () => {
    it('should return 400 if message is missing', async () => {
      const res = await request(app).post('/api/chat').send({ history: [] });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'message is required');
    });
  });

});
