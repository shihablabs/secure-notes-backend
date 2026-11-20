const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

dotenv.config();

const usersData = [
  {
    name: 'Shihab Admin',
    email: 'admin@securenotes.com',
    password: 'Password123!',
    role: 'admin',
    interests: ['Artificial Intelligence', 'Cybersecurity', 'Cloud Systems']
  },
  {
    name: 'Demo Administrator',
    email: 'admin@demo.com',
    password: 'password123',
    role: 'admin',
    interests: ['Artificial Intelligence', 'Cloud Systems', 'books', 'chess']
  },
  {
    name: 'Demo User',
    email: 'user@demo.com',
    password: 'password123',
    role: 'user',
    interests: ['Web Development', 'coding', 'chess']
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@securenotes.com',
    password: 'Password123!',
    role: 'admin',
    interests: ['DevOps', 'Distributed Systems', 'Cybersecurity']
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    password: 'Password123!',
    role: 'user',
    interests: ['Artificial Intelligence', 'Web Development', 'UI/UX Design']
  },
  {
    name: 'Fatima Zahra',
    email: 'fatima.zahra@example.com',
    password: 'Password123!',
    role: 'user',
    interests: ['Cloud Systems', 'Machine Learning', 'Data Science']
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    password: 'Password123!',
    role: 'user',
    interests: ['Cybersecurity', 'Blockchain', 'Cryptography']
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    password: 'Password123!',
    role: 'user',
    interests: ['Web Development', 'Software Architecture', 'Open Source']
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Note.deleteMany();
    await Post.deleteMany();
    console.log('Existing collections cleared.');

    console.log('Seeding demo user accounts...');
    const createdUsers = [];
    for (const u of usersData) {
      const created = await User.create(u);
      createdUsers.push(created);
    }
    console.log(`Created ${createdUsers.length} user accounts.`);

    const adminUser = createdUsers[0]; // Shihab Admin
    const userAlex = createdUsers[2];  // Alex Rivera
    const userFatima = createdUsers[3]; // Fatima Zahra
    const userDavid = createdUsers[4];  // David Kim
    const userEmily = createdUsers[5];  // Emily Watson

    console.log('Seeding rich-text demo notes...');
    const notesData = [
      {
        title: 'Enterprise Security Audit & Key Rotation Schedule',
        content: '<p><strong>Overview:</strong> All SSL certificates and JWT signing keys are scheduled for bi-annual rotation.</p><h3>Key Directives:</h3><ul><li>Ensure 256-bit encryption compliance across all endpoints.</li><li>Perform database vulnerability scan on MongoDB Atlas cluster.</li><li>Audit administrative role privileges and revoke inactive sessions.</li></ul><blockquote>Security is not an afterthought, it is our core foundation.</blockquote>',
        user: adminUser._id
      },
      {
        title: 'Database Indexing Strategy (ESR Rule Implementation)',
        content: '<p>Notes collection indexes have been optimized strictly adhering to the <strong>Equality, Sort, Range (ESR)</strong> rule.</p><pre><code>NoteSchema.index({ user: 1, createdAt: -1 });\nNoteSchema.index({ createdAt: -1 });</code></pre><p>This guarantees zero full collection scans when users fetch their paginated notes stream.</p>',
        user: adminUser._id
      },
      {
        title: 'Frontend Architecture & State Management Guidelines',
        content: '<p>Here are the core engineering standards for the React 19 client environment:</p><ol><li><strong>Controlled Inputs:</strong> Never leave state as undefined; default to empty strings.</li><li><strong>Debounced Requests:</strong> Use 250ms debouncing on all search filter bars to prevent query floods.</li><li><strong>Safe HTML Entity Parsing:</strong> Always decode HTML entities before rendering card preview summaries.</li></ol>',
        user: userAlex._id
      },
      {
        title: 'Comprehensive Research: Modern Distributed Systems & Microservices',
        content: '<h1>Introduction to Distributed Systems</h1><p>Modern cloud architecture relies on decoupling services into independent components communicating via asynchronous message queues and RESTful or gRPC APIs.</p><h2>1. High Availability & Fault Tolerance</h2><p>In a distributed environment, hardware failure is treated as an inevitability rather than an anomaly. Services must be engineered to fail gracefully.</p><ul><li><strong>Circuit Breakers:</strong> Prevent cascading failures by failing fast when downstream services become unresponsive.</li><li><strong>Idempotency:</strong> Ensure that duplicate network requests result in the exact same state without unintended side effects.</li><li><strong>Replication:</strong> Maintain multi-region database replicas with automatic failover capabilities.</li></ul><h2>2. Consistency Models</h2><p>According to the CAP theorem, a distributed system can only guarantee two out of the three properties: Consistency, Availability, and Partition Tolerance.</p><blockquote>"Eventually consistent systems trade immediate guarantees for maximum uptime and horizontal scalability."</blockquote><h2>3. Next Steps</h2><p>Continue benchmarking latency thresholds under simulated heavy concurrency loads.</p>',
        user: userAlex._id
      },
      {
        title: 'Machine Learning Pipeline & Model Serving Workflow',
        content: '<p>Summary of our data preprocessing and inference service:</p><ul><li><strong>Data Ingestion:</strong> Kafka streams streaming raw metrics.</li><li><strong>Model Training:</strong> PyTorch models trained on GPU cluster.</li><li><strong>Deployment:</strong> Containerized Docker image hosted with automated health checks.</li></ul>',
        user: userFatima._id
      },
      {
        title: 'Kubernetes Cluster Configuration Checklist',
        content: '<p>Checklist for deploying production workloads:</p><ol><li>Configure horizontal pod autoscalers (HPA) targeting 70% CPU threshold.</li><li>Apply NetworkPolicies restricting inter-namespace communication.</li><li>Set resource requests and limits on every container specification.</li></ol>',
        user: userFatima._id
      },
      {
        title: 'Zero-Trust Network Access (ZTNA) Architecture Notes',
        content: '<p>Zero-Trust principle: <em>Never trust, always verify</em>.</p><p>Every request reaching our API gateway must authenticate using signed JWT tokens and undergo role-based authorization before dispatching to controllers.</p>',
        user: userDavid._id
      },
      {
        title: 'API Performance Benchmarks & Latency Targets',
        content: '<p>Target latency SLAs for backend microservices:</p><ul><li><strong>P50 Latency:</strong> &lt; 45ms</li><li><strong>P95 Latency:</strong> &lt; 120ms</li><li><strong>P99 Latency:</strong> &lt; 250ms</li></ul><p>Monitored via health check probes and Prometheus metrics.</p>',
        user: userEmily._id
      }
    ];

    await Note.insertMany(notesData);
    console.log(`Created ${notesData.length} demo notes.`);

    console.log('Seeding public community posts for Scenario 2 $lookup...');
    const postsData = [
      {
        title: 'Best Practices for MongoDB Aggregation Pipelines',
        content: 'When using $lookup stages, always index the foreignField in the joined collection to ensure high query performance.',
        user: adminUser._id
      },
      {
        title: 'Getting Started with Secure Microservices in Node.js',
        content: 'A comprehensive guide on managing JWT secret rotation and rate limiting with Express.',
        user: userAlex._id
      },
      {
        title: 'Deep Learning Model Optimization Strategies',
        content: 'Quantization and pruning techniques for reducing model latency in real-time inference.',
        user: userFatima._id
      }
    ];

    await Post.insertMany(postsData);
    console.log(`Created ${postsData.length} demo posts.`);

    console.log('\n======================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY! ');
    console.log('======================================================');
    console.log('\nDemo User Accounts (Password for all: Password123!):');
    console.log('1. [ADMIN] Shihab Admin     => admin@securenotes.com');
    console.log('2. [ADMIN] Sarah Jenkins    => sarah.jenkins@securenotes.com');
    console.log('3. [USER]  Alex Rivera      => alex.rivera@example.com');
    console.log('4. [USER]  Fatima Zahra     => fatima.zahra@example.com');
    console.log('5. [USER]  David Kim        => david.kim@example.com');
    console.log('6. [USER]  Emily Watson     => emily.watson@example.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
