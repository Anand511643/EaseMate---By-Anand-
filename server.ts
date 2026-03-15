import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'easemate-v1-secret-key-2026';

async function startServer() {
  try {
    console.log('Starting EaseMate Server...');
    const db = new Database('easemate.db');
    db.pragma('foreign_keys = ON');

    // Initialize Database
    const tableInfo = db.prepare("PRAGMA foreign_key_list('bookings')").all();
    const hasOldFk = tableInfo.some((fk: any) => 
      fk.table.toLowerCase() === 'technicians' || 
      (fk.from === 'technician_id' && fk.table.toLowerCase() === 'technicians')
    );
    if (hasOldFk) {
      db.pragma('foreign_keys = OFF');
      db.exec('DROP TABLE IF EXISTS messages');
      db.exec('DROP TABLE IF EXISTS bookings');
      db.pragma('foreign_keys = ON');
      console.log('Dropped bookings and messages tables to fix schema');
    }

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
        customer_id INTEGER NOT NULL,
        technician_id INTEGER NOT NULL,
        service_type TEXT,
        status TEXT DEFAULT 'pending',
        negotiated_price INTEGER,
        platform_fee REAL,
        insurance_applied INTEGER DEFAULT 1,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        scheduled_date TEXT,
        scheduled_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (technician_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT,
        attachment_url TEXT,
        attachment_type TEXT,
        is_agreement INTEGER DEFAULT 0,
        proposed_price INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        shop_name TEXT NOT NULL,
        address TEXT NOT NULL,
        district TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
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
      'ALTER TABLE bookings ADD COLUMN booking_number TEXT',
      'ALTER TABLE messages ADD COLUMN is_agreement INTEGER DEFAULT 0',
      'ALTER TABLE messages ADD COLUMN proposed_price INTEGER'
    ];

    migrations.forEach(m => {
      try {
        db.prepare(m).run();
        console.log(`Migration successful: ${m}`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.log(`Migration skipped or failed: ${m} - ${e.message}`);
        }
      }
    });

    // Seeding logic
    const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
    const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
    const techNames = ['Rohit Kumar', 'Rahul Singh', 'Aman Verma', 'Sumit Yadav', 'Vikram Gupta', 'Manoj Tiwari', 'Sunil Sharma', 'Pankaj Mishra', 'Rajesh Ranjan', 'Anil Paswan', 'Kavita Devi', 'Pooja Kumari', 'Sita Devi', 'Deepak Kumar', 'Suresh Singh'];

    console.log('Seeding technicians...');
    districts.forEach(district => {
      try {
        const count = db.prepare('SELECT COUNT(*) as count FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.district = ?').get(district).count;
        if (count < 2) {
          coreServices.forEach((service, idx) => {
            const email = `${district.toLowerCase().replace(' ', '')}_${service.toLowerCase().replace(' ', '')}_${idx}@easemate.com`;
            const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
            if (existing) return;
            
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
      } catch (e) {
        console.error(`Seeding failed for district ${district}:`, e);
      }
    });
    console.log('Seeding complete.');

    // Seed Initial Products
    console.log('Seeding initial products...');
    const initialProducts = [
      { 
        name: 'Capacitor 2.5mfd', 
        price: 60, 
        discount: 10,
        description: 'High quality 440V AC fan capacitor for ceiling fans and motors. Long-lasting and reliable.', 
        category: 'Electrical',
        image_url: 'https://images.unsplash.com/photo-1622127322216-e82361e97a3d?auto=format&fit=crop&w=400&q=80'
      },
      { 
        name: 'PVC Pipe 1/2 inch', 
        price: 120, 
        discount: 5,
        description: 'Durable and high-pressure PVC pipe for plumbing and water supply. 10ft length.', 
        category: 'Plumbing',
        image_url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=400&q=80'
      },
      { 
        name: 'Nuts and Fits Set', 
        price: 250, 
        discount: 15,
        description: 'Assorted set of stainless steel nuts, bolts and fits for various hardware repair needs.', 
        category: 'Hardware',
        image_url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80'
      },
      { 
        name: 'Drill Machine 13mm', 
        price: 1850, 
        discount: 20,
        description: 'Powerful 13mm impact drill machine with variable speed and ergonomic grip for professional use.', 
        category: 'Tools',
        image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80'
      }
    ];

    const easemateShop = db.prepare('SELECT id FROM shops WHERE shop_name = ?').get('EaseMate Official Store');
    if (!easemateShop) {
      const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
      if (admin) {
        const shopResult = db.prepare('INSERT INTO shops (user_id, shop_name, address, district) VALUES (?, ?, ?, ?)').run(
          admin.id, 'EaseMate Official Store', 'IT Hub Patna, Bihar', 'Patna'
        );
        const shopId = shopResult.lastInsertRowid;
        initialProducts.forEach(p => {
          db.prepare('INSERT INTO products (shop_id, name, price, description, category, image_url, discount) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            shopId, p.name, p.price, p.description, p.category, p.image_url, p.discount
          );
        });
      }
    }
    console.log('Product seeding complete.');

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
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
      });
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
      let attempts = 0;
      while (exists && attempts < 100) {
        attempts++;
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
        
        if (!decoded || !decoded.id) {
          return res.status(401).json({ error: 'Invalid token payload' });
        }

        // Verify user still exists in DB to handle stale tokens after DB resets
        const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(decoded.id);
        if (!user) {
          console.warn(`Auth failed: User ID ${decoded.id} from token not found in database (Stale Session)`);
          return res.status(401).json({ error: 'User account not found. Please login again.' });
        }
        
        req.user = { ...decoded, ...user };
        next();
      } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
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
          const { skills, experience, id_number, base_charge, bio } = req.body;
          db.prepare('INSERT INTO technicians (user_id, skills, experience, district, id_number, base_charge, bio) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            result.lastInsertRowid, skills, experience, district, id_number, base_charge || 500, bio || ''
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

    app.get('/api/users/me', authenticate, (req: any, res) => {
      const user = db.prepare('SELECT id, name, email, role, phone, location, district FROM users WHERE id = ?').get(req.user.id);
      res.json(user);
    });

    app.put('/api/users/me', authenticate, (req: any, res) => {
      const { name, phone, location, district } = req.body;
      db.prepare('UPDATE users SET name = ?, phone = ?, location = ?, district = ? WHERE id = ?').run(
        name, phone, location, district, req.user.id
      );
      
      // If user is a technician, also update district in technicians table for consistency
      if (req.user.role === 'technician') {
        db.prepare('UPDATE technicians SET district = ? WHERE user_id = ?').run(district, req.user.id);
      }

      const updatedUser = db.prepare('SELECT id, name, email, role, phone, location, district FROM users WHERE id = ?').get(req.user.id);
      res.json(updatedUser);
    });

    app.get('/api/technicians/me', authenticate, (req: any, res) => {
      if (req.user.role !== 'technician') return res.status(403).json({ error: 'Forbidden' });
      const tech = db.prepare('SELECT * FROM technicians WHERE user_id = ?').get(req.user.id);
      res.json(tech);
    });

    app.put('/api/technicians/me', authenticate, (req: any, res) => {
      if (req.user.role !== 'technician') return res.status(403).json({ error: 'Forbidden' });
      const { skills, experience, base_charge, bio, district } = req.body;
      db.prepare('UPDATE technicians SET skills = ?, experience = ?, base_charge = ?, bio = ?, district = ? WHERE user_id = ?').run(
        skills, experience, base_charge, bio, district, req.user.id
      );
      res.json({ success: true });
    });

    app.get('/api/technicians', (req, res) => {
      const { district, service, search } = req.query;
      let query = 'SELECT t.*, u.name, u.phone FROM technicians t JOIN users u ON t.user_id = u.id WHERE t.is_verified = 1';
      const params: any[] = [];
      if (district) { query += ' AND t.district = ?'; params.push(district); }
      if (service) { query += ' AND t.skills LIKE ?'; params.push(`%${service}%`); }
      if (search) {
        query += ' AND (u.name LIKE ? OR t.skills LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      res.json(db.prepare(query).all(...params));
    });

    app.post('/api/bookings', authenticate, (req: any, res) => {
      try {
        const { technician_id, service_type } = req.body;
        const techId = Number(technician_id);
        const customerId = Number(req.user.id);
        
        if (isNaN(techId) || isNaN(customerId)) {
          return res.status(400).json({ error: 'Invalid technician or customer ID' });
        }

        console.log(`Creating booking for tech_id: ${techId}, customer_id: ${customerId}`);
        
        const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(techId);
        if (!tech) {
          console.error(`Tech record not found for id: ${techId}`);
          return res.status(404).json({ error: 'Technician profile not found' });
        }

        if (!tech.user_id) {
          console.error(`Technician record ${techId} has no user_id`);
          return res.status(400).json({ error: 'Technician profile is invalid (missing user_id)' });
        }

        const platformFee = calculatePlatformFee(tech.base_charge);
        const bookingNumber = getUniqueBookingNumber();
        
        console.log(`Generated booking number: ${bookingNumber}`);
        
        const result = db.prepare('INSERT INTO bookings (booking_number, customer_id, technician_id, service_type, status, negotiated_price, platform_fee) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          bookingNumber, customerId, tech.user_id, service_type || 'General', 'negotiating', tech.base_charge, platformFee
        );
        
        console.log(`Booking created with ID: ${result.lastInsertRowid}`);
        res.json({ booking_id: Number(result.lastInsertRowid), booking_number: bookingNumber });
      } catch (err: any) {
        console.error('Booking Creation Error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
      }
    });

    app.get('/api/bookings', authenticate, (req: any, res) => {
      let query = 'SELECT b.*, u.name as customer_name, tu.name as technician_name FROM bookings b JOIN users u ON b.customer_id = u.id JOIN users tu ON b.technician_id = tu.id';
      if (req.user.role === 'technician') query += ' WHERE b.technician_id = ?';
      else if (req.user.role === 'customer') query += ' WHERE b.customer_id = ?';
      res.json(db.prepare(query).all(req.user.role === 'admin' ? [] : [req.user.id]));
    });

    app.get('/api/bookings/:id', authenticate, (req: any, res) => {
      try {
        const booking = db.prepare('SELECT b.*, u.name as customer_name, tu.name as technician_name, b.technician_id as tech_user_id FROM bookings b JOIN users u ON b.customer_id = u.id JOIN users tu ON b.technician_id = tu.id WHERE b.id = ?').get(req.params.id);
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(booking);
      } catch (err: any) {
        console.error('Fetch Booking API Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/api/bookings/:id/negotiate', authenticate, (req: any, res) => {
      try {
        const { price, confirm } = req.body;
        const bookingId = req.params.id;
        const userId = req.user.id;

        const booking = db.prepare(`
          SELECT b.*, u.name as customer_name, u.phone as customer_phone, 
                 tu.name as technician_name, tu.phone as technician_phone,
                 t.is_verified as tech_verified
          FROM bookings b 
          JOIN users u ON b.customer_id = u.id 
          JOIN users tu ON b.technician_id = tu.id
          JOIN technicians t ON tu.id = t.user_id
          WHERE b.id = ?
        `).get(bookingId);

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const platformFee = calculatePlatformFee(price);

        if (confirm) {
          if (!booking.tech_verified) {
            return res.status(400).json({ error: 'Technician profile must be verified before confirming a booking.' });
          }

          db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = ? WHERE id = ?').run(price, platformFee, 'confirmed', bookingId);

          // Create Notifications
          const confirmationMessage = `Booking #${booking.booking_number} Confirmed!
Service: ${booking.service_type}
Date: ${booking.scheduled_date || 'TBD'}
Time: ${booking.scheduled_time || 'TBD'}
Price: ₹${price}
Technician: ${booking.technician_name} (${booking.technician_phone})`;
          
          const techMessage = `Booking #${booking.booking_number} Confirmed!
Service: ${booking.service_type}
Date: ${booking.scheduled_date || 'TBD'}
Time: ${booking.scheduled_time || 'TBD'}
Price: ₹${price}
Customer: ${booking.customer_name} (${booking.customer_phone})`;

          db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(booking.customer_id, 'Booking Confirmed', confirmationMessage, 'success');
          db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(booking.technician_id, 'New Confirmed Booking', techMessage, 'success');
        } else {
          db.prepare('UPDATE bookings SET negotiated_price = ?, platform_fee = ?, status = ? WHERE id = ?').run(price, platformFee, 'negotiating', bookingId);
        }

        res.json({ success: true });
      } catch (err: any) {
        console.error('Negotiation Error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/bookings/:id/schedule', authenticate, (req, res) => {
      const { date, time } = req.body;
      db.prepare('UPDATE bookings SET scheduled_date = ?, scheduled_time = ? WHERE id = ?').run(date, time, req.params.id);
      res.json({ success: true });
    });

    app.patch('/api/bookings/:id/status', authenticate, (req: any, res) => {
      const { status } = req.body;
      const bookingId = req.params.id;
      const userId = req.user.id;
      const role = req.user.role;

      try {
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Authorization: Only technician assigned or admin can update status
        if (role !== 'admin' && booking.technician_id !== userId) {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get('/api/notifications', authenticate, (req: any, res) => {
      res.json(db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
    });

    app.post('/api/notifications/:id/read', authenticate, (req: any, res) => {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    });

    app.post('/api/bookings/:id/confirm-payment', authenticate, (req: any, res) => {
      try {
        const { payment_method, payment_status } = req.body;
        const bookingId = req.params.id;

        const booking = db.prepare(`
          SELECT b.*, u.name as customer_name, u.phone as customer_phone, 
                 tu.name as technician_name, tu.phone as technician_phone,
                 t.is_verified as tech_verified
          FROM bookings b 
          JOIN users u ON b.customer_id = u.id 
          JOIN users tu ON b.technician_id = tu.id
          JOIN technicians t ON tu.id = t.user_id
          WHERE b.id = ?
        `).get(bookingId);

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (!booking.tech_verified) {
          return res.status(400).json({ error: 'Technician profile must be verified before confirming a booking.' });
        }

        // Update booking in one go
        db.prepare('UPDATE bookings SET payment_method = ?, payment_status = ?, status = ? WHERE id = ?').run(
          payment_method, payment_status, 'confirmed', bookingId
        );

        // Create Notifications
        const confirmationMessage = `Booking #${booking.booking_number} Confirmed!
Service: ${booking.service_type}
Date: ${booking.scheduled_date || 'TBD'}
Time: ${booking.scheduled_time || 'TBD'}
Price: ₹${booking.negotiated_price}
Technician: ${booking.technician_name} (${booking.technician_phone})`;
        
        const techMessage = `Booking #${booking.booking_number} Confirmed!
Service: ${booking.service_type}
Date: ${booking.scheduled_date || 'TBD'}
Time: ${booking.scheduled_time || 'TBD'}
Price: ₹${booking.negotiated_price}
Customer: ${booking.customer_name} (${booking.customer_phone})`;

        db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(booking.customer_id, 'Booking Confirmed', confirmationMessage, 'success');
        db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(booking.technician_id, 'New Confirmed Booking', techMessage, 'success');

        // Add confirmation message to chat
        const chatMsg = `Booking confirmed! Scheduled for ${booking.scheduled_date} at ${booking.scheduled_time}. Payment method: ${payment_method.toUpperCase()}.`;
        db.prepare('INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)').run(bookingId, booking.customer_id, chatMsg);

        res.json({ success: true });
      } catch (err: any) {
        console.error('Confirm Payment Error:', err);
        res.status(500).json({ error: err.message });
      }
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
      const { content, proposedPrice, isAgreement } = req.body;
      const booking = db.prepare('SELECT technician_id as user_id FROM bookings WHERE id = ?').get(req.params.id);
      if (booking) {
        db.prepare('INSERT INTO messages (booking_id, sender_id, content, is_agreement, proposed_price) VALUES (?, ?, ?, ?, ?)').run(
          req.params.id, 
          booking.user_id, 
          content, 
          isAgreement ? 1 : 0, 
          proposedPrice
        );
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
      const pendingTechs = db.prepare('SELECT COUNT(*) as count FROM technicians WHERE is_verified = 0').get().count;
      res.json({ userCount, bookingCount, revenue, pendingTechs });
    });

    app.get('/api/admin/technicians', authenticate, (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      res.json(db.prepare('SELECT t.*, u.name, u.email, u.phone FROM technicians t JOIN users u ON t.user_id = u.id').all());
    });

    app.post('/api/admin/technicians/:id/verify', authenticate, (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { is_verified } = req.body;
      db.prepare('UPDATE technicians SET is_verified = ? WHERE id = ?').run(is_verified ? 1 : 0, req.params.id);
      res.json({ success: true });
    });

    // Shop Routes
    app.get('/api/products', (req, res) => {
      const { search, category } = req.query;
      let query = 'SELECT p.*, s.shop_name, s.address, s.district FROM products p JOIN shops s ON p.shop_id = s.id';
      const params: any[] = [];
      
      if (search || category) {
        query += ' WHERE';
        if (search) {
          query += ' (p.name LIKE ? OR p.description LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        if (search && category) query += ' AND';
        if (category) {
          query += ' p.category = ?';
          params.push(category);
        }
      }
      
      query += ' ORDER BY p.created_at DESC';
      res.json(db.prepare(query).all(...params));
    });

    app.get('/api/products/:id', (req, res) => {
      try {
        const product = db.prepare('SELECT p.*, s.shop_name, s.address, s.district FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = ?').get(req.params.id);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
      } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/api/shops', authenticate, (req: any, res) => {
      const { shop_name, address, district } = req.body;
      try {
        const result = db.prepare('INSERT INTO shops (user_id, shop_name, address, district) VALUES (?, ?, ?, ?)').run(
          req.user.id, shop_name, address, district
        );
        res.json({ shop_id: Number(result.lastInsertRowid) });
      } catch (err) {
        res.status(400).json({ error: 'Shop already exists for this user' });
      }
    });

    app.post('/api/products', authenticate, (req: any, res) => {
      const { shop_id, name, description, price, category, image_url, discount } = req.body;
      try {
        const shop = db.prepare('SELECT id FROM shops WHERE id = ? AND user_id = ?').get(shop_id, req.user.id);
        if (!shop) return res.status(403).json({ error: 'Unauthorized to add products to this shop' });
        
        if (discount !== undefined && discount !== null && discount !== '' && Number(discount) < 1 && Number(discount) !== 0) {
          return res.status(400).json({ error: 'Discount cannot be less than 1%' });
        }

        const result = db.prepare('INSERT INTO products (shop_id, name, description, price, category, image_url, discount) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          shop_id, name, description, price, category, image_url, discount || 0
        );
        res.json({ product_id: Number(result.lastInsertRowid) });
      } catch (err) {
        res.status(500).json({ error: 'Failed to add product' });
      }
    });

    app.get('/api/my-shop', authenticate, (req: any, res) => {
      const shop = db.prepare('SELECT * FROM shops WHERE user_id = ?').get(req.user.id);
      if (!shop) return res.json(null);
      const products = db.prepare('SELECT * FROM products WHERE shop_id = ?').all(shop.id);
      res.json({ ...shop, products });
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
      console.log(`EaseMate Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('CRITICAL: Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
