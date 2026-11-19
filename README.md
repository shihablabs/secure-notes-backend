# Secure Note-Taking Application — Backend REST API

A secure, role-based RESTful API for a note-taking and community post platform built with **Node.js, Express, and MongoDB (Mongoose)**, following the standard freeCodeCamp MVC architecture.

---

## 1. Features & Architecture

- **Role-Based Access Control (RBAC):**
  - **User:** Create, view (with pagination), update, and delete their own notes.
  - **Admin:** Inherits all user capabilities, views everyone's notes, and manages users (list, add, update, delete).
- **Authentication & Security:**
  - JWT (JSON Web Tokens) with Bearer token authentication middleware.
  - Secure password hashing using `bcryptjs` via Mongoose pre-save hooks.
  - Role-based route guard middleware (`protect`, `authorize`).
- **Standard freeCodeCamp MVC Structure:**
  - `config/`: Database connection logic.
  - `models/`: Mongoose schemas and explicit indexes (`schema.index`).
  - `controllers/`: Clean business logic separation.
  - `routes/`: Modular endpoint routing.
  - `middleware/`: JWT verification and centralized error handling.

---

## 2. Strict Database Indexing Strategy

Per interview constraints, **no unnecessary indexes** have been created. All indexes are explicitly defined using the `schema.index()` method to optimize specific read, list, and aggregation operations:

| Collection | Index | Purpose & Justification |
| :--- | :--- | :--- |
| **`User`** | `{ email: 1 }` (unique) | Enforces unique accounts and provides $O(\log N)$ lookup during authentication / login (`User.findOne({ email })`). |
| **`User`** | `{ createdAt: -1 }` | Supports admin paginated user list sorted by newest creation date. |
| **`User`** | `{ interests: 1 }` | Multikey index supporting **Aggregation Scenario 1** (Group by Interests). |
| **`Note`** | `{ user: 1, createdAt: -1 }` | **Compound Index (ESR rule):** Equality on `user`, Sort on `createdAt`. Optimizes user's own paginated notes query (`Note.find({ user }).sort({ createdAt: -1 })`). |
| **`Note`** | `{ createdAt: -1 }` | Supports admin listing everyone's notes sorted by creation date with pagination. |
| **`Post`** | `{ user: 1 }` | Optimizes the `$lookup` join in **Aggregation Scenario 2**, preventing full collection scans (`COLLSCAN`) on the posts collection when joining by user. |
| **`Post`** | `{ createdAt: -1 }` | Supports public posts feed with date-based sorting and pagination. |

---

## 3. MongoDB Aggregation Tasks

### Scenario 1: Group by Interests
- **Constraint:** Exactly one `collection.aggregate()` call.
- **Endpoint:** `GET /api/users/by-interests`
- **Pipeline:**
  ```javascript
  User.aggregate([
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        users: {
          $push: { _id: '$_id', name: '$name', email: '$email', role: '$role' }
        },
        totalUsers: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        interest: '$_id',
        totalUsers: 1,
        users: 1
      }
    }
  ]);
  ```

### Scenario 2: User Posts ($lookup)
- **Constraint:** Single aggregation pipeline with a `$lookup` stage.
- **Endpoint:** `GET /api/posts/user/:userId`
- **Pipeline:**
  ```javascript
  User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'user',
        as: 'posts'
      }
    },
    { $project: { password: 0 } }
  ]);
  ```

---

## 4. API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (returns JWT token) |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT |
| `GET` | `/api/auth/profile` | Private | Get profile of logged-in user |

### Notes (`/api/notes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notes` | Private | Create a new note |
| `GET` | `/api/notes?page=1&limit=10` | Private | List notes with pagination (User sees own, Admin sees all) |
| `GET` | `/api/notes/:id` | Private | Get single note by ID (owner or admin) |
| `PUT` | `/api/notes/:id` | Private | Update note (owner or admin) |
| `DELETE` | `/api/notes/:id` | Private | Delete note (owner or admin) |

### Users & Aggregation 1 (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/by-interests` | Private | **Scenario 1:** Group users by interests aggregation |
| `GET` | `/api/users?page=1&limit=10` | Admin | List all users with pagination |
| `POST` | `/api/users` | Admin | Add new user |
| `PUT` | `/api/users/:id` | Admin | Update user details |
| `DELETE` | `/api/users/:id` | Admin | Delete a user |

### Posts & Aggregation 2 (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts?page=1&limit=10` | Public | List all public posts with pagination |
| `POST` | `/api/posts` | Private | Publish a new post |
| `GET` | `/api/posts/user/:userId` | Public | **Scenario 2:** Retrieve all posts belonging to a user ($lookup) |

---

## 5. Environment Variables

Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/secure_notes_db?retryWrites=true&w=majority
JWT_SECRET=your_secret_jwt_key
```

---

## 6. Local Setup Instructions

```bash
# Clone the repository
git clone https://github.com/shihablabs/secure-notes-backend.git
cd secure-notes-backend

# Install dependencies
npm install

# Start development server
npm run dev
```
Server runs on `http://localhost:5000`.
