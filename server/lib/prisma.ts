// Creates and exports the Prisma database client.
// Module: database client.
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Use database connection string from environment variables.
const connectionString = `${process.env.DATABASE_URL}`

// Create a Postgres adapter and Prisma client instance.
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma
