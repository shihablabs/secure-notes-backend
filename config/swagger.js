const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Secure Note-Taking API',
    version: '1.0.0',
    description: 'REST API for Technical Interview: JWT Authentication, Role-Based Access Control (User/Admin), Strict Database Indexing, and MongoDB Aggregation Pipelines (Scenario 1 & 2).'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local Development Server' }
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
        tags: ['Health Check'],
        summary: 'System and MongoDB Connection Health Check',
        responses: {
          200: { description: 'System health status and DB connection state' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Shihab Candidate' },
                  email: { type: 'string', example: 'shihab@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['chess', 'reading'] }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Validation error or email already in use' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user and obtain JWT Bearer token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@demo.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authentication successful with JWT token' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Retrieve currently authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile details' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/notes': {
      get: {
        tags: ['Notes Repository'],
        summary: 'Get notes with pagination (Users see own, Admin sees all)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }
        ],
        responses: {
          200: { description: 'Paginated notes list' },
          401: { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Notes Repository'],
        summary: 'Create a new secure note',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'System Architecture Notes' },
                  content: { type: 'string', example: 'MongoDB compound indexes and ESR rules.' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Note created successfully' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/api/notes/{id}': {
      get: {
        tags: ['Notes Repository'],
        summary: 'Get single note by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Note details' },
          404: { description: 'Note not found' }
        }
      },
      put: {
        tags: ['Notes Repository'],
        summary: 'Update note by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Note updated' },
          403: { description: 'Forbidden' },
          404: { description: 'Note not found' }
        }
      },
      delete: {
        tags: ['Notes Repository'],
        summary: 'Delete note by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Note deleted' },
          403: { description: 'Forbidden' },
          404: { description: 'Note not found' }
        }
      }
    },
    '/api/users/by-interests': {
      get: {
        tags: ['MongoDB Aggregations'],
        summary: 'Scenario 1: Group Users by Interests (Single aggregate pipeline)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Interests grouped with count and member names' }
        }
      }
    },
    '/api/posts': {
      get: {
        tags: ['Community Posts'],
        summary: 'Get public posts with pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          200: { description: 'Public posts list' }
        }
      },
      post: {
        tags: ['Community Posts'],
        summary: 'Publish a new post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'MongoDB Indexing Best Practices' },
                  content: { type: 'string', example: 'Always index fields used in foreignField for $lookup.' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Post published' }
        }
      }
    },
    '/api/posts/user/{id}': {
      get: {
        tags: ['MongoDB Aggregations'],
        summary: 'Scenario 2: User Posts ($lookup single pipeline)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User details with joined posts array' },
          404: { description: 'User not found' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Admin Management'],
        summary: 'List users with pagination (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }
        ],
        responses: {
          200: { description: 'Paginated user list' },
          403: { description: 'Admin access required' }
        }
      },
      post: {
        tags: ['Admin Management'],
        summary: 'Enroll new user with role assignment (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Auditor User' },
                  email: { type: 'string', example: 'auditor@example.com' },
                  password: { type: 'string', example: 'auditPass123' },
                  role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
                  interests: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User enrolled' }
        }
      }
    },
    '/api/users/{id}': {
      delete: {
        tags: ['Admin Management'],
        summary: 'Remove user from system (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User removed' },
          403: { description: 'Admin access required' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
