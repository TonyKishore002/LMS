const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { authorize } = require('../src/middleware/authMiddleware');

describe('MongoDB Migration & RBAC Verification Tests', () => {
  test('Root endpoint GET / responds with 200 and API info', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'running');
    assert.strictEqual(res.body.healthCheck, '/api/health');
  });

  test('API root endpoint GET /api responds with 200 and route catalog', async () => {
    const res = await request(app).get('/api');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.endpoints);
    assert.strictEqual(res.body.endpoints.books, '/api/books');
  });

  test('Health check GET /api/health reports mongodb_atlas provider', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.databaseProvider, 'mongodb_atlas');
    assert.ok(['connected', 'disconnected'].includes(res.body.database));
  });

  test('Mongoose User model pre-save hook hashes password and matchPassword works', async () => {
    const testUser = new User({
      name: 'Test Hash User',
      email: 'hash_test@college.edu',
      password: 'PlainSecretPassword123!',
      role: 'student',
    });

    // Verify raw un-saved object hasn't been hashed yet
    assert.strictEqual(testUser.password, 'PlainSecretPassword123!');

    // Manually trigger pre-save hook
    await testUser.save({ validateBeforeSave: false }).catch(() => {});

    // Password must now be bcrypt-hashed (starts with $2a$ or $2b$)
    assert.match(testUser.password, /^\$2[ab]\$/);

    // matchPassword method must verify correct password
    const isCorrect = await testUser.matchPassword('PlainSecretPassword123!');
    assert.strictEqual(isCorrect, true);

    const isWrong = await testUser.matchPassword('WrongPassword');
    assert.strictEqual(isWrong, false);

    // toJSON must strip password
    const json = testUser.toJSON();
    assert.strictEqual(json.password, undefined);
  });

  test('RBAC: authorize middleware strictly rejects student role with 403 Forbidden', () => {
    const authMw = authorize('librarian', 'admin');
    const req = { user: { role: 'student' } };
    let statusCode = null;
    let jsonResult = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (obj) => {
            jsonResult = obj;
          },
        };
      },
    };
    let nextCalled = false;
    authMw(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(statusCode, 403);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(jsonResult.success, false);
    assert.match(jsonResult.message, /Forbidden.*Access denied for role 'student'/i);
  });

  test('RBAC: authorize middleware allows both librarian and admin roles to modify books', () => {
    const authMw = authorize('librarian', 'admin');

    let adminAllowed = false;
    authMw({ user: { role: 'admin' } }, {}, () => {
      adminAllowed = true;
    });
    assert.strictEqual(adminAllowed, true);

    let librarianAllowed = false;
    authMw({ user: { role: 'librarian' } }, {}, () => {
      librarianAllowed = true;
    });
    assert.strictEqual(librarianAllowed, true);
  });
});
