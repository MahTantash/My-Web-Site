# Business Website Backend (Node.js + Express + PostgreSQL + Prisma)

## Overview
Production-ready backend for a business website with dynamic admin panel, secure authentication, robust image uploads, and PostgreSQL data storage.

## Features
- Node.js + Express API
- PostgreSQL with Prisma ORM
- Secure session management (PostgreSQL-backed)
- Bcrypt password hashing
- Input validation (express-validator)
- Robust image upload handling
- Logging (winston)
- Docker & docker-compose for local/prod parity
- `.env.example` for configuration

## Local Development

1. **Clone the repo and install dependencies:**
   ```sh
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your values.

3. **Start PostgreSQL and backend using Docker Compose:**
   ```sh
   docker-compose up --build
   ```
   This will start both the database and backend server.

4. **Run Prisma migrations:**
   ```sh
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Import existing data:**
   - Use the provided migration script to import from `db.json` (see `scripts/migrate-lowdb-to-postgres.js`).

6. **Access the site:**
   - Backend: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

## Deployment

- Set `DATABASE_URL` and `SESSION_SECRET` in your production environment.
- Use Docker or deploy to Heroku, DigitalOcean, etc.
- For Heroku: add a PostgreSQL add-on, set env vars, and deploy.

## Security & Best Practices
- Change default admin password after first login.
- Use HTTPS in production.
- Monitor logs and errors (see `logs/`).

## Migration Script
- See `scripts/migrate-lowdb-to-postgres.js` for data migration from lowdb/JSON to PostgreSQL.

## Questions?
- See code comments and this README for guidance.
