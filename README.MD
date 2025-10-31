# NodeWave Backend Assessment - File Processing API

Hey there! Welcome to my submission for the NodeWave Backend Assessment. This project demonstrates a backend system that can handle large Excel file uploads without blocking the user experience. 

## What's This All About?

Imagine you're dealing with a massive Excel file with thousands of products. The old way would make users wait forever while the server crunches through all that data. Not cool, right?

This system takes a different approach: upload the file, get an instant confirmation, and let the processing happen in the background. Users can check back anytime to see the progress or grab their data once it's ready.

## Key Features Built

### The Must-Haves ✓
- **Secure Authentication** - JWT-based login system so only authorized users can access their data
- **Excel File Processing** - Handles both `.xlsx` and `.csv` files gracefully
- **Background Job Processing** - Files process asynchronously, no more hanging requests
- **Smart Filtering & Pagination** - Query your data exactly how you need it (using FilterQueryV2)
- **Real-time Progress Tracking** - Know exactly how many rows have been processed
- **Retry Mechanism** - Failed? No problem, retry with one click

### Bonus Goodies 🎁
- **Todo Management** - A full CRUD demo showing filtering in action
- **Multi-format Support** - Works with Excel (both `.xls` and `.xlsx`) and CSV
- **URL-based Processing** - Don't even need to upload, just send a file URL
- **Batch Processing** - Handles huge files by processing in chunks of 100 rows

## How It Works

Here's the flow when someone uploads a file:

```
User Uploads File
    ↓
API creates a tracking entry (status: IN_PROGRESS)
    ↓
Returns success immediately ← User can continue using the app
    ↓
Background job kicks in
    ↓
Processes Excel file row by row (100 rows at a time)
    ↓
Updates progress in real-time
    ↓
Status changes to COMPLETED (or FAILED if something went wrong)
```

The beauty? The user never waits around. They get instant feedback and can check back whenever.

## Getting Started

### What You'll Need
- Node.js v16 or newer
- MySQL database
- npm (comes with Node.js)

### Setup Steps

**1. Clone and Install**
```bash
git clone <your-repo-url>
cd be-test
npm install
```

**2. Configure Your Environment**

Copy the example environment file:
```bash
cp example.env .env
```

Then edit `.env` with your details:
```env
DATABASE_URL="mysql://username:password@localhost:3306/nodewave_test"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
NODE_LOCAL_PORT=3150
ENVIRONMENT=dev
```

**3. Setup the Database**

Run migrations to create all necessary tables:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**4. Fire It Up**
```bash
npm run dev
```

Your API should now be running at `http://localhost:3150`. You're all set!

## API Guide

I've included a Postman collection with examples, but here's a quick rundown:

### Authentication

**Sign Up**
```bash
POST /auth/register

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+62812345678",
  "country": "Indonesia",
  "bio": "Backend Engineer"
}
```

**Login**
```bash
POST /auth/login

{
  "email": "john@example.com",
  "password": "password123"
}
```

You'll get back a JWT token - use it in the `Authorization: Bearer <token>` header for protected routes.

### File Processing - The Main Event

**Upload a File**
```bash
POST /file-process/upload
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

file: <your-excel-file>
```

Response looks like:
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing started in background.",
  "data": {
    "id": "some-uuid",
    "fileName": "products.xlsx",
    "status": "IN_PROGRESS",
    "totalRows": 0,
    "processedRows": 0,
    "startedAt": "2024-01-01T00:00:00Z"
  }
}
```

Notice how you get an immediate response? That's the non-blocking magic at work.

**Check Progress**
```bash
GET /file-process/:id
Authorization: Bearer <your-token>
```

This shows you real-time progress. Keep polling this until status becomes `COMPLETED`.

**Get All Your Uploads**
```bash
GET /file-process?filters={"status":"COMPLETED"}&page=1&rows=10
Authorization: Bearer <your-token>
```

**Process from URL (Alternative)**

Don't want to upload? Just send a file URL:
```bash
POST /file-process/process-url
Authorization: Bearer <your-token>

{
  "fileUrl": "https://example.com/products.xlsx",
  "fileName": "products.xlsx"
}
```

**Retry Failed Jobs**

If something went wrong:
```bash
POST /file-process/:id/retry
Authorization: Bearer <your-token>
```

**View Processed Products**
```bash
GET /file-process/:id/products?page=1&rows=20
Authorization: Bearer <your-token>
```

### Filtering & Search - The Cool Stuff

This is where FilterQueryV2 shines. You can combine multiple filters:

**Exact Match Filter**
```
GET /file-process/:id/products?filters={"category":"Electronics"}
```

**Search (Partial Match)**
```
GET /file-process/:id/products?searchFilters={"name":"phone"}
```

**Price Range**
```
GET /file-process/:id/products?rangedFilters=[{"key":"price","start":100,"end":500}]
```

**Combine Everything**
```
GET /file-process/:id/products?filters={"category":"Electronics"}&searchFilters={"name":"laptop"}&rangedFilters=[{"key":"price","start":500,"end":1500}]&page=1&rows=20&orderKey=price&orderRule=asc
```

Want electronics, with "laptop" in the name, priced between $500-$1500, sorted by price ascending, 20 items per page? Done.

### Todo Endpoints (Bonus Feature)

I built a complete todo system to showcase the filtering capabilities:

**Create Todo**
```bash
POST /todos
Authorization: Bearer <your-token>

{
  "task": "Complete NodeWave assessment"
}
```

**Get All Todos with Filters**
```bash
GET /todos?filters={"status":"PENDING"}&searchFilters={"task":"assessment"}&page=1&rows=10
```

**Update Todo Status**
```bash
PATCH /todos/:id

{
  "status": "SUCCESS"
}
```

**Bulk Delete**
```bash
POST /todos/delete-multiple

{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Excel File Format

Your Excel files should have these columns:

| Column | Required? | Type | Default |
|--------|-----------|------|---------|
| name | ✓ | String | - |
| category | ✓ | String | - |
| price | ✓ | Number | - |
| stock | | Number | 0 |
| description | | String | - |

Example data:
```
name              | category    | price  | stock | description
iPhone 14 Pro     | Electronics | 999.99 | 50    | Latest iPhone model
MacBook Pro M2    | Electronics | 1999   | 25    | M2 chip laptop
Herman Miller     | Furniture   | 1395   | 20    | Ergonomic office chair
```

Check `SAMPLE_DATA.md` for more examples you can use for testing.

## Project Structure

Here's how everything is organized:

```
be-test/
├── src/
│   ├── controllers/          # Request handlers
│   │   └── rest/
│   │       ├── AuthController.ts
│   │       ├── TodoController.ts
│   │       └── FileProcessController.ts
│   ├── services/             # Business logic layer
│   │   ├── AuthService.ts
│   │   ├── FileProcessService.ts
│   │   └── helpers/
│   │       └── FilterQueryV2.ts    # The filtering magic
│   ├── middlewares/          # Auth & logging
│   ├── routes/               # Route definitions
│   ├── utils/                # Helper functions
│   └── validations/          # Input validation
├── prisma/
│   ├── schema.prisma         # Database models
│   └── seeds/                # Test data
├── uploads/                  # Where uploaded files live
└── NodeWave-Assessment.postman_collection.json
```

## Testing

Run the test suite:
```bash
npm test
```

Or test manually with the Postman collection I've included. It has example requests for every endpoint.

### Quick Manual Test with curl

**Register a user:**
```bash
curl -X POST http://localhost:3150/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3150/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Upload file:**
```bash
curl -X POST http://localhost:3150/file-process/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.xlsx"
```

## Security Features

I didn't skip on security:
- Passwords hashed with bcryptjs (salt rounds configured)
- JWT tokens for stateless authentication
- User-specific data isolation (you can only see your own uploads)
- Input validation on all endpoints
- SQL injection protection via Prisma ORM
- File type validation (only Excel/CSV allowed)
- File size limits (10MB max)

## Performance Optimizations

Some design choices I made for performance:

1. **Batch Processing** - Large files processed in 100-row chunks to avoid memory issues
2. **Non-blocking I/O** - Background jobs don't block the main thread
3. **Database Indexing** - Key columns indexed for faster queries
4. **Connection Pooling** - Prisma manages DB connections efficiently
5. **Pagination** - Never return massive datasets, always paginate

## Design Patterns Used

I kept things clean and maintainable:

- **Service Layer Pattern** - Business logic separated from controllers
- **Repository Pattern** - Data access abstracted through Prisma
- **Middleware Pattern** - Auth and logging as reusable middleware
- **Background Job Pattern** - File processing doesn't block requests
- **Factory Pattern** - Services instantiated through dependency injection

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "message": "Something went wrong",
  "data": null
}
```

HTTP status codes follow standard conventions:
- `200` - Everything's good
- `201` - Resource created
- `400` - Bad request (check your input)
- `401` - Not authenticated
- `404` - Resource not found
- `409` - Conflict (duplicate entry)
- `500` - Server error (check logs)

## Assessment Requirements ✓

Let me map this to the original requirements:

- [x] **JWT Authentication** - Full register/login system
- [x] **Excel Processing** - Handles XLSX, XLS, and CSV
- [x] **Background Processing** - Non-blocking with progress tracking
- [x] **Filtering & Pagination** - FilterQueryV2 with dynamic queries
- [x] **Status Tracking** - Real-time progress updates
- [x] **Retry Mechanism** - One-click retry for failed jobs
- [x] **Code Quality** - Clean, documented, TypeScript
- [x] **Documentation** - Comprehensive README + Postman collection

## What I Learned

This project was a great exercise in:
- Designing non-blocking APIs
- Handling large file processing efficiently
- Building flexible filtering systems
- Structuring TypeScript backends cleanly
- Writing documentation that others can actually use

## Final Thoughts

I focused on building something that actually works in production. No shortcuts, proper error handling, clean code structure, and comprehensive documentation.

The filtering system is particularly powerful - users can query their data in pretty much any way they need. The background processing ensures a smooth user experience even with massive files.

Thanks for the opportunity to work on this. I'm excited to discuss the technical decisions I made!

---

**Questions?** Feel free to reach out. All my contact info should be in the assessment invitation.

**Repository:** Private (invited collaborators: rizqyep, Mkput, nodewavescout)

**Postman Collection:** `NodeWave-Assessment.postman_collection.json` in the root directory
