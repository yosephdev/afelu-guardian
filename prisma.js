// prisma.js
// Prisma client for Afelu Guardian main database schema
// Used for database operations throughout the backend

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;