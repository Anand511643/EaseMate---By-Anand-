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
db.pragma('foreign_keys = ON');
const JWT_SECRET = process.env.JWT_SECRET || 'fixmate-super-secret-key-2024';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer', -- 'customer', 'technician', 'admin'
    phone TEXT NOT NULL,
    location TEXT NOT NULL, -- Permanent Address
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
    id_number TEXT, -- Aadhar or other ID
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
    payment_method TEXT, -- 'online', 'cod'
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid'
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
  db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    'Admin Anand', 
    adminEmail, 
    hashedPassword, 
    'admin',
    '9142262449',
    'IT Hub Patna',
    'Patna'
  );
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
      
      const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        name,
        email,
        hashedPassword,
        'technician',
        `98765${Math.floor(10000 + Math.random() * 90000)}`,
        district,
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
      
      const userResult = db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        name,
        email,
        hashedPassword,
        'technician',
        `88765${Math.floor(10000 + Math.random() * 90000)}`,
        district,
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

const getPriceRange = (serviceType: string) => {
  const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
  const standardServices = ['Maid', 'Car Wash', 'Haircut'];
  
  if (coreServices.includes(serviceType)) return { min: 500, max: 1500 };
  if (standardServices.includes(serviceType)) return { min: 100, max: 250 };
  return { min: 100, max: 2000 };
};

const calculatePlatformFee = (price: number) => {
  let platformFeePercent = 0;
  if (price < 250) {
    platformFeePercent = 2.5; // Default for low prices
  } else if (price >= 250 && price <= 450) {
    if (price === 280) platformFeePercent = 2.73;
    else if (price >= 290 && price <= 299) platformFeePercent = 2.93;
    else platformFeePercent = 3.0;
  } else if (price > 450 && price <= 700) {
    platformFeePercent = 5.0;
  } else if (price > 700 && price <= 1000) {
    platformFeePercent = 8.0;
  } else if (price > 1000 && price <= 1500) {
    platformFeePercent = 10.0;
  } else {
    platformFeePercent = 12.0;
  }
  return (price * platformFeePercent) / 100;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure bookings table has payment columns
  const migrations = [
    'ALTER TABLE bookings ADD COLUMN payment_method TEXT',
    'ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT "pending"',
    'ALTER TABLE users ADD COLUMN district TEXT',
    'ALTER TABLE technicians ADD COLUMN id_number TEXT',
    'ALTER TABLE messages ADD COLUMN attachment_url TEXT',
    'ALTER TABLE messages ADD COLUMN attachment_type TEXT'
  ];

  migrations.forEach(m => {
    try {
      db.prepare(m).run();
    } catch (e) {
      // Column likely exists
    }
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User session expired. Please login again.' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Auth Error:', err);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, phone, location, district } = req.body;
    try {
      if (!phone || !location || !district) {
        return res.status(400).json({ error: 'Mobile number, address, and district are mandatory' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        name, email, hashedPassword, role, phone, location, district
      );
      
      if (role === 'technician') {
        const { skills, experience, id_number } = req.body;
        if (!id_number) {
          return res.status(400).json({ error: 'ID number (Aadhar) is mandatory for technicians' });
        }
        db.prepare('INSERT INTO technicians (user_id, skills, experience, district, id_number) VALUES (?, ?, ?, ?, ?)').run(
          result.lastInsertRowid, skills, experience, district, id_number
        );
      }

      const userId = Number(result.lastInsertRowid);
      const token = jwt.sign({ id: userId, role, email }, JWT_SECRET);
      res.json({ token, user: { id: userId, name, email, role, district } });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: 'Email already exists or invalid data' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, district: user.district } });
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Technicians
  app.get('/api/technicians', (req, res) => {
    try {
      const { district, service } = req.query;
      let query = `
        SELECT 
          t.id, 
          t.user_id, 
          u.name, 
          u.phone, 
          t.skills, 
          t.experience, 
          t.district, 
          t.base_charge, 
          t.bio, 
          t.rating
        FROM technicians t
        JOIN users u ON t.user_id = u.id 
        WHERE t.is_verified = 1
      `;
      const params: any[] = [];

      if (district) {
        query += ' AND t.district = ?';
        params.push(district);
      }
      if (service) {
        query += ' AND t.skills LIKE ?';
        params.push(`%${service}%`);
      }

      const techs = db.prepare(query).all(...params);
      res.json(techs);
    } catch (err) {
      console.error('Fetch Technicians Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Bookings & Bargaining
  app.post('/api/bookings', authenticate, (req: any, res) => {
    const { technician_id, service_type } = req.body;
    const customer_id = req.user.id;

    try {
      if (!technician_id) {
        return res.status(400).json({ error: 'Technician ID is required' });
      }

      const tech = db.prepare('SELECT id, user_id, base_charge FROM technicians WHERE id = ?').get(technician_id);
      if (!tech) {
        return res.status(404).json({ error: 'Technician not found' });
      }

      if (tech.user_id === customer_id) {
        return res.status(400).json({ error: 'You cannot book yourself' });
      }

      const platformFee = calculatePlatformFee(tech.base_charge);
      const result = db.prepare('INSERT INTO bookings (customer_id, technician_id, service_type, status, negotiated_price, platform_fee) VALUES (?, ?, ?, ?, ?, ?)').run(
        customer_id, 
        technician_id, 
        service_type || 'General', 
        'negotiating',
        tech.base_charge,
        platformFee
      );

      const bookingId = Number(result.lastInsertRowid);
      
      // Initial message from technician in Hinglish
      const initialMessage = "Hello! Mei aapki kya madad kar sakta hoon?";
      db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(bookingId, tech.user_id, initialMessage);
      
      res.json({ booking_id: bookingId });
    } catch (err: any) {
      console.error('Booking Error:', err);
      res.status(500).json({ error: 'Failed to create booking. Please try again.' });
    }
  });

  app.get('/api/bookings', authenticate, (req: any, res) => {
    try {
      let bookings;
      if (req.user.role === 'admin') {
        bookings = db.prepare(`
          SELECT b.*, u.name as customer_name, t_u.name as technician_name, t.district
          FROM bookings b
          JOIN users u ON b.customer_id = u.id
          JOIN technicians t ON b.technician_id = t.id
          JOIN users t_u ON t.user_id = t_u.id
          ORDER BY b.created_at DESC
        `).all();
      } else if (req.user.role === 'technician') {
        bookings = db.prepare(`
          SELECT b.*, u.name as customer_name, t_u.name as technician_name, t.district
          FROM bookings b
          JOIN users u ON b.customer_id = u.id
          JOIN technicians t ON b.technician_id = t.id
          JOIN users t_u ON t.user_id = t_u.id
          WHERE t.user_id = ?
          ORDER BY b.created_at DESC
        `).all(req.user.id);
      } else {
        bookings = db.prepare(`
          SELECT b.*, u.name as customer_name, t_u.name as technician_name, t.district
          FROM bookings b
          JOIN users u ON b.customer_id = u.id
          JOIN technicians t ON b.technician_id = t.id
          JOIN users t_u ON t.user_id = t_u.id
          WHERE b.customer_id = ?
          ORDER BY b.created_at DESC
        `).all(req.user.id);
      }
      res.json(bookings);
    } catch (err) {
      console.error('Fetch Bookings Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/bookings/:id', authenticate, (req: any, res) => {
    try {
      const booking = db.prepare(`
        SELECT 
          b.*, 
          u.name as customer_name, 
          t_u.name as technician_name, 
          t.district,
          t.user_id as tech_user_id
        FROM bookings b
        JOIN users u ON b.customer_id = u.id
        JOIN technicians t ON b.technician_id = t.id
        JOIN users t_u ON t.user_id = t_u.id
        WHERE b.id = ?
      `).get(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Security check: only customer or technician can view
      if (booking.customer_id !== req.user.id && booking.tech_user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(booking);
    } catch (err) {
      console.error('Fetch Booking Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/bookings/:id/negotiate', authenticate, (req: any, res) => {
    try {
      const { price, confirm } = req.body;
      const bookingId = req.params.id;

      const booking = db.prepare('SELECT service_type FROM bookings WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      const range = getPriceRange(booking.service_type);
      const p = parseInt(price);
      
      if (p < range.min || p > range.max) {
        return res.status(400).json({ error: `Price must be between ₹${range.min} and ₹${range.max}` });
      }
      
      const platformFee = calculatePlatformFee(p);
      const status = confirm ? 'confirmed' : 'negotiating';

      db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = ? WHERE id = ?').run(price, platformFee, status, bookingId);
      res.json({ success: true, platformFee, status });
    } catch (err) {
      console.error('Negotiate Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/bookings/:id/payment', authenticate, (req: any, res) => {
    try {
      const { payment_method, payment_status } = req.body;
      db.prepare('UPDATE bookings SET payment_method = ?, payment_status = ? WHERE id = ?').run(payment_method, payment_status, req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Payment Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Messages
  app.get('/api/bookings/:id/messages', authenticate, (req, res) => {
    try {
      const messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.booking_id = ? ORDER BY m.created_at ASC').all(req.params.id);
      res.json(messages);
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/bookings/:id/messages', authenticate, (req: any, res) => {
    try {
      const { content, attachment_url, attachment_type } = req.body;
      const sender_id = req.user.id;
      db.prepare('INSERT INTO messages (booking_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)').run(req.params.id, sender_id, content, attachment_url, attachment_type);
      res.json({ success: true });
    } catch (err) {
      console.error('Send Message Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/bookings/:id/messages/auto', authenticate, (req: any, res) => {
    try {
      const { content, proposedPrice, attachment_url, attachment_type } = req.body;
      const bookingId = req.params.id;
      
      // Get technician user ID for this booking
      const booking = db.prepare('SELECT technicians.user_id FROM bookings JOIN technicians ON bookings.technician_id = technicians.id WHERE bookings.id = ?').get(bookingId);
      
      if (booking) {
        // Insert message as technician
        db.prepare('INSERT INTO messages (booking_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)').run(
          bookingId, 
          booking.user_id, 
          content,
          attachment_url || null,
          attachment_type || null
        );
        
        // Update proposed price and platform fee
        const platformFee = calculatePlatformFee(proposedPrice);
        db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ? WHERE id = ?').run(proposedPrice, platformFee, bookingId);
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Auto Message Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
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
