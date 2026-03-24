import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Clock, Star, User, MapPin, Bell, ChevronRight, Phone, MessageSquare, ShoppingBag, LogOut, Settings, ShieldCheck, Mail, Lock, UserPlus, LogIn, Scissors, Camera, Check, X, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  doc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

// Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      let message = "Мушкилие ба амал омад.";
      try {
        const parsed = JSON.parse(error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          message = "Шумо барои ин амал ҳуқуқ надоред.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-black mb-2">Хатогӣ</h2>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold uppercase text-xs"
          >
            Дубора кӯшиш кунед
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className="relative group">
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-amber-500' : 'text-gray-500 group-hover:text-gray-300'}`}
      >
        <Icon size={24} className={isActive ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''} />
        <span className="text-[10px] mt-1 font-medium tracking-wider uppercase">{label}</span>
        {isActive && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute -inset-1 bg-amber-500/10 blur-lg rounded-full -z-10"
          />
        )}
      </motion.div>
    </Link>
  );
};

const AuthPage = ({ onGuestLogin }: { onGuestLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (password.length < 6) {
      setErrorMsg('Рамз бояд камаш 6 аломат бошад');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Ҳисоб бомуваффақият эҷод шуд!');
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('auth/invalid-credential')) {
        msg = 'Почта ё рамз нодуруст аст. Лутфан дубора санҷед.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'Ин почта аллакай бақайд гирифта шудааст.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Рамз бояд камаш 6 аломат бошад.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md glass rounded-[2.5rem] p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
            <Scissors size={40} className="text-black" />
          </div>
          <h2 className="text-3xl font-black">{isLogin ? 'Хуш омадед' : 'Бақайдгирӣ'}</h2>
          <p className="text-gray-500 text-sm">{isLogin ? 'Барои идома додан ворид шавед' : 'Ҳисоби нав эҷод кунед'}</p>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl text-center font-bold"
          >
            {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="email" 
              placeholder="Почтаи электронӣ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Рамз"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-bold uppercase"
            >
              {showPassword ? 'Пӯшидан' : 'Нишон'}
            </button>
            {!isLogin && <p className="text-[10px] text-gray-600 mt-1 ml-2">Камаш 6 аломат</p>}
          </div>
          <motion.button 
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Боргирӣ...' : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
            {loading ? '' : (isLogin ? 'Ворид шудан' : 'Бақайдгирӣ')}
          </motion.button>
        </form>

        <div className="space-y-4 text-center">
          <motion.button 
            onClick={() => setIsLogin(!isLogin)}
            whileTap={{ scale: 0.95 }}
            className="text-amber-500 text-xs font-bold uppercase tracking-widest"
          >
            {isLogin ? 'Ҳисоб надоред? Бақайдгирӣ' : 'Ҳисоб доред? Ворид шудан'}
          </motion.button>
          
          <div className="pt-4 border-t border-white/5">
            <motion.button 
              onClick={onGuestLogin}
              whileTap={{ scale: 0.95 }}
              className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-amber-500 transition-colors"
            >
              Ҳамчун меҳмон ворид шудан (Guest Mode)
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const user = auth.currentUser;

  const services = [
    { id: 1, name: 'Мӯйсартарошии классикӣ', price: '50 смн', time: '45 дақ', img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400' },
    { id: 2, name: 'Ороиши риш', price: '15 смн', time: '30 дақ', img: 'https://images.unsplash.com/photo-1621605815841-aa88c82b02aa?auto=format&fit=crop&w=400' },
    { id: 3, name: 'Поккории люкс', price: '25 смн', time: '60 дақ', img: 'https://images.unsplash.com/photo-1512690199101-8d8eb8bb995e?auto=format&fit=crop&w=400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col pb-32 relative"
    >
      {/* Header */}
      <header className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100" 
              alt="User" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Хуш омадед</p>
            <h3 className="text-sm font-black tracking-tight">
              {user?.email?.split('@')[0] || 'Мизоҷи Мӯҳтарам'}
            </h3>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5"
        >
          <Bell size={20} className="text-gray-400" />
        </motion.button>
      </header>

      {/* Services - Centered Vertically and Horizontally */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-8 md:mb-12">
            <h4 className="font-black text-2xl md:text-4xl tracking-tighter">Хизматрасониҳои мо</h4>
            <div className="w-12 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          </div>
          
          {/* Mobile: Horizontal Scroll | Desktop: Grid */}
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible scrollbar-hide pb-4 justify-start md:justify-items-center">
            {services.map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-64 md:w-full max-w-sm flex-shrink-0 glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl"
              >
                <div className="h-40 relative">
                  <img 
                    src={service.img} 
                    className="w-full h-full object-cover" 
                    alt={service.name} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-black shadow-lg">
                    {service.price}
                  </div>
                </div>
                <div className="p-6">
                  <h5 className="font-black text-lg mb-1">{service.name}</h5>
                  <p className="text-xs text-gray-500 mb-6 flex items-center gap-1">
                    <Clock size={12} /> {service.time}
                  </p>
                  <Link to="/booking">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-amber-500 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Calendar size={16} />
                      САБТ
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BookingPage = ({ isGuest }: { isGuest: boolean }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 9}:00`);

  useEffect(() => {
    fetchBookedSlots();
  }, [selectedDate]);

  const fetchBookedSlots = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('date', '==', format(selectedDate, 'yyyy-MM-dd'))
      );
      const querySnapshot = await getDocs(q);
      const slots = querySnapshot.docs.map(doc => doc.data().time.slice(0, 5));
      setBookedSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!selectedTime) {
      alert('Лутфан вақтро интихоб кунед');
      return;
    }

    const user = auth.currentUser;
    if (!user && !isGuest) {
      alert('Лутфан барои сабт ворид шавед');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        user_id: user?.uid || 'guest',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: `${selectedTime}:00`,
        service: 'Мӯйсартарошӣ',
        status: 'confirmed',
        createdAt: serverTimestamp()
      });
      alert('Бомуваффақият сабт шуд!');
      navigate('/history');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-32"
    >
      <div className="px-6 pt-12 relative z-10">
        <div className="glass rounded-[2.5rem] p-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-black text-lg">Интихоби сана</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i);
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <motion.button 
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-14 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-900 border-white/5 text-gray-400'}`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-tighter mb-1">{format(date, 'EEE')}</span>
                    <span className="text-lg font-black">{format(date, 'd')}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="font-black text-lg">Вақтҳои холӣ</h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map(time => {
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;
                return (
                  <motion.button
                    key={time}
                    whileTap={!isBooked ? { scale: 0.95 } : {}}
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl border font-bold text-xs transition-all ${isBooked ? 'bg-gray-900 border-transparent text-gray-700 cursor-not-allowed' : isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-gray-900 border-white/5 text-white hover:border-amber-500/50'}`}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBooking}
          disabled={loading}
          className="w-full bg-amber-500 text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 disabled:opacity-50"
        >
          {loading ? 'Боргирӣ...' : 'Тасдиқи сабт'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const HistoryPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, 'appointments'),
            where('user_id', '==', user.uid),
            orderBy('date', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAppointments(data);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'appointments');
        }
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32">
      <h2 className="text-2xl font-black mb-6">Таърихи ташрифҳо</h2>
      {loading ? (
        <p className="text-gray-500">Боргирӣ...</p>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map(app => (
            <div key={app.id} className="glass rounded-2xl p-4 border-white/5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">Мӯйсартарошӣ</h4>
                <span className="text-[10px] bg-gray-800 px-2 py-1 rounded-lg text-gray-400 uppercase">Тасдиқ шуд</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Calendar size={12} /> {app.date}</div>
                <div className="flex items-center gap-1"><Clock size={12} /> {app.time}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Шумо то ҳол сабт надоред.</p>
      )}
    </motion.div>
  );
};

const ReviewsPage = () => {
  const reviews = [
    { id: 1, user: 'Фирдавс', rating: 5, comment: 'Беҳтарин барбер дар шаҳр!', date: '2 рӯз пеш' },
    { id: 2, user: 'Суҳроб', rating: 4, comment: 'Хизматрасонӣ хуб аст, тавсия медиҳам.', date: '1 ҳафта пеш' },
    { id: 3, user: 'Алишер', rating: 5, comment: 'Дасти Муҳаммад тилло аст!', date: '3 рӯз пеш' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
      {/* Stylist Profile Header */}
      <div className="relative h-80 mb-8">
        <img 
          src="https://i.imgur.com/nbxhPa1.jpg" 
          className="w-full h-full object-cover"
          alt="Muhammad"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className="text-4xl font-black tracking-tight">Муҳаммад</h2>
              <motion.a 
                href="https://t.me/km_agammed_005"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-[#0088cc] p-2 rounded-xl text-white shadow-lg shadow-[#0088cc]/20 flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                </svg>
              </motion.a>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-400">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-white">4.7</span>
              </div>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <div>128 Мизоҷон</div>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <div className="text-amber-500">Pro Barber</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          Шарҳҳои мизоҷон
          <span className="text-xs bg-white/5 px-2 py-1 rounded-lg text-gray-500">{reviews.length}</span>
        </h3>
        
        <div className="space-y-4">
          {reviews.map((rev, idx) => (
            <motion.div 
              key={rev.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-3xl p-5 border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-all" />
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base mb-1">{rev.user}</h4>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < rev.rating ? "text-amber-500 fill-amber-500" : "text-gray-700"} 
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{rev.date}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{rev.comment}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ProfilePage = ({ onLogout }: { onLogout: () => void }) => {
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || user?.email?.split('@')[0] || 'Мизоҷи Мӯҳтарам');
  const [avatar, setAvatar] = useState(user?.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: avatar
      });
      setIsEditing(false);
      alert('Танзимот захира шуд!');
    } catch (error: any) {
      alert('Хатогӣ ҳангоми захира: ' + error.message);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-2 border-amber-500 p-1 mb-4 overflow-hidden">
            <img 
              src={avatar} 
              className="w-full h-full object-cover rounded-full" 
              alt="Profile" 
              referrerPolicy="no-referrer"
            />
          </div>
          {isEditing && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-0 bg-amber-500 text-black p-2 rounded-full shadow-lg border-2 border-[#0a0a0a]"
            >
              <Camera size={16} />
            </motion.button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {isEditing ? (
          <div className="w-full max-w-xs space-y-2">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-center font-bold focus:border-amber-500 outline-none"
              placeholder="Номи шумо"
            />
            <div className="flex gap-2">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Check size={16} /> {loading ? '...' : 'Захира'}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-800 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <X size={16} /> Бекор
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black">{name}</h2>
            <p className="text-gray-500 text-sm">{user?.email || 'customer@example.com'}</p>
          </>
        )}
      </div>

      <div className="space-y-3">
        {!isEditing && (
          <motion.button 
            onClick={() => setIsEditing(true)}
            whileTap={{ scale: 0.98 }}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-gray-400" />
              <span className="text-sm font-bold">Танзимот</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </motion.button>
        )}
        
        <motion.button 
          onClick={onLogout}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-red-500/10 text-red-500 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mt-6"
        >
          <LogOut size={18} />
          Баромад
        </motion.button>
      </div>
    </motion.div>
  );
};

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-amber-500">Боргирӣ...</div>;

  if (!user && !isGuest) return <AuthPage onGuestLogin={() => setIsGuest(true)} />;

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
    } else {
      await signOut(auth);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Global Background Image */}
      <div className="fixed inset-0 -z-10 opacity-25 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920" 
          className="w-full h-full object-cover" 
          alt="Background"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage isGuest={isGuest} />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/profile" element={<ProfilePage onLogout={handleLogout} />} />
        </Routes>
      </AnimatePresence>

      <nav className="fixed bottom-6 left-6 right-6 glass rounded-[2.5rem] p-2 flex justify-around items-center z-50 shadow-2xl border-white/10">
        <NavItem to="/" icon={Home} label="Асосӣ" />
        <NavItem to="/booking" icon={Calendar} label="Сабт" />
        <NavItem to="/history" icon={Clock} label="Таърих" />
        <NavItem to="/reviews" icon={Star} label="Шарҳҳо" />
        <NavItem to="/profile" icon={User} label="Профил" />
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}
