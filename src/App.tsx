import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Clock, Star, User, MapPin, Bell, ChevronRight, Phone, MessageSquare, ShoppingBag, LogOut, Settings, ShieldCheck, Mail, Lock, UserPlus, LogIn, Scissors, Camera, Check, X, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';
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
  updateDoc,
  deleteDoc,
  onSnapshot,
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
      return (
        <LanguageContextConsumer>
          {(t) => {
            let message = t('errorOccurred');
            try {
              const parsed = JSON.parse(error?.message || "");
              if (parsed.error && parsed.error.includes("insufficient permissions")) {
                message = t('noPermission');
              }
            } catch (e) {
              // Not a JSON error
            }

            return (
              <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-black mb-2">{t('error')}</h2>
                <p className="text-gray-500 text-sm mb-6">{message}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold uppercase text-xs"
                >
                  {t('tryAgain')}
                </button>
              </div>
            );
          }}
        </LanguageContextConsumer>
      );
    }

    return (this as any).props.children;
  }
}

const LanguageContextConsumer = ({ children }: { children: (t: (key: string) => string) => React.ReactNode }) => {
  const { t } = useLanguage();
  return <>{children(t as any)}</>;
};

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
  const { t } = useLanguage();
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
      setErrorMsg(t('passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert(t('accountCreated'));
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('auth/invalid-credential')) {
        msg = t('invalidCreds');
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = t('emailInUse');
      } else if (msg.includes('auth/weak-password')) {
        msg = t('passwordMinLength');
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
          <h2 className="text-3xl font-black">{isLogin ? t('welcome') : t('register')}</h2>
          <p className="text-gray-500 text-sm">{isLogin ? t('loginToContinue') : t('createNewAccount')}</p>
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
              placeholder={t('email')}
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
              placeholder={t('password')}
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
              {showPassword ? t('hide') : t('show')}
            </button>
            {!isLogin && <p className="text-[10px] text-gray-600 mt-1 ml-2">{t('passwordMinLength')}</p>}
          </div>
          <motion.button 
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 neon-btn"
          >
            {loading ? t('loading') : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
            {loading ? '' : (isLogin ? t('login') : t('register'))}
          </motion.button>
        </form>

        <div className="space-y-4 text-center">
          <motion.button 
            onClick={() => setIsLogin(!isLogin)}
            whileTap={{ scale: 0.95 }}
            className="text-amber-500 text-xs font-bold uppercase tracking-widest"
          >
            {isLogin ? t('noAccount') : t('hasAccount')}
          </motion.button>
          
          <div className="pt-4 border-t border-white/5">
            <motion.button 
              onClick={onGuestLogin}
              whileTap={{ scale: 0.95 }}
              className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-amber-500 transition-colors"
            >
              {t('continueAsGuest')}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage = ({ services }: { services: any[] }) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const defaultServices = [
    { id: 'def1', name: t('classicHaircut'), price: `50 ${t('somoni')}`, time: `45 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=cae4b0b393ea9aea6cb8935142e12b8ba3f537dc-5354513-images-thumbs&n=13' },
    { id: 'def2', name: t('beardTrim'), price: `15 ${t('somoni')}`, time: `30 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=fe33fcdaec438db37dd053f216a42e5db8512e88-5578930-images-thumbs&n=13' },
    { id: 'def3', name: t('luxuryGrooming'), price: `25 ${t('somoni')}`, time: `60 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=8ef5cc6e0493c0cc51c6ecca2412c41ff2e13c41-12603899-images-thumbs&n=13' },
  ];

  const displayServices = [...defaultServices, ...services];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col pb-32 relative"
    >
      {/* Header */}
      <header className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/profile')}
        >
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5 overflow-hidden">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="User" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={20} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('welcome')}</p>
            <h3 className="text-sm font-black tracking-tight">
              {user?.email?.split('@')[0] || t('guest')}
            </h3>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/history')}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5 neon-btn relative"
        >
          <Bell size={20} className="text-gray-400" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-gray-800"></div>
        </motion.button>
      </header>

      {/* Services - Centered Vertically and Horizontally */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-8 md:mb-12">
            <h4 className="font-black text-2xl md:text-4xl tracking-tighter">{t('services')}</h4>
            <div className="w-12 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          </div>
          
          {/* Mobile: Horizontal Scroll | Desktop: Grid */}
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible scrollbar-hide pb-4 justify-start md:justify-items-center">
            {displayServices.map((service) => (
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
                      className="w-full bg-amber-500 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 neon-btn"
                    >
                      <Calendar size={16} />
                      {t('booking')}
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
  const { t } = useLanguage();
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
      alert(t('selectTime'));
      return;
    }

    const user = auth.currentUser;
    if (!user && !isGuest) {
      alert(t('loginToContinue'));
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        user_id: user?.uid || 'guest',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: `${selectedTime}:00`,
        service: t('haircut'),
        status: 'confirmed',
        createdAt: serverTimestamp()
      });
      alert(t('bookingSuccess'));
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
            <h3 className="font-black text-lg">{t('selectDate')}</h3>
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
            <h3 className="font-black text-lg">{t('selectTime')}</h3>
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
          className="w-full bg-amber-500 text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 disabled:opacity-50 neon-btn"
        >
          {loading ? t('loading') : t('confirm')}
        </motion.button>
      </div>
    </motion.div>
  );
};

const HistoryPage = ({ isAdmin }: { isAdmin: boolean }) => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = isAdmin 
            ? query(collection(db, 'appointments'), orderBy('date', 'desc'))
            : query(
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
  }, [isAdmin]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === 'completed' ? 'confirmed' : 'completed';
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appointments');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32">
      <h2 className="text-2xl font-black mb-6">{isAdmin ? t('bookingHistory') : t('history')}</h2>
      {loading ? (
        <p className="text-gray-500">{t('loading')}</p>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map(app => (
            <div key={app.id} className="glass rounded-2xl p-4 border-white/5 relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{app.service || t('haircut')}</h4>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button 
                      onClick={() => toggleStatus(app.id, app.status)}
                      className={`p-1 rounded-md transition-all ${app.status === 'completed' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-500'}`}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded-lg uppercase ${app.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                    {app.status === 'completed' ? t('completed') : t('confirmed')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Calendar size={12} /> {app.date}</div>
                <div className="flex items-center gap-1"><Clock size={12} /> {app.time}</div>
              </div>
              {isAdmin && app.user_id !== 'guest' && (
                <p className="text-[10px] text-gray-600 mt-2">UID: {app.user_id}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{t('noBookings')}</p>
      )}
    </motion.div>
  );
};

const ReviewsPage = () => {
  const { t } = useLanguage();
  const reviews = [
    { id: 1, user: 'Фирдавс', rating: 5, comment: t('bestBarber'), date: `2 ${t('daysAgo')}` },
    { id: 2, user: 'Суҳроб', rating: 4, comment: t('goodService'), date: `1 ${t('weeksAgo')}` },
    { id: 3, user: 'Алишер', rating: 5, comment: t('goldenHands'), date: `3 ${t('daysAgo')}` },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
      {/* Stylist Profile Header */}
      <div className="relative h-80 mb-8">
        <img 
          src="https://i.postimg.cc/gj0JMvBW/photo-2026-03-24-05-38-11.jpg" 
          className="w-full h-full object-cover"
          alt="Muhammad"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-black tracking-tight">Muhammad</h2>
              <motion.a 
                href="https://t.me/km_agammed_005"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-[#0088cc] p-1.5 rounded-lg text-white shadow-lg shadow-[#0088cc]/20 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                </svg>
              </motion.a>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <div className="flex items-center gap-1">
                <Star size={10} className="text-amber-500 fill-amber-500" />
                <span className="text-white">4.7</span>
              </div>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <div>128 {t('clients')}</div>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <div className="text-amber-500">Pro Barber</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          {t('reviews')}
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

const ProfilePage = ({ onLogout, isAdmin }: { onLogout: () => void; isAdmin: boolean }) => {
  const { t, language, setLanguage } = useLanguage();
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || user?.email?.split('@')[0] || t('guest'));
  const [avatar, setAvatar] = useState(user?.photoURL || "");
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
      alert(t('settings') + ' ' + t('confirm'));
    } catch (error: any) {
      alert(t('error') + ': ' + error.message);
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

  const toggleLanguage = () => {
    setLanguage(language === 'tg' ? 'ru' : 'tg');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-2 border-amber-500 p-1 mb-4 overflow-hidden flex items-center justify-center bg-gray-900">
            {avatar ? (
              <img 
                src={avatar} 
                className="w-full h-full object-cover rounded-full" 
                alt="Profile" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={40} className="text-gray-700" />
            )}
          </div>
          {isEditing && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-0 bg-amber-500 text-black p-2 rounded-full shadow-lg border-2 border-[#0a0a0a] neon-btn"
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
              placeholder={t('name')}
            />
            <div className="flex gap-2">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 neon-btn"
              >
                <Check size={16} /> {loading ? '...' : t('confirm')}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-800 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 neon-btn"
              >
                <X size={16} /> {t('cancel')}
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
        {isAdmin && (
          <Link to="/admin">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all mb-3 neon-btn"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-amber-500" />
                <span className="text-sm font-bold">{t('adminPanel')}</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </motion.button>
          </Link>
        )}

        {!isEditing && (
          <motion.button 
            onClick={() => setIsEditing(true)}
            whileTap={{ scale: 0.98 }}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all neon-btn"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-gray-400" />
              <span className="text-sm font-bold">{t('settings')}</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </motion.button>
        )}

        <motion.button 
          onClick={toggleLanguage}
          whileTap={{ scale: 0.98 }}
          className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all neon-btn"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌐</span>
            <span className="text-sm font-bold">{t('changeLanguage')}</span>
          </div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            {language === 'tg' ? t('tajik') : t('russian')}
          </span>
        </motion.button>
        
        <motion.button 
          onClick={onLogout}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-red-500/10 text-red-500 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mt-6 neon-btn"
        >
          <LogOut size={18} />
          {t('logout')}
        </motion.button>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ services }: { services: any[] }) => {
  const { t } = useLanguage();
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceTime, setNewServiceTime] = useState('');
  const [newServiceImg, setNewServiceImg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'services'), {
        name: newServiceName,
        price: newServicePrice,
        time: newServiceTime,
        img: newServiceImg || 'https://avatars.mds.yandex.net/i?id=cae4b0b393ea9aea6cb8935142e12b8ba3f537dc-5354513-images-thumbs&n=13',
        createdAt: serverTimestamp()
      });
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceTime('');
      setNewServiceImg('');
      alert(t('addService') + ' ' + t('confirm'));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'services');
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewServiceImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (id.startsWith('def')) {
      alert(t('cannotDeleteMainService'));
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'services');
    }
  };

  const defaultServices = [
    { id: 'def1', name: t('classicHaircut'), price: `50 ${t('somoni')}`, time: `45 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=cae4b0b393ea9aea6cb8935142e12b8ba3f537dc-5354513-images-thumbs&n=13' },
    { id: 'def2', name: t('beardTrim'), price: `15 ${t('somoni')}`, time: `30 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=fe33fcdaec438db37dd053f216a42e5db8512e88-5578930-images-thumbs&n=13' },
    { id: 'def3', name: t('luxuryGrooming'), price: `25 ${t('somoni')}`, time: `60 ${t('min')}`, img: 'https://avatars.mds.yandex.net/i?id=8ef5cc6e0493c0cc51c6ecca2412c41ff2e13c41-12603899-images-thumbs&n=13' },
  ];

  const allServices = [...defaultServices, ...services];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32">
      <h2 className="text-2xl font-black mb-6">{t('adminPanel')}</h2>
      
      <div className="glass rounded-3xl p-6 mb-8">
        <h3 className="font-bold mb-4">{t('addService')}</h3>
        <form onSubmit={handleAddService} className="space-y-3">
          <input 
            type="text" 
            placeholder={t('name')} 
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" 
              placeholder={t('price')} 
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
              required
            />
            <input 
              type="text" 
              placeholder={t('time')} 
              value={newServiceTime}
              onChange={(e) => setNewServiceTime(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {newServiceImg ? (
                <img src={newServiceImg} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <Camera size={24} className="text-gray-700" />
              )}
            </div>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-600"
              accept="image/*"
            />
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full bg-amber-500 text-black py-3 rounded-xl font-bold uppercase text-xs tracking-widest neon-btn"
          >
            {loading ? t('loading') : t('add')}
          </motion.button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold mb-2">{t('services')}</h3>
        {allServices.map(service => (
          <div key={service.id} className="glass rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={service.img} className="w-12 h-12 rounded-xl object-cover" alt="" />
              <div>
                <h4 className="font-bold text-sm">{service.name}</h4>
                <p className="text-[10px] text-gray-500">{service.price} • {service.time}</p>
                {service.id.startsWith('def') && <span className="text-[8px] text-amber-500 uppercase font-black">{t('main')}</span>}
              </div>
            </div>
            <button 
              onClick={() => handleDeleteService(service.id)}
              className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

function AppContent() {
  const { t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const email = user.email?.toLowerCase();
        setIsAdmin(email === 'muhammad@gmail.com' || email === 'xvlne2005@gmail.com');
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Listen to services
    const servicesUnsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(data);
    });

    return () => {
      unsubscribe();
      servicesUnsubscribe();
    };
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-amber-500">{t('loading')}</div>;

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
      {/* Background Accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<ReviewsPage />} />
          <Route path="/services" element={<HomePage services={services} />} />
          <Route path="/booking" element={<BookingPage isGuest={isGuest} />} />
          <Route path="/history" element={<HistoryPage isAdmin={isAdmin} />} />
          <Route path="/profile" element={<ProfilePage onLogout={handleLogout} isAdmin={isAdmin} />} />
          {isAdmin && <Route path="/admin" element={<AdminDashboard services={services} />} />}
        </Routes>
      </AnimatePresence>

      <nav className="fixed bottom-6 left-6 right-6 glass rounded-[2.5rem] p-2 flex justify-around items-center z-50 shadow-2xl border-white/10">
        <NavItem to="/" icon={Star} label={t('reviews')} />
        <NavItem to="/services" icon={Scissors} label={t('services')} />
        <NavItem to="/booking" icon={Calendar} label={t('booking')} />
        <NavItem to="/history" icon={Clock} label={t('history')} />
        <NavItem to="/profile" icon={User} label={t('profile')} />
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
