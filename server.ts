import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fixmate-super-secret-key-2024';

async function startServer() {
  try {
    console.log('Starting FixMate Server...');
    const db = new Database('fixmate.db');
    db.pragma('foreign_keys = ON');

    // Initialize Database
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        last_fee_payment_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS technicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        skills TEXT,
        experience INTEGER,
        district TEXT,
        id_number TEXT,
        id_proof_url TEXT,
        is_verified INTEGER DEFAULT 0,
        base_charge INTEGER,
        rating REAL DEFAULT 5.0,
        bio TEXT,
        subscription_expiry DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_number TEXT UNIQUE,
        customer_id INTEGER,
        technician_id INTEGER,
        service_type TEXT,
        status TEXT DEFAULT 'pending',
        negotiated_price INTEGER,
        platform_fee REAL,
        insurance_applied INTEGER DEFAULT 1,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (technician_id) REFERENCES technicians(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        sender_id INTEGER,
        content TEXT,
        attachment_url TEXT,
        attachment_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      );
    `);

    // Seed Admin
    const adminEmail = 'anandamritraj5431@gmail.com';
    const adminPassword = 'AnA@mrit8567';
    const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        'Admin Anand', 
        adminEmail, 
        hashedPassword, 
        'admin',
        '9142262449',
        'IT Hub Patna',
        'Patna'
      );
    } else {
      db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail);
    }

    // Migrations
    const migrations = [
      'ALTER TABLE bookings ADD COLUMN payment_method TEXT',
      "ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'",
      'ALTER TABLE users ADD COLUMN district TEXT',
      'ALTER TABLE technicians ADD COLUMN id_number TEXT',
      'ALTER TABLE messages ADD COLUMN attachment_url TEXT',
      'ALTER TABLE messages ADD COLUMN attachment_type TEXT',
      'ALTER TABLE bookings ADD COLUMN booking_number TEXT'
    ];

    migrations.forEach(m => {
      try {
        db.prepare(m).run();
      } catch (e) {}
    });

    // Seeding logic
    const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
    const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
    const standardServices = ['Maid', 'Car Wash', 'Haircut'];
    const techNames = ['Rohit Kumar', 'Rahul Singh', 'Aman Verma', 'Sumit Yadav', 'Vikram Gupta', 'Manoj Tiwari', 'Sunil Sharma', 'Pankaj Mishra', 'Rajesh Ranjan', 'Anil Paswan', 'Kavita Devi', 'Pooja Kumari', 'Sita Devi', 'Deepak Kumar', 'Suresh Singh'];

    districts.forEach(district => {
      const count = db.prepare('SELECT COUNT(*) as count FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.district = ?').get(district).count;
      if (count < 2) {
        coreServices.forEach((service, idx) => {
          const email = `${district.toLowerCase().replace(' ', '')}_${service.toLowerCase().replace(' ', '')}_${idx}@fixmate.com`;
          if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return;
          const name = techNames[Math.floor(Math.random() * techNames.length)];
          const hashedPassword = bcrypt.hashSync('tech123', 10);
          const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            name, email, hashedPassword, 'technician', `98765${Math.floor(10000 + Math.random() * 90000)}`, district, district
          );
          const charge = service === 'AC Repair' ? 1000 + Math.floor(Math.random() * 500) : 500 + Math.floor(Math.random() * 1000);
          db.prepare('INSERT INTO technicians (user_id, skills, experience, district, is_verified, base_charge, bio) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            userResult.lastInsertRowid, service, Math.floor(Math.random() * 10) + 1, district, 1, charge, `Expert ${service} serving ${district}.`
          );
        });
      }
    });

    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Helper functions
    const calculatePlatformFee = (price: number) => {
      let platformFeePercent = 0;
      if (price < 250) platformFeePercent = 2.5;
      else if (price >= 250 && price <= 450) platformFeePercent = 3.0;
      else if (price > 450 && price <= 700) platformFeePercent = 5.0;
      else if (price > 700 && price <= 1000) platformFeePercent = 8.0;
      else if (price > 1000 && price <= 1500) platformFeePercent = 10.0;
      else platformFeePercent = 12.0;
      return (price * platformFeePercent) / 100;
    };

    const getPriceRange = (serviceType: string) => {
      const core = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
      const standard = ['Maid', 'Car Wash', 'Haircut'];
      if (core.includes(serviceType)) return { min: 500, max: 1500 };
      if (standard.includes(serviceType)) return { min: 100, max: 250 };
      return { min: 100, max: 2000 };
    };

    const generateBookingNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'BK-';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const getUniqueBookingNumber = () => {
      let num = '';
      let exists = true;
      while (exists) {
        num = generateBookingNumber();
        const check = db.prepare('SELECT id FROM bookings WHERE booking_number = ?').get(num);
        if (!check) exists = false;
      }
      return num;
    };

    // Auth Middleware
    const authenticate = (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
      } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };

    // Routes
    app.post('/api/auth/signup', (req, res) => {
      const { name, email, password, role, phone, location, district } = req.body;
      try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          name, email, hashedPassword, role, phone, location, district
        );
        if (role === 'technician') {
          const { skills, experience, id_number } = req.body;
          db.prepare('INSERT INTO technicians (user_id, skills, experience, district, id_number) VALUES (?, ?, ?, ?, ?)').run(
            result.lastInsertRowid, skills, experience, district, id_number
          );
        }
        const token = jwt.sign({ id: Number(result.lastInsertRowid), role, email }, JWT_SECRET);
        res.json({ token, user: { id: Number(result.lastInsertRowid), name, email, role, district } });
      } catch (err) {
        res.status(400).json({ error: 'Email already exists' });
      }
    });

    app.post('/api/auth/login', (req, res) => {
      try {
        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
          console.log(`User not found: ${email}`);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log(`Invalid password for user: ${email}`);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log(`Login successful for user: ${email}`);
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, district: user.district } });
      } catch (err: any) {
        console.error('Login API Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/technicians', (req, res) => {
      const { district, service } = req.query;
      let query = 'SELECT t.*, u.name, u.phone FROM technicians t JOIN users u ON t.user_id = u.id WHERE t.is_verified = 1';
      const params: any[] = [];
      if (district) { query += ' AND t.district = ?'; params.push(district); }
      if (service) { query += ' AND t.skills LIKE ?'; params.push(`%${service}%`); }
      res.json(db.prepare(query).all(...params));
    });

    app.post('/api/bookings', authenticate, (req: any, res) => {
      const { technician_id, service_type } = req.body;
      const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(technician_id);
      if (!tech) return res.status(404).json({ error: 'Tech not found' });
      const platformFee = calculatePlatformFee(tech.base_charge);
      const bookingNumber = getUniqueBookingNumber();
      const result = db.prepare('INSERT INTO bookings (booking_number, customer_id, technician_id, service_type, status, negotiated_price, platform_fee) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        bookingNumber, req.user.id, technician_id, service_type || 'General', 'negotiating', tech.base_charge, platformFee
      );
      res.json({ booking_id: Number(result.lastInsertRowid), booking_number: bookingNumber });
    });

    app.get('/api/bookings', authenticate, (req: any, res) => {
      let query = 'SELECT b.*, u.name as customer_name, tu.name as technician_name FROM bookings b JOIN users u ON b.customer_id = u.id JOIN technicians t ON b.technician_id = t.id JOIN users tu ON t.user_id = tu.id';
      if (req.user.role === 'technician') query += ' WHERE t.user_id = ?';
      else if (req.user.role === 'customer') query += ' WHERE b.customer_id = ?';
      res.json(db.prepare(query).all(req.user.role === 'admin' ? [] : [req.user.id]));
    });

    app.get('/api/bookings/:id', authenticate, (req: any, res) => {
      const booking = db.prepare('SELECT b.*, u.name as customer_name, tu.name as technician_name, t.user_id as tech_user_id FROM bookings b JOIN users u ON b.customer_id = u.id JOIN technicians t ON b.technician_id = t.id JOIN users tu ON t.user_id = tu.id WHERE b.id = ?').get(req.params.id);
      res.json(booking);
    });

    app.post('/api/bookings/:id/negotiate', authenticate, (req, res) => {
      const { price, confirm } = req.body;
      const platformFee = calculatePlatformFee(price);
      db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = ? WHERE id = ?').run(price, platformFee, confirm ? 'confirmed' : 'negotiating', req.params.id);
      res.json({ success: true });
    });

    app.get('/api/bookings/:id/messages', authenticate, (req, res) => {
      res.json(db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.booking_id = ? ORDER BY m.created_at ASC').all(req.params.id));
    });

    app.post('/api/bookings/:id/messages', authenticate, (req: any, res) => {
      const { content, attachment_url, attachment_type } = req.body;
      db.prepare('INSERT INTO messages (booking_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)').run(req.params.id, req.user.id, content, attachment_url, attachment_type);
      res.json({ success: true });
    });

    app.post('/api/bookings/:id/messages/auto', authenticate, (req, res) => {
      const { content, proposedPrice } = req.body;
      const booking = db.prepare('SELECT t.user_id FROM bookings b JOIN technicians t ON b.technician_id = t.id WHERE b.id = ?').get(req.params.id);
      if (booking) {
        db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(req.params.id, booking.user_id, content);
        const platformFee = calculatePlatformFee(proposedPrice);
        db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ? WHERE id = ?').run(proposedPrice, platformFee, req.params.id);
      }
      res.json({ success: true });
    });

    app.get('/api/admin/stats', authenticate, (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
      const revenue = db.prepare("SELECT SUM(platform_fee) as total FROM bookings WHERE status = 'confirmed'").get().total || 0;
      res.json({ userCount, bookingCount, revenue, pendingTechs: 0 });
    });

    // Vite middleware
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting Vite in middleware mode...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware ready.');
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`FixMate Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('CRITICAL: Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
