require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const { Pool } = require('pg');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const prisma = new PrismaClient();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Session store
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(session({
  store: new pgSession({ pool: pgPool }),
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Helper: get current content
async function getCurrentContent() {
  const content = await prisma.content.findFirst({ orderBy: { updatedAt: 'desc' } });
  const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  const portfolio = await prisma.portfolioProject.findMany({
    orderBy: { order: 'asc' },
    include: { images: true }
  });
  return {
    homepage: content?.homepage || {},
    about: content?.about || {},
    contact: content?.contact || {},
    services,
    portfolio
  };
}

// Auth routes
app.post('/api/admin/login',
  body('username').isString(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.admin = { id: user.id, username: user.username };
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  }
);

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Content routes
app.get('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const content = await getCurrentContent();
    res.json(content);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

app.post('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const { homepage, about, contact, services, portfolio } = req.body;
    // Update content
    const content = await prisma.content.create({
      data: {
        homepage: homepage || {},
        about: about || {},
        contact: contact || {}
      }
    });
    // Update services
    if (Array.isArray(services)) {
      await prisma.service.deleteMany();
      for (const [i, svc] of services.entries()) {
        await prisma.service.create({
          data: {
            title: svc.title || '',
            description: svc.description || '',
            order: i
          }
        });
      }
    }
    // Update portfolio
    if (Array.isArray(portfolio)) {
      await prisma.image.deleteMany();
      await prisma.portfolioProject.deleteMany();
      for (const [i, proj] of portfolio.entries()) {
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
                url: img.url || img,
                projectId: project.id
              }
            });
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Contact requests
app.get('/api/admin/contacts', requireAdmin, async (req, res) => {
  try {
    const contacts = await prisma.contactRequest.findMany({ orderBy: { date: 'desc' } });
    res.json(contacts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to fetch contact requests' });
  }
});

app.post('/api/contact',
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('message').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, phone, service, message } = req.body;
      await prisma.contactRequest.create({
        data: { name, email, phone, service, message }
      });
      res.json({ success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Failed to submit contact request' });
    }
  }
);

// Image upload
app.post('/api/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ path: `/uploads/${req.file.filename}` });
});

app.use((err, req, res, next) => {
  logger.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  try {
    await prisma.$connect();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Failed to connect to DB:', err);
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  }
}

startServer();
