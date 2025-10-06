// Migration script: Import data from db.json (lowdb) to PostgreSQL via Prisma
// Usage: node scripts/migrate-lowdb-to-postgres.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const dbJsonPath = path.join(__dirname, '..', 'db.json');

async function main() {
  if (!fs.existsSync(dbJsonPath)) {
    console.error('db.json not found!');
    process.exit(1);
  }
  const raw = fs.readFileSync(dbJsonPath, 'utf-8');
  const data = JSON.parse(raw);

  // Admin user
  if (data.adminUser) {
    await prisma.adminUser.upsert({
      where: { username: data.adminUser.username },
      update: {},
      create: {
        username: data.adminUser.username,
        password: data.adminUser.password // You should hash this after migration!
      }
    });
  }

  // Content
  if (data.content) {
    await prisma.content.create({
      data: {
        homepage: data.content.homepage || {},
        about: data.content.about || {},
        contact: data.content.contact || {}
      }
    });
    // Services
    if (Array.isArray(data.content.services)) {
      for (const [i, svc] of data.content.services.entries()) {
        await prisma.service.create({
          data: {
            title: svc.title || '',
            description: svc.description || '',
            order: i
          }
        });
      }
    }
    // Portfolio
    if (Array.isArray(data.content.portfolio)) {
      for (const [i, proj] of data.content.portfolio.entries()) {
        const project = await prisma.portfolioProject.create({
          data: {
            title: proj.title || '',
            description: proj.description || '',
            order: i
          }
        });
        if (Array.isArray(proj.images)) {
          for (const img of proj.images) {
            await prisma.image.create({
              data: {
                url: img,
                projectId: project.id
              }
            });
          }
        }
      }
    }
  }

  // Contact requests
  if (Array.isArray(data.contactRequests)) {
    for (const req of data.contactRequests) {
      await prisma.contactRequest.create({
        data: {
          name: req.name || '',
          email: req.email || '',
          phone: req.phone || '',
          service: req.service || '',
          message: req.message || '',
          date: req.date ? new Date(req.date) : new Date()
        }
      });
    }
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
