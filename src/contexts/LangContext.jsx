import { createContext, useContext, useEffect, useState } from 'react'

const translations = {
  en: {
    home: 'Home', courses: 'Courses', library: 'Library', pomodoro: 'Pomodoro',
    calculator: 'Calculator', faq: 'FAQ', 'get-started': 'Get Started',
    'how-it-works': 'How it works', 'search-placeholder': 'resumes, flash cards, books...',
    'hero-title': 'Your All-in-One Mentor for an Easier BAC !',
    'search-title': 'Start looking now through our vast library!',
    'search-btn': 'Search', 'why-us': 'Why you have to choose us?',
    sources: 'Sources', efficiency: 'Efficiency', 'less-work': 'Less Work', progress: 'Progress',
    'exit-admin': 'Exit Admin', 'focus-timer': 'Focus Timer',
    'short-break': 'Short Break', 'long-break': 'Long Break',
    'add-task': 'Add a new task', results: 'Results',
    passed: '🎉 Passed', failed: '❌ Failed',
    calculate: 'Calculate', assessment: 'Assessment',
    flashcards: 'Flashcards', resources: 'Resources',
    welcome: 'Welcome Back,', 'todo-list': 'To-Do List',
    teachers: 'Teachers', 'contact-us': 'Contact us', 'register-now': 'Register now',
    games: 'Games', saves: 'Saves', quizzes: 'Quizzes', resumes: 'Resumes',
    browse: 'browse', 'my-library': 'My Library'
  },
  ar: {
    home: 'الرئيسية', courses: 'الدورات', library: 'المكتبة', pomodoro: 'بومودورو',
    calculator: 'الحاسبة', faq: 'الأسئلة الشائعة', 'get-started': 'ابدأ الآن',
    'how-it-works': 'كيف يعمل؟', 'search-placeholder': 'ملخصات، بطاقات تعليمية، كتب...',
    'hero-title': 'مرشدك الشامل لبكالوريا أسهل!',
    'search-title': 'ابدأ البحث الآن في مكتبتنا الواسعة!',
    'search-btn': 'بحث', 'why-us': 'لماذا تختارنا؟',
    sources: 'المصادر', efficiency: 'الكفاءة', 'less-work': 'جهد أقل', progress: 'التقدم',
    'exit-admin': 'خروج من الإدارة', 'focus-timer': 'وقت التركيز',
    'short-break': 'استراحة قصيرة', 'long-break': 'استراحة طويلة',
    'add-task': 'إضافة مهمة جديدة', results: 'النتائج',
    passed: '🎉 ناجح', failed: '❌ راسب',
    calculate: 'احسب المعدل', assessment: 'تقييم',
    flashcards: 'بطاقات مراجعة', resources: 'مصادر',
    welcome: 'مرحباً بعودتك،', 'todo-list': 'قائمة المهام',
    teachers: 'الأساتذة', 'contact-us': 'اتصل بنا', 'register-now': 'سجل الآن',
    games: 'ألعاب', saves: 'المحفوظات', quizzes: 'اختبارات', resumes: 'ملخصات',
    browse: 'تصفح', 'my-library': 'مكتبتي'
  }
}

const LangContext = createContext({ lang: 'en', t: (k) => k, toggle: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ezbac_lang') || 'en')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('ezbac_lang', lang)
  }, [lang])

  const t = (key) => (translations[lang] && translations[lang][key]) || key
  const toggle = () => setLang((p) => (p === 'en' ? 'ar' : 'en'))

  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
