import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  FileText,
  Sparkles,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Rocket,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Users,
  Briefcase,
  Zap,
  Calendar,
  Store,
  ShoppingBag,
  Tag,
  Plus,
  Package,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { predictCost, generateTechnicianResponse } from './services/geminiService';

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  phone: string;
  location: string;
  district?: string;
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: number;
  created_at: string;
}

const getToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('getToken called, token exists:', !!token);
  return token;
};

interface Technician {
  id: number;
  user_id: number;
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

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-full relative transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60]"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && <span className="text-xs text-primary font-medium">{unreadCount} new</span>}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        n.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                        n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/book?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary p-2 rounded-lg">
              <Wrench className="text-white w-6 h-6" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Ease<span className="text-primary">Mate</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search technicians or services..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium">Home</Link>
            <Link to="/shop" className="text-slate-600 hover:text-primary font-medium flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" /> Shop
            </Link>
            <Link to="/book" className="text-slate-600 hover:text-primary font-medium">Book Technician</Link>
            <Link to="/register-tech" className="text-slate-600 hover:text-primary font-medium">Become Technician</Link>
            <Link to="/privacy" className="text-slate-600 hover:text-primary font-medium">Privacy</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all font-bold">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                {user.role === 'technician' && (
                  <Link to="/tech-dashboard" className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold">
                    <Briefcase className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <Link to="/bookings" className="text-slate-600 hover:text-primary font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {user.role === 'technician' ? 'My Jobs' : 'My Bookings'}
                </Link>
                <NotificationsDropdown />
                <Link to="/profile" className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">Hi, {user.name?.split(' ')[0] || 'User'}</Link>
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
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search technicians..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <Link to="/" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Home</Link>
            <Link to="/shop" onClick={() => setIsOpen(false)} className="block text-lg font-medium flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Shop / Marketplace
            </Link>
            <Link to="/book" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Book Technician</Link>
            <Link to="/register-tech" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Become Technician</Link>
            <Link to="/list-shop" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Advertise Your Shop</Link>
            <Link to="/privacy" onClick={() => setIsOpen(false)} className="block text-lg font-medium">Privacy Policy</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="block text-lg font-medium">About EaseMate</Link>
            {user && (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-secondary flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5" /> Admin Dashboard
                  </Link>
                )}
                <Link to="/bookings" onClick={() => setIsOpen(false)} className="block text-lg font-medium">My Bookings</Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-lg font-medium">My Profile</Link>
              </>
            )}
            {user ? (
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left text-red-500 font-medium">Logout</button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="w-full btn-primary">Login</Link>
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
          <span className="text-2xl font-bold">EaseMate</span>
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
          <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
          <li><Link to="/dispute" className="hover:text-primary font-medium text-red-400">Register your dispute</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
        <p className="text-slate-400">Email: support@easemate.in</p>
        <p className="text-slate-400">Phone: +91 9142262449</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">
      <p>Crafted with love in India ❤️ by Anand Amrit Raj</p>
    </div>
  </footer>
);

// --- Pages ---

const DisputePage = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Dispute Registered</h2>
          <p className="text-slate-500 mb-8">Your dispute has been successfully submitted. Our legal team will review the details and contact you within 48-72 hours.</p>
          <Link to="/" className="btn-primary px-8 py-3">Back to Home</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-red-50 p-4 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Register Your Dispute</h1>
              <p className="text-slate-500">Official Grievance Redressal Portal</p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl mb-8 text-sm leading-relaxed border-l-4 border-primary">
            <p className="font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Legal Disclaimer & Policy
            </p>
            All disputes submitted through this portal will be handled properly, fairly, and legally according to the prevailing laws of the land. EaseMate is committed to a transparent resolution process. Any false claims or fraudulent submissions will be subject to legal action under the Information Technology Act and relevant sections of the Indian Penal Code.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Booking Code / ID</label>
              <input 
                type="text" 
                required
                placeholder="e.g. BK-A1B2C3D4"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-mono"
                value={bookingCode}
                onChange={e => setBookingCode(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-2 px-2 italic">Required to verify the authenticity of your claim.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Dispute Details (Written)</label>
              <textarea 
                required
                rows={5}
                placeholder="Please describe the issue in detail..."
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Attach Evidence (Photo)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  id="dispute-photo"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="dispute-photo"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-50 transition-all"
                >
                  {file ? (
                    <div className="flex items-center gap-3 text-primary font-bold">
                      <ImageIcon className="w-6 h-6" />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <Paperclip className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-slate-500 font-medium">Click to upload photo evidence</span>
                      <span className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Submit Official Dispute
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
              EaseMate – Your <span className="text-primary">Smart Technician</span> at Your Doorstep
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
              Connect with verified local electricians, plumbers, and more. 
              Bargain for the best price and get guaranteed service.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary">
                Book a Technician <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register-tech" className="btn-secondary">
                Become a Technician
              </Link>
              <Link to="/list-shop" className="btn-primary">
                <Store className="w-5 h-5" /> Advertise Your Shop
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Why Choose EaseMate?</h2>
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

          {/* Customer Reviews */}
          <div className="mt-20">
            <h3 className="text-xl font-bold text-center mb-10 text-slate-400 uppercase tracking-widest">What Our Customers Say</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Amit Singh", city: "Patna", review: "EaseMate made it so easy to find an electrician. The bargaining feature is a game changer! I saved ₹200 on my AC repair.", rating: 5 },
                { name: "Priya Kumari", city: "Purnia", review: "Very professional service. The technician arrived on time and was very skilled. Highly recommended for home services in Bihar.", rating: 5 },
                { name: "Rajesh Kumar", city: "Darbhanga", review: "The AI cost predictor gave me a very accurate estimate. I felt confident negotiating with the technician. Great platform!", rating: 4 }
              ].map((r, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic mb-6">"{r.review}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                      <p className="text-slate-400 text-xs">{r.city}, Bihar</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">Serving Tier-1 & Tier-2 Cities of Bihar</h2>
            <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
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

const AICostPredictor = ({ defaultService, defaultDistrict }: { defaultService: string, defaultDistrict: string }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handlePredict = async () => {
    if (!description.trim()) return;
    setLoading(true);
    const result = await predictCost(defaultService || 'General', description, defaultDistrict || 'Patna');
    setPrediction(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8 rounded-3xl border border-primary/10 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary p-2 rounded-lg">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">AI Cost Predictor</h2>
      </div>
      <p className="text-slate-600 mb-6">Describe your problem to get an instant market-rate estimate for Bihar.</p>
      
      <div className="space-y-4">
        <textarea 
          placeholder="e.g., My AC is not cooling and making a loud noise. It's a 1.5 ton split AC."
          className="w-full p-3 bg-white rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-sm min-h-[120px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button 
          onClick={handlePredict}
          disabled={loading || !description.trim()}
          className="w-full btn-primary disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'Analyzing Market Rates...' : 'Get AI Estimate'}
        </button>
      </div>

      <AnimatePresence>
        {prediction && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-primary/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider">Estimated Range</p>
                <p className="text-3xl font-black text-primary">{prediction.estimatedRange}</p>
              </div>
              <div className="bg-primary/10 px-3 py-1 rounded-full text-primary text-xs font-bold">
                Market Rate Verified
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">Why this cost?</p>
                <p className="text-slate-600 text-sm leading-relaxed">{prediction.explanation}</p>
              </div>
              {prediction.tips && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Pro Tip
                  </p>
                  <p className="text-slate-600 text-sm italic">"{prediction.tips}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BookingPage = ({ user }: { user: User | null }) => {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [district, setDistrict] = useState(user?.district || '');
  const [service, setService] = useState('');
  const [search, setSearch] = useState(query);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const navigate = useNavigate();

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];
  const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
  const standardServices = ['Maid', 'Car Wash', 'Haircut'];

  useEffect(() => {
    if (user?.district && !district) {
      setDistrict(user.district);
    }
  }, [user]);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    fetchTechs();
  }, [district, service, search]);

  const fetchTechs = async () => {
    const res = await fetch(`/api/technicians?district=${district}&service=${service}&search=${search}`);
    const data = await res.json();
    setTechs(data);
  };

  const handleBook = async (techId: number) => {
    if (!user) return navigate('/login');
    
    // Check if user is booking themselves
    const tech = techs.find(t => t.id === techId);
    if (tech && tech.user_id === user.id) {
      alert("You cannot book your own service profile.");
      return;
    }

    setBookingLoading(techId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      console.log(`Attempting to book tech: ${techId}`);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ technician_id: techId, service_type: service || 'General' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`Booking response status: ${res.status}`);
      const data = await res.json();
      console.log('Booking response data:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      if (data.booking_id) {
        console.log(`Navigating to negotiate page for booking: ${data.booking_id}`);
        navigate(`/negotiate/${data.booking_id}`);
      } else {
        throw new Error('No booking ID returned');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Booking Error:', err);
      if (err.name === 'AbortError') {
        alert('Booking request timed out. Please try again.');
      } else {
        alert(err.message);
      }
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-12 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by name or service..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">All Services</option>
              <optgroup label="Core Category (₹500 - ₹1500)">
                {coreServices.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Standard Category (₹100 - ₹800)">
                {standardServices.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <AICostPredictor defaultService={service} defaultDistrict={district} />

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
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg"><MapPin className="w-3.5 h-3.5" /> {tech.district}</span>
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg"><ShieldCheck className="w-3.5 h-3.5" /> {tech.experience}y Exp</span>
                </div>
                <button 
                  disabled={bookingLoading === tech.id}
                  onClick={() => handleBook(tech.id)}
                  className="w-full btn-primary py-3.5 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {bookingLoading === tech.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book & Negotiate'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScheduleModal = ({ booking, onComplete, onClose }: { booking: any, onComplete: (date: string, time: string) => void, onClose: () => void }) => {
  const [type, setType] = useState<'sameday' | 'slot'>('sameday');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const finalDate = type === 'sameday' ? new Date().toISOString().split('T')[0] : date;
    const finalTime = type === 'sameday' ? 'As soon as possible' : time;
    await onComplete(finalDate, finalTime);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="bg-slate-900 p-8 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Schedule Service</h3>
          </div>
          <p className="text-slate-400 text-sm">When do you need the technician?</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setType('sameday')}
              className={`p-5 rounded-3xl border-2 transition-all duration-300 text-left ${type === 'sameday' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${type === 'sameday' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900">Same Day</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Within 2-4 hours</div>
            </button>
            <button 
              onClick={() => setType('slot')}
              className={`p-5 rounded-3xl border-2 transition-all duration-300 text-left ${type === 'slot' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${type === 'slot' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900">Pick a Slot</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Schedule for later</div>
            </button>
          </div>

          <AnimatePresence>
            {type === 'slot' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Select Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Select Time</label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            disabled={loading}
            onClick={handleConfirm}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl text-lg font-bold shadow-2xl shadow-slate-900/20 transition-all duration-300 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                <span>Confirm Schedule</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CheckoutModal = ({ booking, onComplete, onClose }: { booking: any, onComplete: (method: 'online' | 'cod') => void, onClose: () => void }) => {
  const [method, setMethod] = useState<'online' | 'cod' | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!method) return;
    setLoading(true);

    if (method === 'online') {
      if (!(window as any).Razorpay) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }
      const options = {
        key: 'rzp_test_dummy', // Dummy key for demo
        amount: Math.round((booking.negotiated_price + (booking.platform_fee || 0)) * 100),
        currency: 'INR',
        name: 'EaseMate Bihar',
        description: `Payment for ${booking.service_type}`,
        handler: async () => {
          await onComplete('online');
        },
        prefill: {
          name: booking.customer_name,
          email: 'customer@easemate.in',
          contact: '9142262449'
        },
        theme: { color: '#0F172A' }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      await onComplete('cod');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100"
      >
        <div className="bg-slate-900 p-8 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute right-6 top-6 p-2.5 hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Secure Checkout</h3>
          </div>
          <p className="text-slate-400 text-sm">Finalize your booking with EaseMate Bihar</p>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-sm font-medium">Negotiated Service Charge</span>
              <span className="font-bold text-slate-900">₹{booking.negotiated_price}</span>
            </div>
            <div className="flex justify-between items-center text-blue-600 bg-blue-50/50 px-3 py-2 rounded-xl border border-blue-100/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">Platform Fee (Deducted from Tech)</span>
              </div>
              <span className="text-xs font-bold">-₹{booking.platform_fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">EaseMate Insurance</span>
                <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Covered</span>
              </div>
              <span className="text-green-600 font-bold">₹0.00</span>
            </div>
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Total Payable by You</span>
              <div className="text-right">
                <span className="text-3xl font-black text-primary block leading-none">₹{booking.negotiated_price}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">No extra charges for you</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                <ShieldCheck className="w-3 h-3" /> SSL Secured
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setMethod('online')}
                className={`group p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 ${method === 'online' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className={`p-3 rounded-2xl transition-colors duration-300 ${method === 'online' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 block">Online</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">UPI, Cards, Net</span>
                </div>
              </button>
              <button 
                onClick={() => setMethod('cod')}
                className={`group p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 ${method === 'cod' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className={`p-3 rounded-2xl transition-colors duration-300 ${method === 'cod' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 block">COD</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Pay after service</span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              disabled={!method || loading}
              onClick={handlePayment}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl text-lg font-bold shadow-2xl shadow-slate-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                <>
                  <span>{method === 'online' ? 'Pay & Confirm Booking' : 'Confirm Booking'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-medium">
              By clicking confirm, you agree to our <Link to="/privacy" className="underline hover:text-primary">Terms of Service</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const NegotiatePage = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [attachment, setAttachment] = useState<{ url: string, type: 'image' | 'document', name: string } | null>(null);
  const [price, setPrice] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user && !localStorage.getItem('user')) {
      navigate('/login');
      return;
    }
    fetchBooking();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user]);

  useEffect(() => {
    if (booking?.negotiated_price && !price) {
      setPrice(booking.negotiated_price.toString());
    }
  }, [booking]);

  const [prevMessageCount, setPrevMessageCount] = useState(0);

  useEffect(() => {
    if (messages.length > prevMessageCount) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setPrevMessageCount(messages.length);
    }
  }, [messages, prevMessageCount]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data && data.id) {
        setBooking(data);
      } else {
        console.error('Booking not found or error:', data);
        alert(data.error || 'Booking not found');
        navigate('/book');
      }
    } catch (err) {
      console.error('Fetch Booking Error:', err);
      alert('Failed to load booking details');
      navigate('/book');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Fetch Messages Error:', err);
    }
  };

  const getPriceRange = (serviceType: string) => {
    const coreServices = ['Electrician', 'Plumber', 'AC Repair', 'Carpenter', 'Painter'];
    const standardServices = ['Maid', 'Car Wash', 'Haircut'];
    
    if (coreServices.includes(serviceType)) return { min: 500, max: 1500 };
    if (standardServices.includes(serviceType)) return { min: 100, max: 250 };
    return { min: 100, max: 2000 };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const type = file.type.startsWith('image/') ? 'image' : 'document';
      setAttachment({
        url: reader.result as string,
        type: type as 'image' | 'document',
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() && !attachment) return;
    
    // 1. Send user message
    await fetch(`/api/bookings/${id}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ 
        content: newMsg,
        attachment_url: attachment?.url,
        attachment_type: attachment?.type
      })
    });

    const currentMsg = newMsg;
    setNewMsg('');
    setAttachment(null);
    await fetchMessages();

    // 2. Automated Technician Reply (only if customer sends message)
    if (user?.role === 'customer') {
      const aiResponse = await generateTechnicianResponse(
        booking.service_type,
        currentMsg,
        booking.negotiated_price,
        null,
        booking.district,
        messages.slice(-5).map(m => ({ 
          sender: m.sender_id === user.id ? 'Customer' : 'Technician', 
          content: m.content 
        }))
      );

      if (aiResponse) {
        await fetch(`/api/bookings/${id}/messages/auto`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ 
            content: aiResponse.message,
            proposedPrice: aiResponse.proposedPrice || booking.negotiated_price,
            isAgreement: aiResponse.isAgreement
          })
        });
        
        fetchBooking();
        fetchMessages();
      }
    }
  };

  const confirmPrice = async (forceAccept = false) => {
    const p = forceAccept ? booking.negotiated_price : (price || booking.negotiated_price || getPriceRange(booking.service_type).min.toString());
    if (!p) return;
    const numericPrice = parseInt(p.toString());
    const range = getPriceRange(booking.service_type);
    
    if (numericPrice < range.min || numericPrice > range.max) {
      return alert(`Price for ${booking.service_type} must be between ₹${range.min} and ₹${range.max}`);
    }

    const isAccepting = forceAccept;

    if (isAccepting) {
      if (!booking.scheduled_date) {
        setShowSchedule(true);
      } else {
        setShowCheckout(true);
      }
      return;
    }

    await fetch(`/api/bookings/${id}/negotiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ 
        price: numericPrice,
        confirm: isAccepting || isTechnician // Technician proposing or Customer accepting
      })
    });

    if (!isTechnician) {
      // Send message from customer about the counter offer
      await fetch(`/api/bookings/${id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          content: `I am offering ₹${numericPrice} for this service.`
        })
      });

      // Customer countered, trigger AI reply
      const aiResponse = await generateTechnicianResponse(
        booking.service_type,
        `I want to pay ₹${numericPrice}`,
        booking.negotiated_price,
        numericPrice,
        booking.district,
        messages.slice(-5).map(m => ({ 
          sender: m.sender_id === user?.id ? 'Customer' : 'Technician', 
          content: m.content 
        }))
      );

      if (aiResponse) {
        await fetch(`/api/bookings/${id}/messages/auto`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ 
            content: aiResponse.message,
            proposedPrice: aiResponse.proposedPrice,
            isAgreement: aiResponse.isAgreement
          })
        });
      }
      
      alert('Counter Offer Sent');
      fetchBooking();
      fetchMessages();
    } else {
      alert('Proposal Updated');
      fetchBooking();
    }
    setShowNegotiation(false);
  };

  const handlePaymentComplete = async (method: 'online' | 'cod') => {
    try {
      const res = await fetch(`/api/bookings/${id}/confirm-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          payment_method: method,
          payment_status: method === 'online' ? 'paid' : 'pending'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      alert(`Booking Confirmed via ${method.toUpperCase()}!`);
      navigate('/book');
    } catch (err: any) {
      console.error('Payment/Confirmation Error:', err);
      alert(err.message || 'Failed to complete booking confirmation');
    }
  };

  const handleScheduleComplete = async (date: string, time: string) => {
    await fetch(`/api/bookings/${id}/schedule`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ date, time })
    });
    
    await fetch(`/api/bookings/${id}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ 
        content: `I've scheduled the service for ${date} at ${time}.`
      })
    });

    setShowSchedule(false);
    fetchBooking();
    setShowCheckout(true);
  };

  if (!booking) return <div className="pt-24 text-center">Loading...</div>;

  const isTechnician = user?.role === 'technician';

  return (
    <div className="pt-20 sm:pt-24 pb-0 sm:pb-12 min-h-screen bg-slate-50 flex flex-col">
      <AnimatePresence>
        {showSchedule && (
          <ScheduleModal 
            booking={booking} 
            onClose={() => setShowSchedule(false)} 
            onComplete={handleScheduleComplete} 
          />
        )}
        {showCheckout && (
          <CheckoutModal 
            booking={booking} 
            onClose={() => setShowCheckout(false)} 
            onComplete={handlePaymentComplete} 
          />
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-5xl mx-auto w-full px-0 sm:px-4 flex flex-col">
        <div className="bg-white sm:rounded-[2rem] shadow-2xl sm:shadow-slate-200/50 overflow-hidden flex flex-col flex-1 sm:max-h-[85vh]">
          {/* Header */}
          <div className="bg-slate-900 p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                {(isTechnician ? booking.customer_name : booking.technician_name)?.charAt(0)}
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold leading-tight">
                  {isTechnician ? booking.customer_name : booking.technician_name}
                </h2>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {booking.service_type} • {booking.district}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">
              <Clock className="w-4 h-4 text-primary" />
              {booking.scheduled_date ? `${booking.scheduled_date} @ ${booking.scheduled_time}` : 'Not Scheduled'}
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Insurance Covered
            </div>
            <button 
              onClick={() => setShowNegotiation(!showNegotiation)}
              className="sm:hidden p-2 bg-white/10 rounded-xl"
            >
              <IndianRupee className="w-5 h-5" />
            </button>
          </div>

          {/* Negotiation Panel (Mobile Collapsible) */}
          <AnimatePresence>
            {(showNegotiation || (window.innerWidth > 640 && (booking.negotiated_price || isTechnician))) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-50 border-b border-slate-100 overflow-hidden shrink-0"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="bg-primary/10 p-3 rounded-2xl">
                        <IndianRupee className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {booking.negotiated_price ? 'Current Proposal' : 'Initial Proposal'}
                        </p>
                        <p className="text-2xl sm:text-4xl font-black text-slate-900">
                          ₹{booking.negotiated_price || getPriceRange(booking.service_type).min}
                        </p>
                      </div>
                      {!isTechnician && booking.negotiated_price && (
                        <button 
                          onClick={() => confirmPrice(true)} 
                          className="sm:hidden bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20"
                        >
                          Accept
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-auto flex flex-col gap-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {isTechnician ? (booking.negotiated_price ? 'Update Proposal' : 'Propose Price') : 'Counter Offer'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            Range: ₹{getPriceRange(booking.service_type).min} - ₹{getPriceRange(booking.service_type).max}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl sm:text-2xl font-black text-primary">₹{price || booking.negotiated_price || getPriceRange(booking.service_type).min}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min={getPriceRange(booking.service_type).min}
                          max={getPriceRange(booking.service_type).max}
                          step="10"
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          value={price || booking.negotiated_price || getPriceRange(booking.service_type).min}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                        <button 
                          onClick={() => confirmPrice()} 
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                          {isTechnician ? 'Send' : 'Counter'}
                        </button>
                      </div>
                    </div>

                    {!isTechnician && booking.negotiated_price && (
                      <button 
                        onClick={() => confirmPrice(true)} 
                        className="hidden sm:block btn-primary px-8 py-4 shadow-xl shadow-primary/20"
                      >
                        Accept & Book Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
            <div className="flex justify-center">
              <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Secure Negotiation Channel
              </div>
            </div>
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1`}>
                  <div className={`p-4 rounded-[1.5rem] shadow-sm ${m.sender_id === user?.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                    {m.content && <p className="text-sm sm:text-base leading-relaxed font-medium">{m.content}</p>}
                    {m.is_agreement === 1 && !isTechnician && booking.status !== 'confirmed' && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                          <p className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Negotiation Complete!
                          </p>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => confirmPrice(true)}
                              className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> {booking.scheduled_date ? 'Accept & Pay' : 'Accept & Schedule'} ₹{m.proposed_price || booking.negotiated_price}
                            </button>
                            {!booking.scheduled_date && (
                              <button 
                                onClick={() => setShowSchedule(true)}
                                className="w-full py-2 bg-white text-primary border border-primary/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                              >
                                <Calendar className="w-3 h-3" /> Schedule Service
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {m.attachment_url && m.attachment_type !== 'action' && (
                      <div className="mt-3">
                        {m.attachment_type === 'image' ? (
                          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                            <img 
                              src={m.attachment_url} 
                              alt="Attachment" 
                              className="max-w-full hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <a 
                            href={m.attachment_url} 
                            download 
                            className={`flex items-center gap-3 p-3 rounded-2xl text-sm transition-all ${m.sender_id === user?.id ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'}`}
                          >
                            <div className="bg-primary/20 p-2 rounded-xl"><FileIcon className="w-4 h-4 text-primary" /></div>
                            <span className="flex-1 truncate font-bold">{m.name || 'Document'}</span>
                            <Download className="w-4 h-4 opacity-50" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 ${m.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                    {m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions / Negotiation Summary */}
          {!isTechnician && booking.status === 'pending' && booking.negotiated_price && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price Agreed: ₹{booking.negotiated_price}</span>
              </div>
              <div className="flex gap-2">
                {!booking.scheduled_date && (
                  <button 
                    onClick={() => setShowSchedule(true)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </button>
                )}
                <button 
                  onClick={() => confirmPrice(true)}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Accept Now
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
            {booking.status === 'confirmed' ? (
              <div className="bg-green-50 p-5 rounded-3xl text-green-700 text-center font-black uppercase tracking-widest text-sm border border-green-100 flex items-center justify-center gap-3">
                <CheckCircle className="w-5 h-5" />
                Booking Confirmed at ₹{booking.negotiated_price}
              </div>
            ) : (
              <div className="space-y-4">
                {attachment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3"
                  >
                    {attachment.type === 'image' ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200">
                        <img src={attachment.url} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <FileIcon className="text-primary w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{attachment.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{attachment.type}</p>
                    </div>
                    <button onClick={() => setAttachment(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </motion.div>
                )}

                <div className="flex gap-2 sm:gap-4 items-center">
                  <label className="cursor-pointer p-3 hover:bg-slate-50 rounded-2xl transition-all duration-300 text-slate-400 hover:text-primary flex-shrink-0 border border-transparent hover:border-slate-100">
                    <Paperclip className="w-6 h-6" />
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder={isTechnician ? "Type a reply..." : "Explain your issue..."}
                      className="w-full py-4 px-6 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-primary shadow-inner text-sm sm:text-base transition-all duration-300"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                  </div>
                  <button 
                    onClick={sendMessage} 
                    className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all duration-300 flex-shrink-0"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const AdminPanel = ({ user }: { user: User | null }) => {
  console.log('AdminPanel Rendered, User Role:', user?.role);
  const [stats, setStats] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'technicians' | 'bookings'>('analytics');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchTechs(),
        fetchBookings()
      ]);
    } catch (error) {
      console.error('Admin Data Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchTechs = async () => {
    const res = await fetch('/api/admin/technicians', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    setTechs(data);
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/admin/bookings', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    setBookings(data);
  };

  const verifyTech = async (id: number) => {
    await fetch(`/api/admin/technicians/${id}/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    fetchTechs();
    fetchStats();
  };

  const deleteTech = async (id: number) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    await fetch(`/api/admin/technicians/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    fetchTechs();
    fetchStats();
  };

  const updateBookingStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    fetchBookings();
    fetchStats();
  };

  if (user?.role !== 'admin') return <div className="pt-24 text-center">Access Denied</div>;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user.name}</p>
          </div>
          <div className="flex w-full md:w-auto bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {[
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'technicians', label: 'Technicians', icon: Users },
              { id: 'bookings', label: 'Bookings', icon: Briefcase }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-xs md:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Users', value: stats.userCount, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { label: 'Total Bookings', value: stats.bookingCount, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                      { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(2)}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { label: 'Pending Verification', value: stats.pendingTechs, icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className={`${s.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                          <s.icon className={`${s.color} w-6 h-6`} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <Wrench className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{b.service_type}</p>
                              <p className="text-xs text-slate-500">{b.customer_name} booked {b.technician_name}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-primary">₹{b.negotiated_price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Platform Health</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-slate-600">Verification Rate</span>
                          <span className="text-sm font-black text-primary">
                            {techs.length > 0 ? Math.round((techs.filter(t => t.is_verified).length / techs.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-1000" 
                            style={{ width: `${techs.length > 0 ? (techs.filter(t => t.is_verified).length / techs.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-sm text-blue-700 font-medium">
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          Tip: Verifying more technicians increases platform trust and booking volume.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'technicians' && (
              <motion.div
                key="technicians"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900">Technician Management</h2>
                  <div className="flex gap-2">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      {techs.filter(t => t.is_verified).length} Verified
                    </span>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                      {techs.filter(t => !t.is_verified).length} Pending
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-6">Technician</th>
                        <th className="p-6">Skills</th>
                        <th className="p-6">District</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {techs.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                                {t.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{t.name}</p>
                                <p className="text-xs text-slate-500">{t.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                              {t.skills}
                            </span>
                          </td>
                          <td className="p-6 text-sm text-slate-600 font-medium">{t.district}</td>
                          <td className="p-6">
                            {t.is_verified ? 
                              <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Verified
                              </span> :
                              <span className="flex items-center gap-1 text-orange-600 text-xs font-bold">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            }
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              {!t.is_verified && (
                                <button 
                                  onClick={() => verifyTech(t.id)} 
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  title="Verify"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteTech(t.id)} 
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100">
                  <h2 className="text-2xl font-black text-slate-900">Booking & Dispute Management</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Booking ID</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Technician</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 align-middle font-mono text-xs text-slate-400 whitespace-nowrap">{b.booking_number || `#BK-${b.id}`}</td>
                          <td className="px-6 py-4 align-middle">
                            <p className="font-bold text-slate-900 whitespace-nowrap">{b.service_type}</p>
                            <p className="text-[10px] text-slate-400">{new Date(b.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4 align-middle text-sm font-medium text-slate-700 whitespace-nowrap">{b.customer_name}</td>
                          <td className="px-6 py-4 align-middle text-sm font-medium text-slate-700 whitespace-nowrap">{b.technician_name}</td>
                          <td className="px-6 py-4 align-middle text-right">
                            <p className="font-black text-primary">₹{b.negotiated_price}</p>
                            <p className="text-[10px] text-slate-400">Fee: ₹{b.platform_fee.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 align-middle text-center">
                            <select 
                              value={b.status}
                              onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border-none focus:ring-2 focus:ring-primary cursor-pointer appearance-none text-center ${
                                b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                b.status === 'disputed' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <option value="negotiating">Negotiating</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="disputed">Disputed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <button 
                              onClick={() => navigate(`/negotiate/${b.id}`)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors inline-flex"
                              title="View Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="pt-24 pb-12 min-h-screen bg-slate-50">
    <div className="max-w-6xl mx-auto px-4">
      <div className="bg-white p-8 md:p-20 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">
            <Sparkles className="w-3 h-3" />
            Our Corporate Vision
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-10 text-slate-900 tracking-tighter leading-[0.9]">
            Empowering <span className="text-primary">Bharat's</span> <br />
            Skilled Workforce.
          </h1>
          
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-12">
              <section className="prose prose-slate max-w-none">
                <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  The Mission
                </h2>
                <p className="text-xl leading-relaxed text-slate-600 font-medium">
                  EaseMate is a technology-driven ecosystem designed to formalize the unorganized service sector in India, starting with the vibrant state of Bihar. We bridge the gap between skilled local technicians and households through a transparent, trust-based digital marketplace.
                </p>
                <p className="text-lg leading-relaxed text-slate-500">
                  Our platform addresses the critical "Trust Deficit" in the home services industry by providing rigorous district-level verification, standardized safety protocols, and a unique digital bargaining interface that respects local market dynamics.
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:border-primary/20 transition-colors group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <Users className="text-primary w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Community First</h3>
                  <p className="text-slate-500 leading-relaxed">We prioritize the socio-economic upliftment of our technicians, providing them with digital identities and consistent growth opportunities.</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:border-primary/20 transition-colors group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="text-primary w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Integrity & Safety</h3>
                  <p className="text-slate-500 leading-relaxed">Every service is backed by our comprehensive safety framework and a dedicated dispute resolution mechanism.</p>
                </div>
              </div>

              <section className="bg-slate-900 p-10 md:p-16 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Rocket className="w-32 h-32" />
                </div>
                <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
                  Strategic Differentiation
                </h2>
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="text-primary font-black text-4xl">01.</div>
                    <h3 className="text-xl font-bold">Hyper-Local Logistics</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Unlike generic aggregators, we operate at the district level, understanding the specific needs and nuances of local communities.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-primary font-black text-4xl">02.</div>
                    <h3 className="text-xl font-bold">Algorithmic Fairness</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Our AI-assisted bargaining tool ensures that pricing is fair, transparent, and mutually agreed upon before the first tool is lifted.
                    </p>
                  </div>
                </div>
              </section>

              <section className="prose prose-slate max-w-none">
                <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-secondary rounded-full"></div>
                  Core Corporate Values
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter">Excellence</h4>
                    <p className="text-sm text-slate-500">Uncompromising quality in every repair and interaction.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter">Transparency</h4>
                    <p className="text-sm text-slate-500">Open communication and fair pricing models for all.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter">Empowerment</h4>
                    <p className="text-sm text-slate-500">Providing tools for financial independence to the workforce.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-6">Founder's Vision</h3>
                <p className="text-xl italic font-medium leading-relaxed opacity-95 mb-10">
                  "EaseMate is more than an app; it's a movement to bring dignity, technology, and prosperity to the skilled hands that build our nation."
                </p>
                <div className="pt-8 border-t border-white/20">
                  <p className="font-black text-2xl">Anand Amrit Raj</p>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-70">Chief Executive Officer</p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-black mb-8 text-slate-900 uppercase tracking-widest">Growth Roadmap</h3>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-12 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">38</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Districts in Bihar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-12 bg-secondary rounded-full"></div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">10K+</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician Target</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-12 bg-slate-900 rounded-full"></div>
                    <div>
                      <p className="text-3xl font-black text-slate-900">₹5K</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Protection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="pt-24 pb-12 min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 bg-white p-12 md:p-16 rounded-[3rem] shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Shield className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Privacy Policy & Terms</h1>
      </div>

      <div className="prose prose-slate max-w-none space-y-10">
        <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
          <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            1. Professional Conduct
          </h2>
          <p className="text-slate-600 leading-relaxed">
            EaseMate enforces a stringent code of conduct. We maintain a zero-tolerance policy regarding harassment, fraudulent activity, and unprofessional behavior. All users—both customers and service providers—are legally bound to maintain professional decorum during all platform-facilitated interactions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            2. Service Contribution Framework
          </h2>
          <p className="text-slate-600 mb-4">Technicians agree to the following platform contribution structure based on negotiated service values:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tier 1 (₹250 - ₹450)</p>
              <p className="text-lg font-black text-primary">3% Contribution</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tier 2 (₹450 - ₹700)</p>
              <p className="text-lg font-black text-primary">5% Contribution</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tier 3 (₹750 - ₹1000)</p>
              <p className="text-lg font-black text-primary">8% Contribution</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tier 4 (₹1050+)</p>
              <p className="text-lg font-black text-primary">10% Contribution</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] text-white">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            3. Work Protection Insurance (₹5,000)
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p className="font-bold text-white">Important Clause regarding Insurance Coverage:</p>
            <p>
              EaseMate provides a Work Protection Insurance of <span className="text-primary font-bold">up to ₹5,000</span>. This coverage is strictly subject to the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-white">Not a Guaranteed Payout:</strong> The ₹5,000 figure represents the <em className="text-primary">maximum possible coverage</em>. It is not a flat amount provided to every claimant.
              </li>
              <li>
                <strong className="text-white">Valuation-Based:</strong> The actual insurance amount disbursed will be directly proportional to the <em className="text-white">actual damage incurred</em> and the <em className="text-white">market cost of the product</em> or part involved.
              </li>
              <li>
                <strong className="text-white">Mandatory Inspection:</strong> All claims will undergo a rigorous physical and technical inspection by the <em className="text-primary">EaseMate Internal Audit Team</em> and authorized senior technicians to verify the cause and extent of damage.
              </li>
              <li>
                <strong className="text-white">Verified Bookings Only:</strong> Insurance is only applicable for bookings confirmed and closed through the EaseMate platform.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            4. Subscription & Access
          </h2>
          <div className="space-y-4 text-slate-600">
            <p><strong>Customer Access:</strong> A nominal ₹30 platform confirmation fee is applicable per booking. This fee grants a 3-month "Priority Access" status, during which subsequent booking confirmation fees are waived.</p>
            <p><strong>Technician Enrollment:</strong> The initial 100 technicians are granted lifetime-free basic enrollment. Subsequent enrollments require a ₹300 quarterly maintenance fee to ensure profile visibility and access to high-value leads.</p>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-10">
          <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
            5. Data Privacy & Security
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              EaseMate is committed to protecting your personal data. We employ industry-standard encryption and security measures to safeguard your information.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-slate-900">Data Collection:</strong> We collect only necessary information required for service facilitation, including name, contact details, and location.</li>
              <li><strong className="text-slate-900">Usage:</strong> Your data is used solely for booking management, dispute resolution, and platform improvement.</li>
              <li><strong className="text-slate-900">Third-Party Sharing:</strong> We do not sell or lease your personal data to third parties. Information is shared with service providers only to the extent necessary for service delivery.</li>
              <li><strong className="text-slate-900">User Rights:</strong> You have the right to access, correct, or request deletion of your personal data at any time through your account settings.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
);

 const AuthPage = ({ type, onLogin, user }: { type: 'login' | 'signup'; onLogin: (u: User, t: string) => void; user: User | null }) => {
  console.log('AuthPage rendering, type:', type, 'user logged in:', !!user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [baseCharge, setBaseCharge] = useState('500');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'customer' | 'technician'>('customer');
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthPage check user effect, user:', user?.email);
    if (user) {
      console.log('User already logged in, redirecting...');
      if (user.role === 'technician') navigate('/tech-dashboard');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    console.log('AuthPage health check effect');
    fetch('/api/health')
      .then(res => res.ok ? setServerStatus('online') : setServerStatus('offline'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log(`handleSubmit started: ${type} for ${email}`);
    setLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = type === 'login' 
        ? { email, password } 
        : { 
            name, email, password, role, phone, location, district, 
            id_number: idNumber, 
            skills, 
            experience: Number(experience), 
            base_charge: Number(baseCharge), 
            bio 
          };
      
      console.log(`Fetching ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      console.log(`Response status: ${res.status}`);
      const data = await res.json();
      if (res.ok && data.token) {
        console.log('Auth success, storing credentials and navigating...');
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(data.user));
        storage.setItem('token', data.token);
        
        console.log('User role:', data.user.role);
        
        // Navigate first, then update state
        if (data.user.role === 'technician') {
          console.log('Navigating to tech-dashboard');
          navigate('/tech-dashboard');
        } else if (data.user.role === 'admin') {
          console.log('Navigating to admin');
          navigate('/admin');
        } else {
          console.log('Navigating to home');
          navigate('/');
        }

        console.log('Calling onLogin callback');
        onLogin(data.user, data.token);
      } else {
        console.error('Auth Failure Detail:', data);
        alert(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Auth Network Error Detail:', err);
      alert(`Network error: ${err.message || 'Server is unreachable'}. Please check your internet and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md my-12"
      >
        <h2 className="text-3xl font-bold mb-2 text-center">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <div className="flex justify-center mb-8">
          {serverStatus === 'checking' && <span className="text-[10px] text-slate-400">Checking server connection...</span>}
          {serverStatus === 'online' && <span className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Server Online</span>}
          {serverStatus === 'offline' && <span className="text-[10px] text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Server Offline - Please refresh</span>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'signup' && (
            <>
              <input 
                type="text" placeholder="Full Name" required
                className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={name} onChange={e => setName(e.target.value)}
              />
              <input 
                type="tel" placeholder="Mobile Number (Mandatory)" required
                className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
              <input 
                type="text" placeholder="Permanent Address" required
                className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={location} onChange={e => setLocation(e.target.value)}
              />
              <select 
                required
                className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                value={district} onChange={e => setDistrict(e.target.value)}
              >
                <option value="">Select Your District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${role === 'customer' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                >Customer</button>
                <button 
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${role === 'technician' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-500'}`}
                >Technician</button>
              </div>

              {role === 'technician' && (
                <>
                  <input 
                    type="text" placeholder="Aadhar Card Number (Mandatory)" required
                    className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                    value={idNumber} onChange={e => setIdNumber(e.target.value)}
                  />
                  <select 
                    required
                    className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                    value={skills} onChange={e => setSkills(e.target.value)}
                  >
                    <option value="">Select Primary Skill</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Painter">Painter</option>
                    <option value="Maid">Maid</option>
                    <option value="Car Wash">Car Wash</option>
                    <option value="Haircut">Haircut</option>
                  </select>
                  <div className="flex gap-4">
                    <input 
                      type="number" placeholder="Exp (Years)" required
                      className="flex-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                      value={experience} onChange={e => setExperience(e.target.value)}
                    />
                    <input 
                      type="number" placeholder="Base Charge (₹)" required
                      className="flex-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                      value={baseCharge} onChange={e => setBaseCharge(e.target.value)}
                    />
                  </div>
                  <textarea 
                    placeholder="Short Bio / Description of your work"
                    className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                    value={bio} onChange={e => setBio(e.target.value)}
                  />
                </>
              )}
            </>
          )}
          <input 
            type="email" placeholder="Email Address" required
            className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
            value={password} onChange={e => setPassword(e.target.value)}
          />

          {type === 'login' && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-primary font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (type === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500">
          {type === 'login' ? "Don't have an account?" : "Already have an account?"}
          <Link to={type === 'login' ? '/signup' : '/login'} className="text-primary font-bold ml-2 hover:underline">
            {type === 'login' ? 'Sign Up' : 'Login'}
          </Link>
        </p>
      </motion.div>

      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm relative"
            >
              <button 
                onClick={() => setShowForgot(false)}
                className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold mb-2">Reset Password</h3>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              
              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full py-3 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                />
                <button 
                  onClick={() => {
                    if (!forgotEmail) return alert('Please enter your email');
                    alert(`Password reset link sent to ${forgotEmail} (Demo)`);
                    setShowForgot(false);
                  }}
                  className="w-full btn-primary py-3 rounded-xl font-bold"
                >
                  Send Reset Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${search}&category=${category}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (product: any) => {
    // Navigate to a dedicated checkout/order page
    navigate(`/checkout/${product.id}`, { state: { product } });
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">EaseMate Shop</h1>
            <p className="text-slate-500 font-medium">Buy genuine spare parts and tools from verified local shops in Bihar.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search products (e.g. Capacitor, Drill)..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary shadow-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary shadow-sm font-bold text-slate-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Hardware">Hardware</option>
              <option value="Tools">Tools</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No products found</h2>
            <p className="text-slate-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img 
                    src={product.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-widest border border-primary/10">
                      {product.category}
                    </span>
                    {product.discount > 0 && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-slate-900">
                          ₹{product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price}
                        </p>
                        {product.discount > 0 && (
                          <p className="text-sm font-bold text-slate-400 line-through">₹{product.price}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop</p>
                      <p className="text-xs font-bold text-slate-700">{product.shop_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBuyNow(product)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CheckoutPage = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordered, setOrdered] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      console.error(err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!address.trim()) {
      return alert('Please provide a delivery address');
    }
    setShowPayment(true);
  };

  const handlePaymentComplete = async (method: 'online' | 'cod') => {
    // In a real app, we'd save the order to the database
    setOrdered(true);
    setShowPayment(false);
  };

  if (loading) return <div className="pt-32 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;
  if (!product) return <div className="pt-32 text-center">Product not found.</div>;

  if (ordered) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Order Placed!</h2>
          <p className="text-slate-500 mb-8">Your order for <strong>{product.name}</strong> has been placed successfully. The shop will contact you for delivery.</p>
          <Link to="/shop" className="btn-primary px-8 py-3">Continue Shopping</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <img 
              src={product.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80'} 
              className="w-full aspect-square object-cover rounded-2xl mb-6"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-black text-slate-900 mb-2">{product.name}</h1>
            <p className="text-slate-500 mb-4">{product.description}</p>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-primary">
                  ₹{product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price}
                </span>
                {product.discount > 0 && (
                  <span className="text-xs font-bold text-slate-400 line-through">₹{product.price}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-6">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Delivery Address</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold resize-none" 
                    rows={3} 
                    placeholder="Enter your full address..." 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  className="w-full btn-primary py-5 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 mt-4"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPayment && (
          <CheckoutModal 
            booking={{
              negotiated_price: product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price,
              platform_fee: 0,
              service_type: product.name,
              customer_name: customerName
            }}
            onComplete={handlePaymentComplete}
            onClose={() => setShowPayment(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopListingPage = ({ user }: { user: User | null }) => {
  const [myShop, setMyShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shopForm, setShopForm] = useState({ shop_name: '', address: '', district: '' });
  const [productForm, setProductForm] = useState({ name: '', price: '', description: '', category: 'Electrical', discount: '', image_url: '' });
  const navigate = useNavigate();

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchMyShop();
  }, [user]);

  const fetchMyShop = async () => {
    try {
      const res = await fetch('/api/my-shop', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setMyShop(data);
    } catch (err) {
      console.error('Fetch my shop error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(shopForm)
      });
      if (res.ok) fetchMyShop();
    } catch (err) {
      alert('Failed to create shop');
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (productForm.discount && Number(productForm.discount) < 1) {
      return alert('Discount cannot be less than 1%');
    }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          ...productForm, 
          shop_id: myShop.id, 
          price: Number(productForm.price),
          discount: productForm.discount ? Number(productForm.discount) : 0
        })
      });
      if (res.ok) {
        fetchMyShop();
        setProductForm({ name: '', price: '', description: '', category: 'Electrical', discount: '', image_url: '' });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add product');
      }
    } catch (err) {
      alert('Failed to add product');
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="pt-32 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        {!myShop ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">List Your Shop</h1>
                <p className="text-slate-500 font-medium">Start selling your products on EaseMate Marketplace.</p>
              </div>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Shop Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bihar Electricals"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold"
                    value={shopForm.shop_name}
                    onChange={e => setShopForm({ ...shopForm, shop_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">District</label>
                  <select 
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold"
                    value={shopForm.district}
                    onChange={e => setShopForm({ ...shopForm, district: e.target.value })}
                  >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Shop Address</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Full address of your shop..."
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary font-bold resize-none"
                  value={shopForm.address}
                  onChange={e => setShopForm({ ...shopForm, address: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full btn-primary py-5 rounded-2xl text-lg font-black shadow-xl shadow-primary/20">
                Create My Shop Listing
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active Shop</span>
                  <h1 className="text-3xl font-black text-slate-900">{myShop.shop_name}</h1>
                </div>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {myShop.address}, {myShop.district}
                </p>
              </div>
              <button 
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              >
                View in Shop <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Add Product
                  </h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Product Name</label>
                      <input 
                        type="text" required
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-sm"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Price (₹)</label>
                        <input 
                          type="number" required
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-sm"
                          value={productForm.price}
                          onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Discount (%)</label>
                        <input 
                          type="number"
                          min="1"
                          max="99"
                          placeholder="Min 1%"
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-sm"
                          value={productForm.discount}
                          onChange={e => setProductForm({ ...productForm, discount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Product Image *</label>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          required
                          onChange={handleImageUpload}
                          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                        {productForm.image_url && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                            <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Category</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-sm"
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Tools">Tools</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-sm resize-none"
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="w-full btn-primary py-3 rounded-xl font-black text-xs uppercase tracking-widest">
                      List Product
                    </button>
                  </form>
                </div>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-xl font-black text-slate-900 mb-6">My Listed Products ({myShop.products?.length || 0})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myShop.products?.map((p: any) => (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={p.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=100&q=80'} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{p.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-primary font-black">₹{p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100)) : p.price}</p>
                          {p.discount > 0 && (
                            <p className="text-[10px] text-slate-400 line-through font-bold">₹{p.price}</p>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Technician Dashboard ---

const ProfilePage = ({ user, onUpdate }: { user: User | null, onUpdate: (u: User) => void }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    district: user?.district || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">My Profile</h3>
            </div>
            <p className="text-slate-400 text-sm">Manage your personal information and preferences</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">District</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary transition-all appearance-none"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                  >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Address (Read Only)</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    readOnly
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl font-bold text-slate-500 cursor-not-allowed"
                    value={user.email}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Detailed Location / Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  required
                  rows={3}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary transition-all resize-none"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.role === 'technician' ? 'bg-primary' : 'bg-secondary'}`}></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Type: {user.role}</span>
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{success ? 'Profile Updated!' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>

        {user.role === 'technician' && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-1">Technician Profile</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                To update your professional details like skills, experience, or bio, please visit your <Link to="/tech-dashboard" className="font-black underline">Technician Dashboard</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TechnicianDashboard = ({ user }: { user: User | null }) => {
  const [techData, setTechData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const navigate = useNavigate();

  // Form states
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [baseCharge, setBaseCharge] = useState('');
  const [bio, setBio] = useState('');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'technician') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [techRes, bookingsRes] = await Promise.all([
        fetch('/api/technicians/me', { headers: { 'Authorization': `Bearer ${getToken()}` } }),
        fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      ]);
      
      const tech = await techRes.json();
      const bks = await bookingsRes.json();
      
      setTechData(tech);
      setBookings(bks);
      
      if (tech) {
        setSkills(tech.skills || '');
        setExperience(tech.experience?.toString() || '');
        setBaseCharge(tech.base_charge?.toString() || '');
        setBio(tech.bio || '');
        setDistrict(tech.district || '');
      }
    } catch (err) {
      console.error('Fetch Tech Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/technicians/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          skills,
          experience: Number(experience),
          base_charge: Number(baseCharge),
          bio,
          district
        })
      });
      if (res.ok) {
        alert('Profile updated successfully!');
        fetchData();
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pt-32 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Profile Info */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-secondary" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                <p className="text-slate-500 font-medium">{techData?.is_verified ? 'Verified Professional' : 'Verification Pending'}</p>
                {techData?.is_verified ? (
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                    <Clock className="w-3 h-3" /> Pending
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Primary Skill</label>
                  <select 
                    className="w-full mt-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                    value={skills} onChange={e => setSkills(e.target.value)}
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Painter">Painter</option>
                    <option value="Maid">Maid</option>
                    <option value="Car Wash">Car Wash</option>
                    <option value="Haircut">Haircut</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Experience</label>
                    <input 
                      type="number"
                      className="w-full mt-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                      value={experience} onChange={e => setExperience(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Base Charge</label>
                    <input 
                      type="number"
                      className="w-full mt-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                      value={baseCharge} onChange={e => setBaseCharge(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">District</label>
                  <select 
                    className="w-full mt-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                    value={district} onChange={e => setDistrict(e.target.value)}
                  >
                    {['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Bio</label>
                  <textarea 
                    className="w-full mt-1 py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                    value={bio} onChange={e => setBio(e.target.value)}
                  />
                </div>
                <button 
                  disabled={saving}
                  className="w-full py-3 bg-secondary text-white rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>

          {/* Main Content - Bookings */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900">Assigned Bookings</h2>
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-500">
                {bookings.length} Active
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No bookings yet</h3>
                <p className="text-slate-500">New customer requests will appear here once you are verified.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map(b => (
                  <motion.div 
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">
                          {b.customer_name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{b.customer_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{b.service_type} • {new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-1 ${
                          b.status === 'confirmed' ? 'bg-green-50 text-green-600' : 
                          b.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                          b.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                          b.status === 'negotiating' ? 'bg-amber-50 text-amber-600' : 
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </div>
                        <p className="text-lg font-black text-slate-900">₹{b.negotiated_price || '---'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex gap-2">
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={async () => {
                              const res = await fetch(`/api/bookings/${b.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                                body: JSON.stringify({ status: 'in_progress' })
                              });
                              if (res.ok) fetchData();
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                          >
                            Start Job
                          </button>
                        )}
                        {b.status === 'in_progress' && (
                          <button 
                            onClick={async () => {
                              const res = await fetch(`/api/bookings/${b.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                                body: JSON.stringify({ status: 'completed' })
                              });
                              if (res.ok) fetchData();
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/negotiate/${b.id}`)}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        View Details & Chat <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingHistoryPage = ({ user }: { user: User | null }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Fetch Bookings Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-900">{user?.role === 'technician' ? 'Assigned Jobs' : 'My Bookings'}</h1>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-500">
            {bookings.length} Total {user?.role === 'technician' ? 'Jobs' : 'Bookings'}
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No {user?.role === 'technician' ? 'jobs' : 'bookings'} yet</h2>
            <p className="text-slate-500 mb-8">
              {user?.role === 'technician' 
                ? "You haven't been assigned any jobs yet. Make sure your profile is complete and verified!" 
                : "You haven't made any service bookings yet. Start by finding a technician!"}
            </p>
            {user?.role !== 'technician' && (
              <Link to="/book" className="btn-primary inline-flex">
                Book a Technician <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/negotiate/${booking.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Wrench className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{booking.service_type}</h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {booking.booking_number || `#BK-${booking.id}`}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          booking.status === 'completed' ? 'bg-slate-200 text-slate-600' :
                          booking.status === 'negotiating' ? 'bg-amber-100 text-amber-600' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <User className="w-3 h-3" /> {user?.role === 'technician' ? booking.customer_name : booking.technician_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:text-right gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-xl font-black text-primary">₹{booking.negotiated_price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <div className="bg-slate-50 p-2 rounded-full text-slate-400">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error('Failed to parse user from storage', e);
      handleLogout();
    }
  }, []);

  // Verify session on mount to clear stale tokens (e.g. after DB reset)
  useEffect(() => {
    const verifySession = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          console.warn('Session invalid or user not found, logging out...');
          handleLogout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
      }
    };
    verifySession();
  }, []);

  const handleLogin = (u: User, token: string) => {
    console.log('handleLogin called for:', u.email, 'Role:', u.role);
    setUser(u);
    console.log('User state updated in App');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookingPage user={user} />} />
            <Route path="/tech-dashboard" element={<TechnicianDashboard user={user} />} />
            <Route path="/negotiate/:id" element={<NegotiatePage user={user} />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/dispute" element={<DisputePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/checkout/:id" element={<CheckoutPage user={user} />} />
            <Route path="/list-shop" element={<ShopListingPage user={user} />} />
            <Route path="/bookings" element={<BookingHistoryPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} onUpdate={setUser} />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<AuthPage type="login" onLogin={handleLogin} user={user} />} />
            <Route path="/signup" element={<AuthPage type="signup" onLogin={handleLogin} user={user} />} />
            <Route path="/register-tech" element={<AuthPage type="signup" onLogin={handleLogin} user={user} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
