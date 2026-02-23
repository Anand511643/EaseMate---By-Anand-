import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
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
  FileText,
  Sparkles,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { predictCost } from './services/geminiService';

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  district?: string;
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
            <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
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
            <Link to="/about" onClick={() => setIsOpen(false)} className="block text-lg font-medium">About FixMate</Link>
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
          <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
        <p className="text-slate-400">Email: support@fixmate.in</p>
        <p className="text-slate-400">Phone: +91 9142262449</p>
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
              FixMate – Your <span className="text-primary">Smart Technician</span> at Your Doorstep
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Why Choose FixMate?</h2>
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
                { name: "Amit Singh", city: "Patna", review: "FixMate made it so easy to find an electrician. The bargaining feature is a game changer! I saved ₹200 on my AC repair.", rating: 5 },
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
  const [district, setDistrict] = useState(user?.district || '');
  const [service, setService] = useState('');
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
                  onClick={() => handleBook(tech.id)}
                  className="w-full btn-primary py-3.5 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
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
        name: 'FixMate Bihar',
        description: `Payment for ${booking.service_type}`,
        handler: async () => {
          await onComplete('online');
        },
        prefill: {
          name: booking.customer_name,
          email: 'customer@fixmate.in',
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Booking Summary</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between text-slate-600">
              <span>Service Charge (Technician)</span>
              <span className="font-bold text-slate-900">₹{booking.negotiated_price}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>App Development Fee</span>
              <span className="font-bold text-slate-900">₹{booking.platform_fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Insurance (FixMate Cover)</span>
              <span className="text-green-600 font-bold">FREE</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-3xl font-black text-primary">₹{(booking.negotiated_price + (booking.platform_fee || 0)).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMethod('online')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'online' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="bg-primary/10 p-2 rounded-lg"><IndianRupee className="w-5 h-5 text-primary" /></div>
                <span className="font-bold text-sm">Online Payment</span>
              </button>
              <button 
                onClick={() => setMethod('cod')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="bg-slate-100 p-2 rounded-lg"><Wrench className="w-5 h-5 text-slate-600" /></div>
                <span className="font-bold text-sm">Cash on Delivery</span>
              </button>
            </div>
          </div>

          <button 
            disabled={!method || loading}
            onClick={handlePayment}
            className="w-full btn-primary py-4 text-lg shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (method === 'online' ? 'Pay & Confirm' : 'Confirm Booking')}
          </button>
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (booking?.negotiated_price && !price) {
      setPrice(booking.negotiated_price.toString());
    }
  }, [booking]);

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

  const getPriceRange = (serviceType: string) => {
    if (serviceType === 'AC Repair') return { min: 1000, max: 1500 };
    if (['Electrician', 'Plumber', 'Carpenter', 'Painter'].includes(serviceType)) return { min: 500, max: 1500 };
    if (serviceType === 'Maid') return { min: 500, max: 800 };
    if (['Car Wash', 'Haircut'].includes(serviceType)) return { min: 100, max: 250 };
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`
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

    // 2. Automated Technician Reply (only if customer sends first message or no price set)
    if (user?.role === 'customer' && !booking.negotiated_price) {
      const range = getPriceRange(booking.service_type);
      const prediction = await predictCost(booking.service_type, currentMsg, booking.district);
      
      // Extract numeric value from prediction.estimatedRange (e.g., "₹600 - ₹800" -> 700)
      let suggestedPrice = range.min;
      const matches = prediction.estimatedRange?.match(/\d+/g);
      if (matches && matches.length >= 2) {
        suggestedPrice = Math.floor((parseInt(matches[0]) + parseInt(matches[1])) / 2);
      } else if (matches && matches.length === 1) {
        suggestedPrice = parseInt(matches[0]);
      }
      
      // Clamp to category limits
      suggestedPrice = Math.max(range.min, Math.min(range.max, suggestedPrice));

      const autoReply = `I've analyzed your request. Based on market rates in ${booking.district}, I will charge ₹${suggestedPrice} for this work. This includes labor and basic materials. ${prediction.explanation}`;
      
      // Send automated message from technician (using a special system-like call or just pretending)
      // For this demo, we'll have the server handle "system" messages or just post as technician
      await fetch(`/api/bookings/${id}/messages/auto`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          content: autoReply,
          proposedPrice: suggestedPrice
        })
      });
      
      fetchBooking();
      fetchMessages();
    }
  };

  const confirmPrice = async () => {
    const p = price || booking.negotiated_price || getPriceRange(booking.service_type).min.toString();
    if (!p) return;
    const numericPrice = parseInt(p.toString());
    const range = getPriceRange(booking.service_type);
    
    if (numericPrice < range.min || numericPrice > range.max) {
      return alert(`Price for ${booking.service_type} must be between ₹${range.min} and ₹${range.max}`);
    }

    const isAccepting = !isTechnician && booking.negotiated_price && numericPrice === parseInt(booking.negotiated_price);

    if (isAccepting) {
      setShowCheckout(true);
      return;
    }

    await fetch(`/api/bookings/${id}/negotiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        price: numericPrice,
        confirm: isAccepting || isTechnician // Technician proposing or Customer accepting
      })
    });

    if (isAccepting) {
      alert(`Booking Confirmed at ₹${numericPrice}!`);
      navigate('/book');
    } else if (!isTechnician) {
      // Customer countered, trigger auto-reply
      await fetch(`/api/bookings/${id}/messages/counter-reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ counterPrice: numericPrice })
      });
      alert('Counter Offer Sent');
      fetchBooking();
      fetchMessages();
    } else {
      alert('Proposal Updated');
      fetchBooking();
    }
  };

  const handlePaymentComplete = async (method: 'online' | 'cod') => {
    await fetch(`/api/bookings/${id}/payment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        payment_method: method,
        payment_status: method === 'online' ? 'paid' : 'pending'
      })
    });

    await fetch(`/api/bookings/${id}/negotiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        price: booking.negotiated_price,
        confirm: true
      })
    });

    alert(`Booking Confirmed via ${method.toUpperCase()}!`);
    navigate('/book');
  };

  if (!booking) return <div className="pt-24 text-center">Loading...</div>;

  const isTechnician = user?.role === 'technician';

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50">
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal 
            booking={booking} 
            onClose={() => setShowCheckout(false)} 
            onComplete={handlePaymentComplete} 
          />
        )}
      </AnimatePresence>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[75vh]">
          {/* Header */}
          <div className="bg-primary p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {isTechnician ? `Negotiating with ${booking.customer_name}` : `Negotiating with ${booking.technician_name}`}
              </h2>
              <p className="opacity-90">{booking.service_type} Service in {booking.district}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm">
              Insurance up to ₹5,000 Applied
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-800 text-sm mb-4">
              <p className="font-bold flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4" /> Transparency First
              </p>
              {isTechnician 
                ? "Please understand the customer's issue clearly before setting the final price."
                : "Please explain your issue in detail so the technician can provide an accurate quote."}
            </div>
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl break-words ${m.sender_id === user?.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm'}`}>
                  <p className="text-xs opacity-70 mb-1 font-bold">{m.sender_name}</p>
                  {m.content && <p className="leading-relaxed">{m.content}</p>}
                  {m.attachment_url && (
                    <div className="mt-2">
                      {m.attachment_type === 'image' ? (
                        <img 
                          src={m.attachment_url} 
                          alt="Attachment" 
                          className="max-w-full rounded-lg border border-white/20"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <a 
                          href={m.attachment_url} 
                          download 
                          className={`flex items-center gap-2 p-3 rounded-xl text-sm ${m.sender_id === user?.id ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                          <FileIcon className="w-4 h-4" />
                          <span className="flex-1 truncate">Document Attachment</span>
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            {booking.status === 'confirmed' ? (
              <div className="bg-green-50 p-4 rounded-2xl text-green-800 text-center font-bold">
                Booking Confirmed at ₹{booking.negotiated_price}
              </div>
            ) : (
              <>
                {/* Proposed Price / Counter Offer Box */}
                {(booking.negotiated_price || isTechnician) && (
                  <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                          <IndianRupee className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {booking.negotiated_price ? 'Current Proposal' : 'Initial Proposal'}
                          </p>
                          <p className="text-4xl font-black text-slate-900">
                            ₹{booking.negotiated_price || getPriceRange(booking.service_type).min}
                          </p>
                        </div>
                      </div>
                      {!isTechnician ? (
                        booking.negotiated_price ? (
                          <button onClick={confirmPrice} className="btn-primary w-full sm:w-auto px-8 py-4 shadow-xl shadow-primary/20">
                            Accept & Book Now
                          </button>
                        ) : (
                          <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-sm italic">
                            Waiting for technician's quote...
                          </div>
                        )
                      ) : (
                        booking.negotiated_price ? (
                          <div className="flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-xl border border-primary/10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-wider">Waiting for Customer</span>
                          </div>
                        ) : (
                          <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl border border-secondary/10 text-xs font-bold uppercase">
                            Set Your Price Below
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="pt-6 border-t border-slate-200">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {isTechnician ? (booking.negotiated_price ? 'Update Your Proposal' : 'Propose Your Price') : 'Your Counter Offer'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Range: <span className="font-bold text-slate-700">₹{getPriceRange(booking.service_type).min} - ₹{getPriceRange(booking.service_type).max}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-primary">₹{price || booking.negotiated_price || getPriceRange(booking.service_type).min}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-6">
                        <input 
                          type="range"
                          min={getPriceRange(booking.service_type).min}
                          max={getPriceRange(booking.service_type).max}
                          step="10"
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          value={price || booking.negotiated_price || getPriceRange(booking.service_type).min}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                        <button 
                          onClick={confirmPrice} 
                          className="w-full btn-secondary py-3 font-bold uppercase tracking-widest text-xs"
                        >
                          {isTechnician ? (booking.negotiated_price ? 'Submit New Proposal' : 'Send Initial Quote') : 'Send Counter Offer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {attachment && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    {attachment.type === 'image' ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                        <img src={attachment.url} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <FileIcon className="text-primary w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{attachment.name}</p>
                      <p className="text-xs text-slate-500 uppercase">{attachment.type}</p>
                    </div>
                    <button onClick={() => setAttachment(null)} className="p-2 hover:bg-slate-200 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-4 items-center">
                  <label className="cursor-pointer p-2 sm:p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 flex-shrink-0">
                    <Paperclip className="w-5 h-5 sm:w-6 h-6" />
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  <input 
                    type="text" 
                    placeholder={isTechnician ? "Reply..." : "Explain issue..."}
                    className="flex-1 py-2.5 px-3 sm:px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary shadow-inner text-sm sm:text-base min-w-0"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={sendMessage} className="btn-primary p-2.5 sm:p-3 rounded-xl shadow-lg shadow-primary/20 flex-shrink-0">
                    <MessageSquare className="w-5 h-5 sm:w-6 h-6" />
                  </button>
                </div>
              </>
            )}
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
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Admin Dashboard</h1>
        
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
                      <button onClick={() => verifyTech(t.id)} className="btn-primary text-xs py-1.5 px-3">Verify</button>
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

const AboutPage = () => (
  <div className="pt-24 pb-12 min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 bg-white p-12 rounded-3xl shadow-sm">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary">About FixMate</h1>
      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Empowering Bihar's Service Economy</h2>
          <p className="text-lg leading-relaxed text-slate-600">
            FixMate is Bihar's first smart technician booking platform, designed to bridge the gap between skilled local technicians and households. 
            We believe in transparency, fair bargaining, and the power of local communities.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <ShieldCheck className="text-primary w-5 h-5" /> Verified Professionals
            </h3>
            <p className="text-slate-600">Every technician on our platform undergoes a strict verification process, including ID proof and skill assessment.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <IndianRupee className="text-primary w-5 h-5" /> Fair Bargaining
            </h3>
            <p className="text-slate-600">Our unique negotiation chat allows customers and technicians to reach a mutually beneficial price before the work starts.</p>
          </div>
        </div>

        <section className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
          <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
          <p className="text-slate-700 italic">
            "To create a digital ecosystem where every skilled hand in Bihar finds work, and every household finds a trusted mate for their repairs."
          </p>
          <p className="mt-4 font-bold text-primary">— Anand Amrit Raj, Founder</p>
        </section>
      </div>
    </div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="pt-24 pb-12 min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 bg-white p-12 rounded-3xl shadow-sm">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy & Terms</h1>
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
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState<'customer' | 'technician'>('customer');
  const navigate = useNavigate();

  const districts = ['Patna', 'Purnia', 'Darbhanga', 'Sitamarhi', 'Madhubani', 'Madhepura', 'Katihar', 'Saharsa', 'East Champaran', 'West Champaran', 'Begusarai', 'Barauni'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = type === 'login' 
      ? { email, password } 
      : { name, email, password, role, phone, location, district, id_number: idNumber };
    
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
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md my-12"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
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
                <input 
                  type="text" placeholder="Aadhar Card Number (Mandatory)" required
                  className="w-full py-2.5 px-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                  value={idNumber} onChange={e => setIdNumber(e.target.value)}
                />
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
          <button type="submit" className="w-full btn-primary py-3 mt-4">
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
            <Route path="/about" element={<AboutPage />} />
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
