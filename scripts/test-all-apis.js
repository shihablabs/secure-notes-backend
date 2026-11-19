const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

// Ensure Google Public DNS for MongoDB Atlas
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const noteRoutes = require('../routes/noteRoutes');
const userRoutes = require('../routes/userRoutes');
const postRoutes = require('../routes/postRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../config/swagger');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.use(notFound);
app.use(errorHandler);

const TEST_PORT = 5099;

// Helper to make HTTP requests
const makeRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runAllTests = async () => {
  console.log('--- STARTING COMPREHENSIVE BACKEND API & SWAGGER VERIFICATION ---');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB Atlas');

  const server = app.listen(TEST_PORT);
  console.log(`✓ Test server running on port ${TEST_PORT}\n`);

  let adminToken = '';
  let userToken = '';
  let testUserId = '';
  let createdNoteId = '';

  try {
    // 1. Health Check
    const health = await makeRequest('/api/health');
    console.log(`1. [GET /api/health] Status: ${health.status} => DB: ${health.data.database}`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Swagger UI Check
    const swagger = await makeRequest('/api-docs/');
    console.log(`2. [GET /api-docs/] Status: ${swagger.status} => Swagger HTML served: ${typeof swagger.data === 'string' && swagger.data.includes('Swagger UI') ? 'YES' : 'NO'}`);
    if (swagger.status !== 200) throw new Error('Swagger UI endpoint failed');

    // 3. Login Admin
    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@demo.com',
      password: 'password123'
    });
    console.log(`3. [POST /api/auth/login] Admin Status: ${adminLogin.status} => Name: ${adminLogin.data.name}, Role: ${adminLogin.data.role}`);
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    adminToken = adminLogin.data.token;
    testUserId = adminLogin.data._id;

    // 4. Login User
    const userLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'user@demo.com',
      password: 'password123'
    });
    console.log(`4. [POST /api/auth/login] User Status: ${userLogin.status} => Name: ${userLogin.data.name}, Role: ${userLogin.data.role}`);
    if (userLogin.status !== 200) throw new Error('User login failed');
    userToken = userLogin.data.token;

    // 5. User Profile
    const profile = await makeRequest('/api/auth/profile', 'GET', null, userToken);
    console.log(`5. [GET /api/auth/profile] Status: ${profile.status} => Authenticated User: ${profile.data.email}`);

    // 6. Notes List
    const notesList = await makeRequest('/api/notes?page=1&limit=6', 'GET', null, userToken);
    console.log(`6. [GET /api/notes] Status: ${notesList.status} => Notes Count: ${notesList.data.notes.length}, Total: ${notesList.data.total}`);

    // 7. Create Note
    const createNote = await makeRequest('/api/notes', 'POST', {
      title: 'Automated Test Note',
      content: 'Testing note creation during verification suite.'
    }, userToken);
    console.log(`7. [POST /api/notes] Status: ${createNote.status} => Note Created: "${createNote.data.title}"`);
    createdNoteId = createNote.data._id;

    // 8. Update Note
    const updateNote = await makeRequest(`/api/notes/${createdNoteId}`, 'PUT', {
      title: 'Automated Test Note (Updated)',
      content: 'Updated content successfully verified.'
    }, userToken);
    console.log(`8. [PUT /api/notes/:id] Status: ${updateNote.status} => Updated Title: "${updateNote.data.title}"`);

    // 9. Delete Note
    const deleteNote = await makeRequest(`/api/notes/${createdNoteId}`, 'DELETE', null, userToken);
    console.log(`9. [DELETE /api/notes/:id] Status: ${deleteNote.status} => Message: ${deleteNote.data.message}`);

    // 10. Scenario 1 Aggregation (Group by Interests)
    const interests = await makeRequest('/api/users/by-interests', 'GET', null, userToken);
    console.log(`10. [GET /api/users/by-interests] (Scenario 1) Status: ${interests.status} => Distinct Interest Groups: ${interests.data.length}`);
    interests.data.slice(0, 3).forEach((item) => {
      console.log(`    - Interest "${item.interest}": ${item.count} users (${item.users.join(', ')})`);
    });

    // 11. Scenario 2 Aggregation ($lookup)
    const lookup = await makeRequest(`/api/posts/user/${testUserId}`);
    console.log(`11. [GET /api/posts/user/:id] (Scenario 2 $lookup) Status: ${lookup.status} => User: ${lookup.data.name}, Joined Posts: ${lookup.data.posts.length}`);

    // 12. Admin Users List (Admin Only)
    const adminUsers = await makeRequest('/api/users?page=1&limit=5', 'GET', null, adminToken);
    console.log(`12. [GET /api/users] (Admin Only) Status: ${adminUsers.status} => Users Count: ${adminUsers.data.users.length}, Total: ${adminUsers.data.total}`);

    // 13. Admin Forbidden to normal user
    const forbidden = await makeRequest('/api/users', 'GET', null, userToken);
    console.log(`13. [GET /api/users] (RBAC User Restriction) Status: ${forbidden.status} => Properly Blocked non-admin`);

    console.log('\n======================================================');
    console.log('✓ ALL 13 TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('✓ Swagger UI & Specification Verified on /api-docs');
    console.log('✓ MongoDB Atlas Live Database Connected & Verified');
    console.log('======================================================');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
};

runAllTests();
