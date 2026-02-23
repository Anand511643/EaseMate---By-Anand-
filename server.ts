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
    attachment_url TEXT,
    attachment_type TEXT, -- 'image', 'document'
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

const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
const standardServices = ['Maid', 'Car Wash', 'Haircut'];

const techNames = ['Rohit Kumar', 'Rahul Singh', 'Aman Verma', 'Sumit Yadav', 'Vikram Gupta', 'Manoj Tiwari', 'Sunil Sharma', 'Pankaj Mishra', 'Rajesh Ranjan', 'Anil Paswan', 'Kavita Devi', 'Pooja Kumari', 'Sita Devi', 'Deepak Kumar', 'Suresh Singh'];

districts.forEach(district => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.district = ?').get(district).count;
  if (count < 2) {
    // Seed Core Technicians
    coreServices.forEach((service, idx) => {
      const name = techNames[Math.floor(Math.random() * techNames.length)];
      const email = `${district.toLowerCase().replace(' ', '')}_${service.toLowerCase().replace(' ', '')}_${idx}@fixmate.com`;
      const hashedPassword = bcrypt.hashSync('tech123', 10);
      
      const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)').run(
        name,
        email,
        hashedPassword,
        'technician',
        `98765${Math.floor(10000 + Math.random() * 90000)}`,
        district
      );
      
      let charge = 0;
      if (service === 'AC Repair') {
        charge = 1000 + Math.floor(Math.random() * 500); // ₹1000 - ₹1500
      } else {
        charge = 500 + Math.floor(Math.random() * 1000); // ₹500 - ₹1500
      }

      db.prepare('INSERT INTO technicians (user_id, skills, experience, district, is_verified, base_charge, bio) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userResult.lastInsertRowid,
        service,
        Math.floor(Math.random() * 10) + 1,
        district,
        1,
        charge,
        `Expert ${service} serving ${district}.`
      );
    });

    // Seed Standard Technicians
    standardServices.forEach((service, idx) => {
      const name = techNames[Math.floor(Math.random() * techNames.length)];
      const email = `${district.toLowerCase().replace(' ', '')}_std_${service.toLowerCase().replace(' ', '')}_${idx}@fixmate.com`;
      const hashedPassword = bcrypt.hashSync('tech123', 10);
      
      const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)').run(
        name,
        email,
        hashedPassword,
        'technician',
        `88765${Math.floor(10000 + Math.random() * 90000)}`,
        district
      );
      
      let charge = 0;
      if (service === 'Maid') charge = 500 + Math.floor(Math.random() * 300); // ₹500 - ₹800
      else charge = 100 + Math.floor(Math.random() * 150); // ₹100 - ₹250

      db.prepare('INSERT INTO technicians (user_id, skills, experience, district, is_verified, base_charge, bio) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userResult.lastInsertRowid,
        service,
        Math.floor(Math.random() * 5) + 1,
        district,
        1,
        charge,
        `Reliable ${service} service in ${district}.`
      );
    });
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure messages table has attachment columns (migration)
  try {
    db.prepare('ALTER TABLE messages ADD COLUMN attachment_url TEXT').run();
    db.prepare('ALTER TABLE messages ADD COLUMN attachment_type TEXT').run();
  } catch (e) {
    // Columns probably already exist
  }

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const { price, confirm } = req.body;
    const bookingId = req.params.id;
    
    // Calculate Platform Fee (Dynamic)
    let platformFeePercent = 0;
    const p = parseInt(price);
    
    if (p < 250) {
      platformFeePercent = 2.5;
    } else if (p >= 250 && p <= 450) {
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
      platformFeePercent = 12.0;
    }

    const platformFee = (p * platformFeePercent) / 100;
    const status = confirm ? 'confirmed' : 'negotiating';

    db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = ? WHERE id = ?').run(price, platformFee, status, bookingId);
    res.json({ success: true, platformFee, status });
  });

  // Messages
  app.get('/api/bookings/:id/messages', authenticate, (req, res) => {
    const messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.booking_id = ? ORDER BY m.created_at ASC').all(req.params.id);
    res.json(messages);
  });

  app.post('/api/bookings/:id/messages', authenticate, (req: any, res) => {
    const { content, attachment_url, attachment_type } = req.body;
    const sender_id = req.user.id;
    db.prepare('INSERT INTO messages (booking_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)').run(req.params.id, sender_id, content, attachment_url, attachment_type);
    res.json({ success: true });
  });

  app.post('/api/bookings/:id/messages/auto', authenticate, (req: any, res) => {
    const { content, proposedPrice } = req.body;
    const bookingId = req.params.id;
    
    // Get technician user ID for this booking
    const booking = db.prepare('SELECT technicians.user_id FROM bookings JOIN technicians ON bookings.technician_id = technicians.id WHERE bookings.id = ?').get(bookingId);
    
    if (booking) {
      // Insert message as technician
      db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(bookingId, booking.user_id, content);
      
      // Update proposed price
      db.prepare('UPDATE bookings SET negotiated_price = ? WHERE id = ?').run(proposedPrice, bookingId);
    }
    
    res.json({ success: true });
  });

  app.post('/api/bookings/:id/messages/counter-reply', authenticate, (req: any, res) => {
    const { counterPrice } = req.body;
    const bookingId = req.params.id;
    
    const booking = db.prepare(`
      SELECT b.*, t.user_id as tech_user_id, t.district, t.skills
      FROM bookings b
      JOIN technicians t ON b.technician_id = t.id
      WHERE b.id = ?
    `).get(bookingId);
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const currentPrice = booking.negotiated_price;
    let reply = '';
    let finalPrice = currentPrice;
    let status = 'negotiating';

    // Simple logic: If counter is within 15% of current price, or if it's the second counter, maybe agree.
    const diff = currentPrice - counterPrice;
    const percentDiff = (diff / currentPrice) * 100;

    if (percentDiff <= 15) {
      reply = `Alright, I agree to ₹${counterPrice}. It's a fair price for the work. You can proceed to confirm the booking now.`;
      finalPrice = counterPrice;
      // We don't set status to confirmed yet, customer must click "Accept"
    } else {
      const middleGround = Math.floor((currentPrice + counterPrice) / 2);
      reply = `₹${counterPrice} is a bit low considering the effort and travel to ${booking.district}. How about we settle at ₹${middleGround}? This is my best offer.`;
      finalPrice = middleGround;
    }

    // Insert message as technician
    db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(bookingId, booking.tech_user_id, reply);
    
    // Update booking with the new "proposed" price from technician
    db.prepare('UPDATE bookings SET negotiated_price = ? WHERE id = ?').run(finalPrice, bookingId);
    
    res.json({ success: true, proposedPrice: finalPrice });
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
