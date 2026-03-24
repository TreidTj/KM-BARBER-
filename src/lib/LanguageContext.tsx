import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'tg' | 'ru';

interface Translations {
  [key: string]: {
    tg: string;
    ru: string;
  };
}

export const translations: Translations = {
  errorOccurred: { tg: "Мушкилие ба амал омад.", ru: "Произошла ошибка." },
  noPermission: { tg: "Шумо барои ин амал ҳуқуқ надоред.", ru: "У вас нет прав для этого действия." },
  error: { tg: "Хатогӣ", ru: "Ошибка" },
  tryAgain: { tg: "Дубора кӯшиш кунед", ru: "Попробовать снова" },
  main: { tg: "Асосӣ", ru: "Главная" },
  services: { tg: "Хизматҳо", ru: "Услуги" },
  booking: { tg: "Сабт", ru: "Запись" },
  history: { tg: "Таърих", ru: "История" },
  profile: { tg: "Профил", ru: "Профиль" },
  passwordMinLength: { tg: "Рамз бояд камаш 6 аломат бошад", ru: "Пароль должен быть не менее 6 символов" },
  accountCreated: { tg: "Ҳисоб бомуваффақият эҷод шуд!", ru: "Аккаунт успешно создан!" },
  invalidCreds: { tg: "Почта ё рамз нодуруст аст. Лутфан дубора санҷед.", ru: "Неверная почта или пароль. Пожалуйста, попробуйте снова." },
  emailInUse: { tg: "Ин почта аллакай бақайд гирифта шудааст.", ru: "Эта почта уже зарегистрирована." },
  welcome: { tg: "Хуш омадед", ru: "Добро пожаловать" },
  register: { tg: "Бақайдгирӣ", ru: "Регистрация" },
  loginToContinue: { tg: "Барои идома додан ворид шавед", ru: "Войдите, чтобы продолжить" },
  createNewAccount: { tg: "Ҳисоби нав эҷод кунед", ru: "Создайте новый аккаунт" },
  email: { tg: "Почтаи электронӣ", ru: "Электронная почта" },
  password: { tg: "Рамз", ru: "Пароль" },
  login: { tg: "Воридшавӣ", ru: "Войти" },
  continueAsGuest: { tg: "Давом додан ҳамчун меҳмон", ru: "Продолжить как гость" },
  noAccount: { tg: "Ҳисоб надоред? Бақайдгирӣ", ru: "Нет аккаунта? Регистрация" },
  hasAccount: { tg: "Аллакай ҳисоб доред? Воридшавӣ", ru: "Уже есть аккаунт? Войти" },
  barber: { tg: "Барбер", ru: "Барбер" },
  rating: { tg: "Баҳогузорӣ", ru: "Рейтинг" },
  reviews: { tg: "Шарҳҳо", ru: "Отзывы" },
  writeReview: { tg: "Навиштани шарҳ", ru: "Написать отзыв" },
  rate: { tg: "Баҳогузорӣ кунед", ru: "Оцените" },
  writeYourReview: { tg: "Шарҳи худро нависед...", ru: "Напишите ваш отзыв..." },
  send: { tg: "Фиристодан", ru: "Отправить" },
  cancel: { tg: "Бекор кардан", ru: "Отмена" },
  reviewSuccess: { tg: "Шарҳи шумо бо муваффақият илова шуд!", ru: "Ваш отзыв успешно добавлен!" },
  addService: { tg: "Иловаи хизматрасонӣ", ru: "Добавить услугу" },
  name: { tg: "Ном", ru: "Название" },
  price: { tg: "Нарх", ru: "Цена" },
  time: { tg: "Вақт", ru: "Время" },
  imageURL: { tg: "Расм (URL)", ru: "Картинка (URL)" },
  add: { tg: "Илова кардан", ru: "Добавить" },
  selectService: { tg: "Интихоби хизматрасонӣ", ru: "Выберите услугу" },
  selectDate: { tg: "Интихоби сана", ru: "Выберите дату" },
  selectTime: { tg: "Интихоби вақт", ru: "Выберите время" },
  confirm: { tg: "Тасдиқ", ru: "Подтвердить" },
  bookingSuccess: { tg: "Сабти шумо бо муваффақият анҷом ёфт!", ru: "Вы успешно записаны!" },
  bookingHistory: { tg: "Таърихи сабтҳо", ru: "История записей" },
  activeBookings: { tg: "Сабтҳои фаъол", ru: "Активные записи" },
  pastBookings: { tg: "Сабтҳои гузашта", ru: "Прошедшие записи" },
  noBookings: { tg: "Шумо то ҳол сабт надоред.", ru: "У вас пока нет записей." },
  settings: { tg: "Танзимот", ru: "Настройки" },
  language: { tg: "Забон", ru: "Язык" },
  logout: { tg: "Баромадан", ru: "Выйти" },
  guest: { tg: "Меҳмон", ru: "Гость" },
  adminPanel: { tg: "Панели админ", ru: "Панель админа" },
  delete: { tg: "Нест кардан", ru: "Удалить" },
  loading: { tg: "Боргирӣ...", ru: "Загрузка..." },
  changeLanguage: { tg: "Иваз кардани забон", ru: "Смена языка" },
  tajik: { tg: "Тоҷикӣ", ru: "Таджикский" },
  russian: { tg: "Русский", ru: "Русский" },
  admin: { tg: "Админ", ru: "Админ" },
  today: { tg: "Имрӯз", ru: "Сегодня" },
  tomorrow: { tg: "Фардо", ru: "Завтра" },
  dayAfterTomorrow: { tg: "Пасфардо", ru: "Послезавтра" },
  showAll: { tg: "Ҳамаро дидан", ru: "Показать все" },
  hide: { tg: "Пинҳон кардан", ru: "Скрыть" },
  experience: { tg: "Таҷриба", ru: "Опыт" },
  years: { tg: "сол", ru: "лет" },
  clients: { tg: "Мизоҷон", ru: "Клиенты" },
  portfolio: { tg: "Портфолио", ru: "Портфолио" },
  addPhoto: { tg: "Иловаи расм", ru: "Добавить фото" },
  deletePhoto: { tg: "Нест кардани расм", ru: "Удалить фото" },
  cannotDeleteMainService: { tg: "Ин хизматрасонии асосӣ аст ва онро нест кардан мумкин нест. Шумо метавонед хизматрасониҳои худро илова кунед.", ru: "Это основная услуга, и ее нельзя удалить. Вы можете добавить свои собственные услуги." },
  show: { tg: "Нишон", ru: "Показать" },
  haircut: { tg: "Мӯйсартарошӣ", ru: "Стрижка" },
  completed: { tg: "Иҷро шуд", ru: "Выполнено" },
  confirmed: { tg: "Тасдиқ шуд", ru: "Подтверждено" },
  classicHaircut: { tg: "Мӯйсартарошии классикӣ", ru: "Классическая стрижка" },
  beardTrim: { tg: "Ороиши риш", ru: "Оформление бороды" },
  luxuryGrooming: { tg: "Поккории люкс", ru: "Люкс уход" },
  min: { tg: "дақ", ru: "мин" },
  somoni: { tg: "смн", ru: "смн" },
  daysAgo: { tg: "рӯз пеш", ru: "дней назад" },
  weeksAgo: { tg: "ҳафта пеш", ru: "неделю назад" },
  bestBarber: { tg: "Беҳтарин барбер дар шаҳр!", ru: "Лучший барбер в городе!" },
  goodService: { tg: "Хизматрасонӣ хуб аст, тавсия медиҳам.", ru: "Хорошее обслуживание, рекомендую." },
  goldenHands: { tg: "Дасти Муҳаммад тилло аст!", ru: "У Мухаммада золотые руки!" }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: keyof typeof translations) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
