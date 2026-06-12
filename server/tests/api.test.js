import request from 'supertest';
import app from '../index.js';

describe('API Endpoints', () => {
  it('GET /api/regions/disease-risk should return a list of regions', async () => {
    const res = await request(app).get('/api/regions/disease-risk');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /chat/advice should require a disease or question', async () => {
    const res = await request(app)
      .post('/chat/advice')
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('is required');
  });
});
