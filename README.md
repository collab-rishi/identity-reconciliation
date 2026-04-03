# Bitespeed Identity Reconciliation Service

A production-ready Node.js/TypeScript backend service designed to consolidate customer identities across multiple purchases.

## 🚀 Live Demo

#### Endpoint: https://identity-reconciliation-3et5.onrender.com

## 🏗️ Architecture & Design

This project follows a Layered Architecture pattern to ensure maintainability, testability, and separation of concerns.

### The Layers:

- **Routes**: Handles URL mapping and attaches security/validation middleware.

- **Middleware**: Uses Zod for schema validation (Fast-Fail) and a global error handler for standardized JSON error responses.

- **Controllers**: Manages the HTTP lifecycle (parsing request bodies and returning status codes).

- **Services**: The "Brain" of the app. Implements the complex Identity Reconciliation Algorithm, including primary-to-secondary merging.

- **Repositories**: Isolated data access layer using Prisma ORM and PostgreSQL.

## 🛠️ Tech Stack

- Language: TypeScript

- Runtime: Node.js

- Framework: Express.js

- Database: PostgreSQL

- ORM: Prisma

- Validation: Zod

- Hosting: Render / Railway

## 🧠 Reconciliation Logic

The service handles four key scenarios:

- **New User**: If no matching email or phone number exists, a new Primary contact is created.

- **Existing Identity**: If a match is found but contains no new information, the system returns the consolidated identity without creating redundant rows (Idempotency).

- **Secondary Linkage**: If a match is found with a new piece of information (e.g., a new email for an existing phone number), a Secondary contact is created and linked to the original Primary.

#### **Primary Collision & Recursive Flattening**:

- If a request bridges two separate Primary accounts, the system identifies the older record (via createdAt) as the "True Primary."

- The newer Primary is demoted to Secondary.

- Crucially, all existing Secondaries of the demoted Primary are recursively updated to point directly to the True Primary. This maintains a flat tree structure (depth of 1), preventing nested identity chains and optimizing query performance.

## 💡 Design Decisions & Trade-offs

### 1. Relational Integrity with PostgreSQL

Chose **PostgreSQL** over NoSQL because identity reconciliation requires **Strong Consistency**. During a "Primary Merge," we need to ensure that the demotion of one contact and the re-linking of its descendants happen atomically to prevent data fragmentation.

### 2. Recursive Flattening Strategy

Instead of allowing "linked chains" (A to B to C), the service implements a **Recursive Flattening** algorithm. When two primaries merge, all existing secondaries are updated to point directly to the new "True Primary."

- **Benefit:** Reduces database lookup complexity from O(N) to O(1) for identity resolution.

### 3. Layered Repository Pattern

By isolating Prisma logic into a dedicated **Repository Layer**, the **Service Layer** remains agnostic of the database implementation. This makes the business logic easier to unit test and allows for swapping the ORM/Database in the future with minimal code changes.

### 4. Timestamp-Based Truth

Used `createdAt` as the "Source of Truth" for Primary status. This ensures that the original customer interaction is always respected, providing a consistent historical timeline even if database IDs are non-sequential.

## 🛠️ Local Setup

Clone the repo:

```Bash
git clone https://github.com/collab-rishi/identity-reconciliation.git
cd bitespeed-task
```

Install dependencies:

```Bash
npm install
```

Configure Environment:
Create a .env file:

```Code snippet
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed"
PORT=3000
```

Database Setup:

```Bash
npx prisma migrate dev --name init
npx prisma generate
```

Run Development Server:

```Bash
npm run dev
```

## 🧪 API Testing Guide (Step-by-Step)

### 1. Create Initial Primary

Request:
`POST /identify`

```JSON
{
    "email": "ishaan.v@gmail.com",
    "phoneNumber": "9812345678"
}
```

- **Result**: Created as **ID 1** (Primary)

### 2. Create Second Primary (Independent)

Request: `POST /identify`

```JSON
{
    "email": "advait.tek@gmail.com",
    "phoneNumber": "7011223344"
}
```

- **Result**: Created as **ID 2** (Primary).

### 3. Create Secondary for Advait

Request: `POST /identify`

```JSON
{
    "email": "advait.tek@gmail.com",
    "phoneNumber": "5555555555"
}
```

- **Result**: Created as **ID 3** (Secondary), linkedId: 2.

### 4. THE BIG MERGE (Primary Collision)

Request: `POST /identify`

```JSON
{
    "email": "ishaan.v@gmail.com",
    "phoneNumber": "7011223344"
}
```

- **The Logic**: This request bridges "Ishaan" (ID 1) and "Advait" (ID 2).

- **The Outcome**: ID 2 is demoted to Secondary. Crucially, ID 3 (Advait's old child) is also updated to point to ID 1.

Response:

```JSON
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["ishaan.v@gmail.com", "advait.tek@gmail.com"],
    "phoneNumbers": ["9812345678", "7011223344", "5555555555"],
    "secondaryContactIds": [2, 3]
  }
}
```
