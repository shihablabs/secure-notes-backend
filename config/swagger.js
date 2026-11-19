const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Secure Notes API',
    version: '1.0.0',
    description: 'Clean REST API for Notes, Authentication, and MongoDB Aggregations.'
  },
  servers: [
    { url: 'https://secure-notes-backend-qykh.onrender.com', description: 'Live Production (Render)' },
    { url: 'http://localhost:5000', description: 'Local Development' },
    { url: '/', description: 'Current Host' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API and Database Health',
        responses: { 200: { description: 'OK' } }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Shihab' },
                  email: { type: 'string', example: 'shihab@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'user' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['coding', 'reading'] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Registered' } }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@demo.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Token returned' } }
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile data' } }
      }
    },
    '/api/notes': {
      get: {
        tags: ['Notes'],
        summary: 'Get notes (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }
        ],
        responses: { 200: { description: 'List of notes' } }
      },
      post: {
        tags: ['Notes'],
        summary: 'Create a note',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Meeting Note' },
                  content: { type: 'string', example: 'Discuss project architecture.' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Created' } }
      }
    },
    '/api/notes/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Get note by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Note data' } }
      },
      put: {
        tags: ['Notes'],
        summary: 'Update note',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Updated Note' },
                  content: { type: 'string', example: 'Updated content here.' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Updated' } }
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete note',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } }
      }
    },
    '/api/users/by-interests': {
      get: {
        tags: ['Aggregations'],
        summary: 'Scenario 1: Group users by interests',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Grouped interests array' } }
      }
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Get community posts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: { 200: { description: 'List of posts' } }
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Community Post' },
                  content: { type: 'string', example: 'Excited about the interview!' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Created' } }
      }
    },
    '/api/posts/user/{id}': {
      get: {
        tags: ['Aggregations'],
        summary: 'Scenario 2: User Posts ($lookup)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User with joined posts' } }
      }
    },
    '/api/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }
        ],
        responses: { 200: { description: 'Users list' } }
      },
      post: {
        tags: ['Admin'],
        summary: 'Add user (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'New User' },
                  email: { type: 'string', example: 'newuser@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'user' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['tech'] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'User created' } }
      }
    },
    '/api/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete user (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User deleted' } }
      }
    }
  }
};

module.exports = swaggerDocument;
