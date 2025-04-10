# REST API Plan

## 1. Resources

- **Users** - Stored in the `users` table, representing employees and managers with hierarchical relationships
- **Assessment Processes** - Stored in the `assessment_processes` table, representing evaluation cycles with status tracking
- **Goals** - Stored in the `goals` table, containing individual objectives assigned to employees
- **Goal Categories** - Stored in the `goal_categories` table, providing standardized categorization options
- **Self-Assessments** - Stored in the `self_assessments` table, containing employee evaluations of their goals
- **Manager Assessments** - Stored in the `manager_assessments` table, containing manager evaluations of employee goals
- **Predefined Goals** - Stored in a `predefined_goals` table, containing template goals that managers can choose from

## 2. Endpoints

### Authentication

- **POST /auth/login**
  - Description: Authenticate user using Supabase Auth
  - Request Payload: `{ "email": "string", "password": "string" }`
  - Response: `{ "token": "string", "user": { "id": "uuid", "email": "string", "role": "string" } }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 400 Bad Request

- **GET /auth/me**
  - Description: Get current authenticated user information
  - Response: `{ "id": "uuid", "email": "string", "role": "string", "managerId": "uuid" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized

### Users

- **GET /users**
  - Description: Get a list of users (for admin purposes)
  - Query Parameters: `role` (optional), `page`, `limit`
  - Response: `{ "users": [{ "id": "uuid", "email": "string", "name": "string", "role": "string", "managerId": "uuid" }], "total": "number", "page": "number", "limit": "number" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden

- **GET /users/{userId}**
  - Description: Get a specific user
  - Response: `{ "id": "uuid", "email": "string", "name": "string", "role": "string", "managerId": "uuid" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **GET /managers/{managerId}/employees**
  - Description: Get all employees for a specific manager
  - Query Parameters: `page`, `limit`
  - Response: `{ "employees": [{ "id": "uuid", "email": "string", "name": "string" }], "total": "number", "page": "number", "limit": "number" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

### Assessment Processes

- **GET /assessment-processes**
  - Description: Get a list of assessment processes
  - Query Parameters: `status`, `active`, `page`, `limit`
  - Response: `{ "processes": [{ "id": "uuid", "name": "string", "status": "string", "active": "boolean", "startDate": "date", "endDate": "date" }], "total": "number", "page": "number", "limit": "number" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized

- **GET /assessment-processes/{processId}**
  - Description: Get a specific assessment process
  - Response: `{ "id": "uuid", "name": "string", "status": "string", "active": "boolean", "startDate": "date", "endDate": "date" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found

- **GET /assessment-processes/{processId}/status-history**
  - Description: Get status history for an assessment process
  - Response: `{ "history": [{ "status": "string", "changedAt": "datetime", "changedBy": { "id": "uuid", "name": "string" } }] }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /assessment-processes/{processId}/status**
  - Description: Update the status of an assessment process
  - Request Payload: `{ "status": "string" }`
  - Response: `{ "id": "uuid", "status": "string", "previousStatus": "string", "changedAt": "datetime" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request

### Goals

- **GET /assessment-processes/{processId}/employees/{employeeId}/goals**
  - Description: Get all goals for a specific employee in an assessment process
  - Response: `{ "goals": [{ "id": "uuid", "description": "string", "weight": "number", "category": { "id": "uuid", "name": "string" } }], "totalWeight": "number" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **POST /assessment-processes/{processId}/employees/{employeeId}/goals**
  - Description: Create a new goal for an employee in an assessment process
  - Request Payload: `{ "description": "string", "weight": "number", "categoryId": "uuid" }`
  - Response: `{ "id": "uuid", "description": "string", "weight": "number", "category": { "id": "uuid", "name": "string" }, "validationErrors": [] }`
  - Success: 201 Created
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request

- **GET /goals/{goalId}**
  - Description: Get a specific goal
  - Response: `{ "id": "uuid", "description": "string", "weight": "number", "category": { "id": "uuid", "name": "string" }, "employee": { "id": "uuid", "name": "string" }, "process": { "id": "uuid", "name": "string" } }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /goals/{goalId}**
  - Description: Update a goal
  - Request Payload: `{ "description": "string", "weight": "number", "categoryId": "uuid" }`
  - Response: `{ "id": "uuid", "description": "string", "weight": "number", "category": { "id": "uuid", "name": "string" }, "validationErrors": [] }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request

- **DELETE /goals/{goalId}**
  - Description: Delete a goal
  - Success: 204 No Content
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

- **GET /predefined-goals**
  - Description: Get a list of predefined goals
  - Query Parameters: `category`, `page`, `limit`
  - Response: `{ "goals": [{ "id": "uuid", "description": "string", "categoryId": "uuid", "categoryName": "string" }], "total": "number", "page": "number", "limit": "number" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized

### Goal Categories

- **GET /goal-categories**
  - Description: Get all goal categories
  - Response: `{ "categories": [{ "id": "uuid", "name": "string" }] }`
  - Success: 200 OK
  - Errors: 401 Unauthorized

### Self-Assessments

- **POST /goals/{goalId}/self-assessment**
  - Description: Create or update a self-assessment for a goal
  - Request Payload: `{ "rating": "number", "comments": "string" }`
  - Response: `{ "id": "uuid", "rating": "number", "comments": "string", "createdAt": "datetime" }`
  - Success: 201 Created
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request

- **GET /goals/{goalId}/self-assessment**
  - Description: Get the self-assessment for a goal
  - Response: `{ "id": "uuid", "rating": "number", "comments": "string", "createdAt": "datetime", "updatedAt": "datetime" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

### Manager Assessments

- **POST /goals/{goalId}/manager-assessment**
  - Description: Create or update a manager assessment for a goal
  - Request Payload: `{ "rating": "number", "comments": "string" }`
  - Response: `{ "id": "uuid", "rating": "number", "comments": "string", "createdAt": "datetime" }`
  - Success: 201 Created
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request

- **GET /goals/{goalId}/manager-assessment**
  - Description: Get the manager assessment for a goal
  - Response: `{ "id": "uuid", "rating": "number", "comments": "string", "createdAt": "datetime", "updatedAt": "datetime" }`
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 404 Not Found

## 3. Authentication and Authorization

The application will use Supabase Authentication for secure user access:

- Authentication will be handled via JWT tokens
- Client-side will interact directly with Supabase Auth API for login/registration
- Backend API endpoints will validate JWT tokens
- Row Level Security (RLS) policies will be implemented in Supabase to restrict data access:
  - Employees can only view and edit their own data
  - Managers can view and edit data for their direct reports
  - Assessment process status will determine which operations are allowed

## 4. Validation and Business Logic

### Goal Validation
- Weight of a single goal must be in range 0% to 100%
- API will validate this constraint for all goal creation/update operations
- If validation fails, the API will return validation errors in the response

### Assessment Process Status Flow
- Assessment processes follow a defined status flow:
  - "in definition" → "in self-assessment" → "awaiting manager assessment" → "completed"
- API endpoints will enforce status constraints:
  - Goals can only be created/edited when process is "in definition"
  - Self-assessments can only be created/edited when process is "in self-assessment"
  - Manager assessments can only be created/edited when process is "awaiting manager assessment"

### Business Logic Implementation
- Goal creation/update endpoints will validate single goal weight between 0% and 100%
- Assessment ratings must be in range between 0% and 150%
- Status change endpoint will validate that all required actions are completed before allowing status transition
- User role and hierarchy checks will be performed on all endpoints that require authorization
- Query parameters will enable filtering and pagination for list endpoints
- API will maintain created_at/updated_at timestamps for all resources for auditing purposes 