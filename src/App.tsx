import { useState, useEffect, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Wrench, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  MapPin, 
  User, 
  LogOut, 
  CheckCircle, 
  Menu, 
  X,
  ArrowRight,
  Star,
  IndianRupee,
  Phone,
  LayoutDashboard,
  Shield,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
}

interface Technician {
  id: number;
  name: string;
  skills: string;
  experience: number;
  district: string;
  base_charge: number;
  rating: number;
  bio: string;
  phone: string;
}

// --- Components ---

const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Wrench className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Fix<span className="text-primary">Mate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium">Home</Link>
            <Link to="/book" className="text-slate-600 hover:text-primary font-medium">Book Technician</Link>
            <Link to="/register-tech" className="text-slate-600 hover:text-primary font-medium">Become Technician</Link>
            <Link to="/privacy" className="text-slate-600 hover:text-primary font-medium">Privacy</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                  <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-full text-secondary">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <span className="text-sm font-semibold text-slate-700">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={onLogout} className="p-2 hover:bg-red-50 rounded-full text-red-500">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">Login</Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-slate-100 px-4 py-6 space-y-4"
          >
            <Link to="/" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Home</Link>
            <Link to="/book" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Book Technician</Link>
            <Link to="/register-tech" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Become Technician</Link>
            <Link to="/privacy" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Privacy Policy</Link>
            {user ? (
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left text-red-500 font-medium">Logout</button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block btn-primary text-center">Login</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Wrench className="text-primary w-6 h-6" />
          <span className="text-2xl font-bold">FixMate</span>
        </div>
        <p className="text-slate-400">
          IT Hub Patna Bihar 800001<br />
          Smart Technician Booking Platform for Bihar.
        </p>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-6">Quick Links</h4>
        <ul className="space-y-4 text-slate-400">
          <li><Link to="/book" className="hover:text-primary">Book a Service</Link></li>
          <li><Link to="/register-tech" className="hover:text-primary">Join as Technician</Link></li>
          <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
        <p className="text-slate-400">Email: support@fixmate.in</p>
        <p className="text-slate-400">Phone: +91 612 222 5431</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">
      <p>Crafted with love in India ❤️ by Anand Amrit Raj</p>
    </div>
  </footer>
);

// --- Pages ---

const HomePage = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/repair/1920/1080?blur=2" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
              #1 Service Platform in Bihar
            </span>
            <h1 className="text-6xl font-black text-slate-900 leading-tight mb-6">
              FixMate – Your <span className="text-primary">Smart Technician</span> at Your Doorstep
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Connect with verified local electricians, plumbers, and more. 
              Bargain for the best price and get guaranteed service.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                Book a Technician <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register-tech" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                Become a Technician
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose FixMate?</h2>
            <p className="text-slate-600">The smartest way to get things fixed in your home.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Verified Experts", desc: "Every technician goes through a strict background check." },
              { icon: MessageSquare, title: "Bargaining Feature", desc: "Negotiate prices directly with technicians in real-time." },
              { icon: IndianRupee, title: "Transparent Pricing", desc: "No hidden costs. Pay what you agree upon." },
              { icon: Shield, title: "Damage Insurance", desc: "Get insured up to ₹5,000 for any accidental damages." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bihar Focus */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <img 
              src="https://picsum.photos/seed/bihar/800/600" 
              className="rounded-3xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-6">Serving Tier-1 & Tier-2 Cities of Bihar</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We understand the unique needs of Bihar. From Patna to Purnia, 
              we're bridging the gap between skilled workers and households. 
              Our platform empowers local technicians while providing reliable 
              services to customers.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura'].map(city => (
                <div key={city} className="flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle className="text-primary w-5 h-5" /> {city}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const BookingPage = ({ user }: { user: User | null }) => {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [district, setDistrict] = useState('');
  const [service, setService] = useState('');
  const navigate = useNavigate();

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
  const services = ['Electrician', 'Plumber', 'Carpenter', 'AC Repair', 'Painter'];

  useEffect(() => {
    fetchTechs();
  }, [district, service]);

  const fetchTechs = async () => {
    const res = await fetch(`/api/technicians?district=${district}&service=${service}`);
    const data = await res.json();
    setTechs(data);
  };

  const handleBook = async (techId: number) => {
    if (!user) return navigate('/login');
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ technician_id: techId, service_type: service || 'General' })
    });
    const data = await res.json();
    navigate(`/negotiate/${data.booking_id}`);
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-12 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">All Services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {techs.map(tech => (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={tech.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
            >
              <div className="h-48 bg-slate-200 relative">
                <img 
                  src={`https://picsum.photos/seed/${tech.id}/400/300`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {tech.rating}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{tech.name}</h3>
                    <p className="text-primary font-semibold">{tech.skills}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Base Charge</p>
                    <p className="text-lg font-bold">₹{tech.base_charge}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tech.district}</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {tech.experience}y Exp</span>
                </div>
                <button 
                  onClick={() => handleBook(tech.id)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  Book & Negotiate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NegotiatePage = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [price, setPrice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchBooking = async () => {
    const res = await fetch(`/api/bookings/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setBooking(data);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/bookings/${id}/messages`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    await fetch(`/api/bookings/${id}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content: newMsg })
    });
    setNewMsg('');
    fetchMessages();
  };

  const confirmPrice = async () => {
    if (!price) return;
    await fetch(`/api/bookings/${id}/negotiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ price })
    });
    alert(`Booking Confirmed at ₹${price}! Please pay ₹30 confirmation fee.`);
    navigate('/book');
  };

  if (!booking) return <div className="pt-24 text-center">Loading...</div>;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[70vh]">
          {/* Header */}
          <div className="bg-primary p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Negotiating with {booking.technician_name}</h2>
              <p className="opacity-90">{booking.service_type} Service in {booking.district}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm">
              Insurance up to ₹5,000 Applied
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-4 rounded-2xl ${m.sender_id === user?.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm'}`}>
                  <p className="text-xs opacity-70 mb-1">{m.sender_name}</p>
                  <p>{m.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-4 mb-4">
              <input 
                type="number" 
                placeholder="Final Agreed Price" 
                className="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <button onClick={confirmPrice} className="btn-secondary">Confirm Booking</button>
            </div>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="btn-primary"><MessageSquare /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ user }: { user: User | null }) => {
  const [stats, setStats] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchStats();
    fetchTechs();
  }, [user]);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchTechs = async () => {
    const res = await fetch('/api/admin/technicians', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setTechs(data);
  };

  const verifyTech = async (id: number) => {
    await fetch(`/api/admin/technicians/${id}/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchTechs();
  };

  if (user?.role !== 'admin') return <div className="pt-24 text-center">Access Denied</div>;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Users', value: stats.userCount, icon: User, color: 'text-blue-500' },
              { label: 'Total Bookings', value: stats.bookingCount, icon: CheckCircle, color: 'text-green-500' },
              { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(2)}`, icon: IndianRupee, color: 'text-emerald-500' },
              { label: 'Pending Verification', value: stats.pendingTechs, icon: Shield, color: 'text-orange-500' }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <s.icon className={`${s.color} w-8 h-8 mb-4`} />
                <p className="text-slate-500 text-sm">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold">Technician Management</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Skills</th>
                <th className="p-4">District</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {techs.map(t => (
                <tr key={t.id}>
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4">{t.skills}</td>
                  <td className="p-4">{t.district}</td>
                  <td className="p-4">
                    {t.is_verified ? 
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Verified</span> :
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Pending</span>
                    }
                  </td>
                  <td className="p-4">
                    {!t.is_verified && (
                      <button onClick={() => verifyTech(t.id)} className="text-primary hover:underline font-bold">Verify</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PrivacyPolicy = () => (
  <div className="pt-24 pb-12 min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 bg-white p-12 rounded-3xl shadow-sm">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy & Terms</h1>
      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Strict Rules & Regulations</h2>
          <p>FixMate maintains a zero-tolerance policy towards harassment, fraud, and unprofessional behavior. Both customers and technicians are expected to maintain decorum during negotiations and service delivery.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">2. Platform Contribution (Service Fees)</h2>
          <p>Technicians agree to contribute a percentage of their earnings to the platform as follows:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>₹250 - ₹450: 3% (Special: ₹280 = 2.73%, ₹290-299 = 2.93%)</li>
            <li>₹450 - ₹700: 5%</li>
            <li>₹750 - ₹1000: 8%</li>
            <li>₹1050 - ₹1500: 10%</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">3. Subscription Model</h2>
          <p><strong>Customers:</strong> A ₹30 confirmation fee is charged per booking, valid for 3 months. Subsequent bookings within this period are free of this charge.</p>
          <p><strong>Technicians:</strong> First 100 enrollments are free. Thereafter, a ₹300 fee is applicable every 3 months to maintain active status on the platform.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">4. Insurance</h2>
          <p>FixMate provides insurance coverage up to ₹5,000 for accidental damages caused during a verified booking. Claims must be filed within 24 hours of service completion.</p>
        </section>
      </div>
    </div>
  </div>
);

const AuthPage = ({ type, onLogin }: { type: 'login' | 'signup'; onLogin: (u: User, t: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'technician'>('customer');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = type === 'login' ? { email, password } : { name, email, password, role };
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.token) {
      onLogin(data.user, data.token);
      navigate('/');
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'signup' && (
            <>
              <input 
                type="text" placeholder="Full Name" required
                className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={name} onChange={e => setName(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === 'customer' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                >Customer</button>
                <button 
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${role === 'technician' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-500'}`}
                >Technician</button>
              </div>
            </>
          )}
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full btn-primary py-4 text-lg">
            {type === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500">
          {type === 'login' ? "Don't have an account?" : "Already have an account?"}
          <Link to={type === 'login' ? '/signup' : '/login'} className="text-primary font-bold ml-2 hover:underline">
            {type === 'login' ? 'Sign Up' : 'Login'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User, token: string) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookingPage user={user} />} />
            <Route path="/negotiate/:id" element={<NegotiatePage user={user} />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<AuthPage type="login" onLogin={handleLogin} />} />
            <Route path="/signup" element={<AuthPage type="signup" onLogin={handleLogin} />} />
            <Route path="/register-tech" element={<AuthPage type="signup" onLogin={handleLogin} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
