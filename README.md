# Mini E-Commerce API

A scalable RESTful API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB. This API provides comprehensive functionality for managing products, users, shopping carts, orders, and payments with demo payment processing.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Assumptions Made](#assumptions-made)
- [Deployment](#deployment)
- [Postman](#postman)
- [License](#license)

## 🚀 Tech Stack

### Backend Framework & Runtime
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript

### Database & ORM
- **MongoDB** - NoSQL database
- **Prisma** - Next-generation ORM for database operations

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting for API protection
- **CORS** - Cross-origin resource sharing



### Email
- **Nodemailer** - Email sending capabilities


### Validation & Error Handling
- **Zod** - Schema validation
- **Custom error handlers** - Centralized error management

### Utilities
- **dayjs/luxon** - Date manipulation
- **cookie-parser** - Cookie parsing
- **morgan** - HTTP request logger
- **http-status** - HTTP status codes

### Development Tools
- **ts-node-dev** - Development server with hot reload
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Deployment
- **Vercel** - Serverless deployment platform
- **Vercel-URL** - https://documenter.getpostman.com/view/39636095/2sBXcAKiy1

### Postman
- **URL** - https://documenter.getpostman.com/view/39636095/2sBXcAKiy1

## ✨ Features

- 🔐 **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Customer, Admin, Super Admin)
  - Email verification with OTP
  - Password reset functionality
  - Multi-device login tracking with FCM tokens

- 🛍️ **Product Management**
  - CRUD operations for products
  - Category management
  - Stock tracking
  - Soft delete functionality

- 🛒 **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Cart persistence per user
  - Unique product constraint per user

- 📦 **Order Management**
  - Order creation with unique order numbers
  - Order status tracking (Pending → Confirmed → Processing → Shipped → Delivered)
  - Order cancellation with reason tracking
  - Order history
  - Shipping address management

- 💳 **Payment Processing**
  - Multiple payment methods (Cash on Delivery, Credit/Debit Card, Mobile Payment)
  - Payment status tracking
  - Transaction ID management
  - Refund support

- 👤 **User Profile Management**
  - Profile completion tracking
  - User verification status
  - Fraud detection (fraud score tracking)
  - Canceled order tracking
  - User blocking and management

- 🔒 **Security Features**
  - Rate limiting
  - Helmet security headers
  - Password encryption
  - JWT token expiration
  - CORS configuration

## 📊 Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Admin : has
    User ||--o{ Product : creates
    User ||--o{ Cart : has
    User ||--o{ Order : places
    User ||--o{ Payment : makes
    User ||--o{ OrderItem : has
    
    Product ||--o{ Cart : contains
    Product ||--o{ OrderItem : includes
    
    Order ||--o{ OrderItem : contains
    Order ||--|| Payment : has
    
    User {
        ObjectId id PK
        String fullName
        String email UK
        String password
        UserRoleEnum role
        UserStatus status
        Boolean isVerified
        Boolean isProfileComplete
        String address
        Boolean isLoggedIn
        String bio
        String image
        String phoneNumber
        String dateOfBirth
        String gender
        String fcmToken
        String fcmTokenEx
        Boolean isDeleted
        Boolean isVerifiedForPasswordReset
        Int fraudScore
        Int canceledOrdersCount
        DateTime createdAt
        DateTime updatedAt
    }
    
    Admin {
        ObjectId id PK
        ObjectId userId FK
        UserRoleEnum role
        Boolean isSuperAdmin
        Boolean systemOwner
        DateTime createdAt
        DateTime updatedAt
    }
    
    Product {
        ObjectId id PK
        ObjectId userId FK
        String name
        String description
        Float price
        Int stock
        String category
        String image
        Boolean isDeleted
        DateTime createdAt
        DateTime updatedAt
    }
    
    Cart {
        ObjectId id PK
        ObjectId userId FK
        ObjectId productId FK
        Int quantity
        DateTime createdAt
        DateTime updatedAt
    }
    
    Order {
        ObjectId id PK
        ObjectId userId FK
        String orderNumber UK
        Float totalAmount
        OrderStatus status
        String shippingAddress
        PaymentStatus paymentStatus
        String notes
        DateTime canceledAt
        String cancelReason
        DateTime createdAt
        DateTime updatedAt
    }
    
    OrderItem {
        ObjectId id PK
        ObjectId userId FK
        ObjectId orderId FK
        ObjectId productId FK
        Int quantity
        Float price
        Float subtotal
        DateTime createdAt
        DateTime updatedAt
    }
    
    Payment {
        ObjectId id PK
        ObjectId orderId FK
        ObjectId userId FK
        Float amount
        PaymentMethod paymentMethod
        String transactionId UK
        PaymentStatus status
        DateTime paidAt
        DateTime createdAt
        DateTime updatedAt
    }
```

### Enums

**UserRoleEnum**: `ADMIN`, `SUPER_ADMIN`, `CUSTOMER`

**UserStatus**: `ACTIVE`, `PENDING`, `BLOCKED`

**OrderStatus**: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELED`

**PaymentStatus**: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

**PaymentMethod**: `CASH_ON_DELIVERY`, `CREDIT_CARD`, `DEBIT_CARD`, `MOBILE_PAYMENT`

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** database (local or cloud instance like MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Mini-E-Commerce-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Application
   NODE_ENV=development
   PORT=5000
   BACKEND_BASE_URL=http://localhost:5000
   FRONTEND_BASE_URL=http://localhost:3000

   # Database
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname

   # Authentication
   BCRYPT_SALT_ROUNDS=12
   JWT_ACCESS_SECRET=your-access-secret-key
   JWT_ACCESS_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key
   JWT_REFRESH_EXPIRES_IN=365d
   JWT_OTP_SECRET=your-otp-secret-key
   JWT_OTP_EXPIRES_IN=10m

   # Security
   CSRF_SECRET=your-csrf-secret
   COOKIE_SECRET=your-cookie-secret
   RATE_LIMIT_MAX=1000

   # Super Admin
   SUPER_ADMIN_PASSWORD=your-super-admin-password

   # Email Configuration
   EMAIL=your-email@gmail.com
   APP_PASS=your-app-specific-password

   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Push database schema to MongoDB**
   ```bash
   npx prisma db push
   ```


6. **Build the project**
   ```bash
   npm run build
   ```

### Running the Application

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### Database Management

**Open Prisma Studio** (Database GUI):
```bash
npx prisma studio
```

**Update database schema** after modifying `schema.prisma`:
```bash
npx prisma db push
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `DATABASE_URL` | MongoDB connection string | Yes |
| `JWT_ACCESS_SECRET` | Secret key for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Yes |
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for bcrypt | Yes |
| `EMAIL` | Email address for sending emails | Yes |
| `APP_PASS` | App-specific password for email | Yes |

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Available Routes

- **Auth**: `/api/v1/auth` - Authentication endpoints
- **Users**: `/api/v1/users` - User management
- **Products**: `/api/v1/products` - Product CRUD operations
- **Cart**: `/api/v1/cart` - Shopping cart management
- **Orders**: `/api/v1/orders` - Order management
- **Payments**: `/api/v1/payments` - Payment processing

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📁 Project Structure

```
Mini E-Commerce API/
├── prisma/
│   └── schema.prisma          # Prisma database schema
├── src/
│   ├── app/
│   │   ├── DB/               # Database configuration
│   │   ├── errors/           # Custom error classes
│   │   ├── interface/        # TypeScript interfaces
│   │   ├── middlewares/      # Express middlewares
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── cart/        # Cart module
│   │   │   ├── order/       # Order module
│   │   │   ├── payments/    # Payments module
│   │   │   ├── product/     # Product module
│   │   │   └── user/        # User module
│   │   ├── routes/          # Route aggregator
│   │   ├── scripts/         # Utility scripts
│   │   └── utils/           # Helper functions
│   ├── config/              # Configuration files
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── .env                      # Environment variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment config
└── README.md                # Documentation
```

## 🏗️ Key Architectural Decisions

### 1. **Modular Architecture**
- **Decision**: Organized code into feature-based modules (auth, cart, order, product, user, payments)
- **Rationale**: Improves code maintainability, scalability, and allows teams to work on different features independently
- **Implementation**: Each module contains its own controller, service, routes, and validation

### 2. **TypeScript for Type Safety**
- **Decision**: Use TypeScript instead of plain JavaScript
- **Rationale**: Provides compile-time type checking, better IDE support, and reduces runtime errors
- **Benefits**: Enhanced developer experience, easier refactoring, self-documenting code

### 3. **Prisma ORM**
- **Decision**: Use Prisma instead of Mongoose or native MongoDB driver
- **Rationale**: 
  - Type-safe database queries
  - Automatic migration management
  - Excellent TypeScript integration
  - Built-in connection pooling
- **Trade-offs**: Less flexibility for complex MongoDB-specific queries

### 4. **MongoDB (NoSQL) Database**
- **Decision**: Use MongoDB instead of PostgreSQL/MySQL
- **Rationale**:
  - Flexible schema for evolving e-commerce requirements
  - Horizontal scalability
  - Good performance for read-heavy operations
  - Natural JSON/JavaScript integration
- **Considerations**: Requires careful design to maintain data consistency

### 5. **JWT-based Authentication**
- **Decision**: Implement token-based authentication with access and refresh tokens
- **Rationale**: 
  - Stateless authentication (no server-side session storage)
  - Scalable for distributed systems
  - Mobile-friendly
- **Security**: Short-lived access tokens (7 days) with longer refresh tokens (365 days)

### 6. **Layered Architecture (MVC + Service Layer)**
- **Decision**: Separate concerns into Controllers → Services → Prisma (Data Access)
- **Rationale**:
  - **Controllers**: Handle HTTP requests/responses
  - **Services**: Contain business logic
  - **Prisma**: Database operations
- **Benefits**: Easier testing, reusability, and maintenance

### 7. **Centralized Error Handling**
- **Decision**: Use global error handler middleware with custom error classes
- **Rationale**: 
  - Consistent error responses
  - Easier debugging
  - Better error logging
- **Implementation**: `AppError` class, `globalErrorHandler` middleware, `catchAsync` utility

### 8. **Schema Validation with Zod**
- **Decision**: Use Zod for request validation instead of Express-validator or Joi
- **Rationale**:
  - TypeScript-first validation
  - Type inference from schemas
  - Better developer experience
- **Usage**: Validate request body, params, and query parameters

### 9. **Soft Delete Pattern**
- **Decision**: Implement soft deletes with `isDeleted` flag instead of hard deletes
- **Rationale**:
  - Data recovery capability
  - Audit trail maintenance
  - Better for analytics and reporting
- **Implementation**: Filter `isDeleted=false` in queries

### 10. **Security-First Approach**
- **Decisions**:
  - Rate limiting (1000 requests/minute per IP)
  - Helmet for security headers
  - CORS configuration
  - Password hashing with bcrypt
  - Input validation on all endpoints
- **Rationale**: Protect against common web vulnerabilities (DDoS, XSS, CSRF, SQL injection)

### 11. **Fraud Detection Mechanisms**
- **Decision**: Track `fraudScore` and `canceledOrdersCount` for users
- **Rationale**: 
  - Identify potentially fraudulent behavior
  - Prevent abuse of cancellation policies
  - Implement risk-based order processing
- **Future Enhancement**: Machine learning-based fraud detection

### 12. **Order Item Tracking**
- **Decision**: Separate `OrderItem` model from `Order`
- **Rationale**:
  - Maintain price history (price at time of order)
  - Support multiple products per order
  - Enable detailed order analytics
- **Implementation**: Store price and subtotal to preserve historical data

### 13. **Payment Abstraction**
- **Decision**: Separate `Payment` model with support for multiple payment methods
- **Rationale**:
  - Flexibility to add new payment providers
  - Track payment status independently
  - Support payment history

### 14. **Real-time Communication Ready**
- **Decision**: Include Socket.io for WebSocket support
- **Rationale**: 
  - Real-time order status updates
  - Live notifications
  - Admin dashboard updates
  - Future chat support
- **Status**: Infrastructure ready, implementation pending

### 15. **Multi-Cloud Storage Support**
- **Decision**: Support both Cloudinary and AWS S3
- **Rationale**:
  - Flexibility based on project requirements
  - Cost optimization options
  - Redundancy and failover capabilities
- **Use Cases**: Product images, user avatars, generated PDFs

### 16. **Serverless Deployment (Vercel)**
- **Decision**: Deploy on Vercel instead of traditional VPS/containers
- **Rationale**:
  - Zero configuration deployment
  - Automatic scaling
  - Global CDN
  - Cost-effective for variable traffic
- **Trade-offs**: Cold start latency, stateless execution

## 🤔 Assumptions Made

### Business Logic Assumptions

1. **User Roles**
   - Only three user roles exist: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`
   - Super Admin has full system access and can create other admins
   - Regular users (customers) can only manage their own data
   - Admins can manage products and view orders

2. **Order Workflow**
   - Order status follows a linear progression: Pending → Confirmed → Processing → Shipped → Delivered
   - Orders can only be canceled before they are shipped
   - Canceled orders increment the user's `canceledOrdersCount` for fraud tracking
   - Order numbers are unique and generated server-side

3. **Cart Behavior**
   - Each user can have only one instance of a product in their cart (enforced by unique constraint)
   - Updating quantity replaces the existing quantity (not incremental)
   - Cart persists across sessions until explicitly cleared
   - Cart items are not automatically removed when ordered (must be cleared manually)

4. **Payment Processing**
   - Each order has exactly one payment record
   - Payment status is independent of order status
   - Cash on Delivery is a valid payment method (payment occurs offline)
   - Failed payments do not auto-cancel orders (manual intervention required)

5. **Product Management**
   - Products are soft-deleted (`isDeleted` flag) rather than permanently removed
   - Product prices are stored as floats (not optimized for currency precision)
   - Stock can go negative (no enforcement of stock > 0 during order creation)
   - Products without categories are allowed

6. **User Verification**
   - Users must verify their email before full account access
   - OTP tokens expire after 10 minutes
   - Password reset requires email verification
   - Unverified users can still be created but have limited access

7. **Security**
   - Rate limiting is applied globally (1000 req/min per IP)
   - CORS is configured to allow all origins in development
   - JWT tokens are stored client-side (cookies or local storage)
   - Password requirements are enforced by frontend (backend only hashes)

### Technical Assumptions

8. **Database**
   - MongoDB is available and accessible
   - Database connection is stable (no automatic reconnection logic assumed)
   - ObjectId is used as primary key type
   - No database-level transactions assumed (single-document atomicity only)

9. **Environment**
   - All required environment variables are set before deployment
   - SSL/TLS is handled by deployment platform (Vercel)
   - Application runs in a single timezone (UTC assumed)
   - File uploads are limited by platform constraints

10. **Third-Party Services**
    - Email service (SMTP) is configured correctly

11. **Deployment**
    - Application is deployed on Vercel (serverless)
    - Cold starts are acceptable for API response time
    - No persistent local file storage needed
    - Auto-scaling is handled by platform

12. **Performance**
    - Database queries are optimized by Prisma
    - No query result caching implemented
    - No CDN for API responses
    - Pagination is handled client-side specification

13. **Data Validation**
    - Frontend performs basic validation
    - Backend performs comprehensive validation with Zod
    - Invalid data is rejected with appropriate error messages
    - No automatic data sanitization (assumed handled by Zod)

14. **Error Handling**
    - All errors are caught and passed to global error handler
    - 500 errors indicate server issues (not exposed to clients in production)
    - 400-level errors indicate client issues
    - Errors are logged for debugging

15. **Internationalization**
    - Application is English-only
    - Currency is assumed to be consistent (no multi-currency support)
    - Dates are stored in UTC
    - No locale-specific formatting

## 🚀 Deployment

### Vercel Deployment

This project is configured for Vercel deployment:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

4. **Configure environment variables** in Vercel dashboard

### Environment Setup on Vercel

Add all environment variables from `.env` file to your Vercel project settings:
- Go to Project Settings → Environment Variables
- Add each variable from the Environment Variables section above

### Post-Deployment

After deployment:
1. Run Prisma push to production database
2. Verify all environment variables are set
3. Test critical endpoints (auth, payments)
4. Set up monitoring and logging

## 📄 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js, Express, TypeScript, and MongoDB**
