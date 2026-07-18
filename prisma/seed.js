import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import bcrypt from 'bcrypt'
import { use } from "react";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const builtInAttributes = [
  {
    name: "First name",
    category: "PERSONAL_INFORMATION",
    description: "first name of user",
    dataType: "STRING",
  },
  {
    name: "Last name",
    category: "PERSONAL_INFORMATION",
    description: "last name of user",
    dataType: "STRING",
  },{
    name: "Location",
    category: "PERSONAL_INFORMATION",
    description: "location of user",
    dataType: "STRING",
  },{
    name: "Personal photo",
    category: "PERSONAL_INFORMATION",
    description: "personal photo of user",
    dataType: "IMAGE",
  }
]
const passwordHash = await bcrypt.hash("123456", 10)
const users = [
  {
    email: "candidate@test.com",
    password: passwordHash,
    role: "CANDIDATE",
  },
  {
    email: "recruiter@test.com",
    password: passwordHash,
    role: "RECRUITER",
  }
]
async function main() {
  for (const attribute of builtInAttributes) {
    const result = await prisma.attribute.upsert({
      where: { name: attribute.name},
      update: {
        category: attribute.category,
        description: attribute.description,
        dataType: attribute.dataType
      },
      create: {
        name: attribute.name,
        category: attribute.category,
        description: attribute.description,
        dataType: attribute.dataType,
        isBuiltIn: true
      }
    });
    console.log({result});
  } 
  for (const user of users) {
    const result = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: user.password,
        role: user.role
      },
      create: {
        email: user.email,
        password: user.password,
        role: user.role
      }
    });
    console.log(result)
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });