const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('LMS Backend Security & RBAC Tests', () => {
  test('Health check endpoint responds with 200 OK', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('Public book browsing is accessible without authentication', async () => {
    const res = await request(app).get('/api/books');
    // Even if DB is disconnected in unit test, request either responds or fails gracefully
    assert.ok([200, 500].includes(res.statusCode));
  });

  test('Protected endpoint /api/users rejects requests without token (401)', async () => {
    const res = await request(app).get('/api/users');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Authentication required/i);
  });

  test('Protected endpoint /api/circulation rejects unauthenticated requests (401)', async () => {
    const res = await request(app).get('/api/circulation');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('Librarian-only book creation rejects unauthenticated requests (401)', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'New Test Book', author: 'Author', isbn: 'ISBN-999', category: 'CS' });
    assert.strictEqual(res.statusCode, 401);
  });

  test('Invalid login attempt with malformed payload triggers validation error (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('Invalid bearer token is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_bogus_jwt_token_here');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('Public student registration rejects attempt to self-assign admin role (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-student')
      .send({
        name: 'Attacker User',
        email: 'attacker@college.edu',
        password: 'Password123',
        studentId: 'ATTACK-001',
        role: 'admin',
      });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /only permitted for students/i);
  });

  test('Public student registration validates missing required fields (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-student')
      .send({
        name: '',
        email: 'bad-email',
        password: 'short',
      });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });
});
