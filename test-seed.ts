import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('fixmate.db');

function seedData() {
  console.log('Checking if seeding is needed...');
  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
  
  const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
  const standardServices = ['Maid', 'Car Wash', 'Haircut'];
  
  const techNames = ['Rohit Kumar', 'Rahul Singh', 'Aman Verma', 'Sumit Yadav', 'Vikram Gupta', 'Manoj Tiwari', 'Sunil Sharma', 'Pankaj Mishra', 'Rajesh Ranjan', 'Anil Paswan', 'Kavita Devi', 'Pooja Kumari', 'Sita Devi', 'Deepak Kumar', 'Suresh Singh'];

  districts.forEach(district => {
    const count = db.prepare('SELECT COUNT(*) as count FROM users JOIN technicians ON users.id = technicians.user_id WHERE technicians.district = ?').get(district).count;
    if (count < 2) {
      console.log(`Seeding district: ${district}`);
      // Seed Core Technicians
      coreServices.forEach((service, idx) => {
        const email = `${district.toLowerCase().replace(' ', '')}_${service.toLowerCase().replace(' ', '')}_${idx}@fixmate.com`;
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) return;
        const hashedPassword = bcrypt.hashSync('tech123', 10);
        db.prepare('INSERT INTO users (name, email, password, role, phone, location, district) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          'Tech', email, hashedPassword, 'technician', '123', 'Loc', district
        );
      });
    }
  });
  console.log('Seeding complete.');
}

const start = Date.now();
seedData();
console.log('Time taken:', Date.now() - start, 'ms');
process.exit(0);
