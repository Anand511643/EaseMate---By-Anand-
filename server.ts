import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('fixmate.db');
const JWT_SECRET = process.env.JWT_SECRET || 'fixmate-super-secret-key-2024';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer', -- 'customer', 'technician', 'admin'
    phone TEXT,
    location TEXT,
    last_fee_payment_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    skills TEXT,
    experience INTEGER,
    district TEXT,
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
    customer_id INTEGER,
    technician_id INTEGER,
    service_type TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'negotiating', 'confirmed', 'completed', 'cancelled'
    negotiated_price INTEGER,
    platform_fee REAL,
    insurance_applied INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES technicians(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    sender_id INTEGER,
    content TEXT,
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
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin Anand', adminEmail, hashedPassword, 'admin');
}

// Seed Districts & Technicians
const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
const services = ['Electrician', 'Plumber', 'Carpenter', 'AC Repair', 'Painter'];

districts.forEach(district => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.district = ?').get(district).count;
  if (count < 2) {
    for (let i = 1; i <= 2; i++) {
      const email = `${district.toLowerCase().replace(' ', '')}${i}@fixmate.com`;
      const hashedPassword = bcrypt.hashSync('tech123', 10);
      const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)').run(
        `${district} Tech ${i}`,
        email,
        hashedPassword,
        'technician',
        `987654321${i}`,
        district
      );
      db.prepare('INSERT INTO technicians (user_id, skills, experience, district, is_verified, base_charge, bio) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userResult.lastInsertRowid,
        services[Math.floor(Math.random() * services.length)],
        Math.floor(Math.random() * 10) + 1,
        district,
        1,
        300 + Math.floor(Math.random() * 500),
        `Expert technician serving ${district} with over 5 years of experience.`
      );
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, phone, location } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, hashedPassword, role, phone, location);
      
      if (role === 'technician') {
        const { skills, experience, district } = req.body;
        db.prepare('INSERT INTO technicians (user_id, skills, experience, district) VALUES (?, ?, ?, ?)').run(result.lastInsertRowid, skills, experience, district);
      }

      const token = jwt.sign({ id: result.lastInsertRowid, role, email }, JWT_SECRET);
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role } });
    } catch (err: any) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Technicians
  app.get('/api/technicians', (req, res) => {
    const { district, service } = req.query;
    let query = 'SELECT users.name, users.phone, technicians.* FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.is_verified = 1';
    const params: any[] = [];

    if (district) {
      query += ' AND technicians.district = ?';
      params.push(district);
    }
    if (service) {
      query += ' AND technicians.skills LIKE ?';
      params.push(`%${service}%`);
    }

    const techs = db.prepare(query).all(...params);
    res.json(techs);
  });

  // Bookings & Bargaining
  app.post('/api/bookings', authenticate, (req: any, res) => {
    const { technician_id, service_type } = req.body;
    const customer_id = req.user.id;

    const result = db.prepare('INSERT INTO bookings (customer_id, technician_id, service_type, status) VALUES (?, ?, ?, ?)').run(customer_id, technician_id, service_type, 'negotiating');
    res.json({ booking_id: result.lastInsertRowid });
  });

  app.get('/api/bookings/:id', authenticate, (req, res) => {
    const booking = db.prepare(`
      SELECT b.*, u.name as customer_name, t_u.name as technician_name, t.district
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN technicians t ON b.technician_id = t.id
      JOIN users t_u ON t.user_id = t_u.id
      WHERE b.id = ?
    `).get(req.params.id);
    res.json(booking);
  });

  app.post('/api/bookings/:id/negotiate', authenticate, (req: any, res) => {
    const { price } = req.body;
    const bookingId = req.params.id;
    
    // Calculate Platform Fee (Dynamic)
    let platformFeePercent = 0;
    const p = parseInt(price);
    
    if (p >= 250 && p <= 450) {
      if (p === 280) platformFeePercent = 2.73;
      else if (p >= 290 && p <= 299) platformFeePercent = 2.93;
      else platformFeePercent = 3.0;
    } else if (p > 450 && p <= 700) {
      platformFeePercent = 5.0;
    } else if (p > 700 && p <= 1000) {
      platformFeePercent = 8.0;
    } else if (p > 1000 && p <= 1500) {
      platformFeePercent = 10.0;
    } else {
      platformFeePercent = 12.0; // Default for high end
    }

    const platformFee = (p * platformFeePercent) / 100;

    db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = "confirmed" WHERE id = ?').run(price, platformFee, bookingId);
    res.json({ success: true, platformFee });
  });

  // Messages
  app.get('/api/bookings/:id/messages', authenticate, (req, res) => {
    const messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.booking_id = ? ORDER BY m.created_at ASC').all(req.params.id);
    res.json(messages);
  });

  app.post('/api/bookings/:id/messages', authenticate, (req: any, res) => {
    const { content } = req.body;
    const sender_id = req.user.id;
    db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(req.params.id, sender_id, content);
    res.json({ success: true });
  });

  // Admin
  app.get('/api/admin/stats', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const revenue = db.prepare('SELECT SUM(platform_fee) as total FROM bookings WHERE status = "confirmed"').get().total || 0;
    const pendingTechs = db.prepare('SELECT COUNT(*) as count FROM technicians WHERE is_verified = 0').get().count;

    res.json({ userCount, bookingCount, revenue, pendingTechs });
  });

  app.get('/api/admin/technicians', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const techs = db.prepare('SELECT u.name, u.email, t.* FROM users u JOIN technicians t ON u.id = t.user_id').all();
    res.json(techs);
  });

  app.post('/api/admin/technicians/:id/verify', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('UPDATE technicians SET is_verified = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixMate Server running on http://localhost:${PORT}`);
  });
}

startServer();
