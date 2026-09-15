import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Supported languages. `ar` is the only RTL language. English is the fallback
// for any missing key so the UI never renders a raw key.
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' }
]

const RTL_LANGS = ['ar']

const translations = {
  en: {
    // ── Nav / general ──
    home: 'Home', courses: 'Courses', library: 'Library', pomodoro: 'Pomodoro',
    calculator: 'Calculator', faq: 'FAQ', games: 'Games', 'get-started': 'Get Started',
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
    // ── Common ──
    loading: 'Loading…', save: 'Save', saving: 'Saving…', cancel: 'Cancel',
    'continue': 'Continue', retry: 'Retry', close: 'Close', 'sign-out': 'Sign out',
    'sign-in': 'Sign in', 'sign-up': 'Sign up', dashboard: 'Dashboard', admin: 'Admin',
    profile: 'Profile', settings: 'Settings', support: 'Support', required: 'Required',
    optional: 'Optional', 'theme-toggle': 'Toggle theme', language: 'Language',
    // ── Auth ──
    'auth-login-title': 'Welcome back',
    'auth-login-subtitle': 'Sign in to continue your BAC journey.',
    'auth-register-title': 'Create your account',
    'auth-register-subtitle': 'Join EZBAC and study smarter.',
    'auth-email': 'Email', 'auth-password': 'Password',
    'auth-confirm-password': 'Confirm password', 'auth-name': 'Full name',
    'auth-google': 'Continue with Google', 'auth-or': 'or',
    'auth-have-account': 'Already have an account?',
    'auth-no-account': "Don't have an account?",
    'auth-forgot': 'Forgot password?',
    'auth-reset-sent': 'Password reset email sent. Check your inbox.',
    'auth-login-cta': 'Sign in', 'auth-register-cta': 'Create account',
    'auth-back-home': 'Back to home',
    // ── Onboarding / profile ──
    'onboarding-title': 'Complete your profile',
    'onboarding-subtitle': 'Tell us your Wilaya and BAC stream to unlock content made for you.',
    'onboarding-wilaya': 'Wilaya', 'onboarding-wilaya-ph': 'Select your Wilaya',
    'onboarding-stream': 'BAC Stream', 'onboarding-stream-ph': 'Select your stream',
    'onboarding-finish': 'Finish & continue',
    'onboarding-why': 'Your stream decides which courses, quizzes and resources you see.',
    'profile-incomplete': 'Complete your profile to continue',
    // ── Errors ──
    'err-generic': 'Something went wrong. Please try again.',
    'err-network': 'Network error. Check your connection and retry.',
    'err-permission': "You don't have permission to do that.",
    'err-invalid-email': 'Please enter a valid email address.',
    'err-weak-password': 'Password must be at least 6 characters.',
    'err-password-match': 'Passwords do not match.',
    'err-wrong-credentials': 'Incorrect email or password.',
    'err-email-in-use': 'This email is already registered.',
    'err-popup-closed': 'Sign-in was cancelled.',
    'err-required-fields': 'Please fill in all required fields.',
    'not-found-title': 'Page not found',
    'not-found-cta': 'Go home',
    // ── Student dashboard / library / features ──
    'nav-progress': 'Progress', 'nav-plans': 'Study Plans', 'nav-favorites': 'Favorites',
    'continue-studying': 'Continue Studying', 'todays-plan': "Today's Study Plan",
    'your-progress': 'Your Progress', 'quick-access': 'Quick Access', 'recent-activity': 'Recent Activity',
    overall: 'Overall', subjects: 'Subjects', units: 'Units', lessons: 'Lessons', summaries: 'Summaries',
    'video-courses': 'Video Courses', quizzes: 'Quizzes', content: 'Content', 'all': 'All',
    search: 'Search', start: 'Start', favorite: 'Save', saved: 'Saved', complete: 'complete',
    best: 'Best', questions: 'questions', 'view-plan': 'View Study Plan', 'tasks-done': '{done} / {total} completed',
    'no-subjects-title': 'No subjects yet', 'no-subjects-desc': 'Subjects for your stream will appear here once published.',
    'no-content-title': 'Nothing here yet', 'no-content-desc': 'No content has been published for this unit yet.',
    'no-favorites-title': 'No favorites yet', 'no-favorites-desc': 'Save useful lessons, resources, quizzes and flashcards for later.',
    'explore-library': 'Explore Library', 'no-plans-title': 'No study plan yet',
    'no-plans-desc': 'Create a study plan to organize your BAC revision.', 'create-study-plan': 'Create Study Plan',
    'no-progress-title': 'Start studying', 'no-progress-desc': 'Your progress will appear here as you complete lessons, quizzes and flashcards.',
    'open-library': 'Open Library',
    'coming-soon': 'Coming soon', back: 'Back', 'available': 'available',
    'switch-to-admin': 'Switch to Admin dashboard',
    // ── Admin / teachers ──
    teachers: 'Teachers', 'nav-teachers': 'Teachers', following: 'Following', follow: 'Follow',
    'admin-students': 'Students', 'total-students': 'Total Students', 'new-this-week': 'New This Week',
    'profile-completion': 'Profile Completion', 'by-stream': 'By Stream', student: 'Student',
    wilaya: 'Wilaya', joined: 'Joined', 'last-active': 'Last active', never: 'Never',
    'search-students': 'Search by name or email…', 'all-streams': 'All streams',
    'status-complete': 'Complete', 'status-incomplete': 'Incomplete', enable: 'Enable', disable: 'Disable',
    disabled: 'Disabled', active: 'Active', 'no-students-found': 'No students match your filters.',
    'account-disabled-title': 'Account disabled', 'account-disabled-desc': 'Your account has been disabled by an administrator. Contact support if you believe this is a mistake.',
    favorites: 'Favorites'
  },
  fr: {
    home: 'Accueil', courses: 'Cours', library: 'Bibliothèque', pomodoro: 'Pomodoro',
    calculator: 'Calculatrice', faq: 'FAQ', games: 'Jeux', 'get-started': 'Commencer',
    'how-it-works': 'Comment ça marche', 'search-placeholder': 'résumés, fiches, livres...',
    'hero-title': 'Votre mentor tout-en-un pour un BAC plus facile !',
    'search-title': 'Explorez dès maintenant notre vaste bibliothèque !',
    'search-btn': 'Rechercher', 'why-us': 'Pourquoi nous choisir ?',
    sources: 'Sources', efficiency: 'Efficacité', 'less-work': 'Moins d’efforts', progress: 'Progrès',
    'exit-admin': 'Quitter l’admin', 'focus-timer': 'Minuteur de concentration',
    'short-break': 'Pause courte', 'long-break': 'Pause longue',
    'add-task': 'Ajouter une tâche', results: 'Résultats',
    passed: '🎉 Réussi', failed: '❌ Échoué',
    calculate: 'Calculer', assessment: 'Évaluation',
    flashcards: 'Fiches', resources: 'Ressources',
    welcome: 'Bon retour,', 'todo-list': 'Liste de tâches',
    loading: 'Chargement…', save: 'Enregistrer', saving: 'Enregistrement…', cancel: 'Annuler',
    'continue': 'Continuer', retry: 'Réessayer', close: 'Fermer', 'sign-out': 'Se déconnecter',
    'sign-in': 'Se connecter', 'sign-up': "S'inscrire", dashboard: 'Tableau de bord', admin: 'Admin',
    profile: 'Profil', settings: 'Paramètres', support: 'Support', required: 'Requis',
    optional: 'Optionnel', 'theme-toggle': 'Changer de thème', language: 'Langue',
    'auth-login-title': 'Bon retour',
    'auth-login-subtitle': 'Connectez-vous pour continuer votre parcours BAC.',
    'auth-register-title': 'Créez votre compte',
    'auth-register-subtitle': 'Rejoignez EZBAC et révisez plus intelligemment.',
    'auth-email': 'E-mail', 'auth-password': 'Mot de passe',
    'auth-confirm-password': 'Confirmer le mot de passe', 'auth-name': 'Nom complet',
    'auth-google': 'Continuer avec Google', 'auth-or': 'ou',
    'auth-have-account': 'Vous avez déjà un compte ?',
    'auth-no-account': "Vous n'avez pas de compte ?",
    'auth-forgot': 'Mot de passe oublié ?',
    'auth-reset-sent': 'E-mail de réinitialisation envoyé. Vérifiez votre boîte.',
    'auth-login-cta': 'Se connecter', 'auth-register-cta': 'Créer le compte',
    'auth-back-home': "Retour à l'accueil",
    'onboarding-title': 'Complétez votre profil',
    'onboarding-subtitle': 'Indiquez votre Wilaya et votre filière BAC pour débloquer votre contenu.',
    'onboarding-wilaya': 'Wilaya', 'onboarding-wilaya-ph': 'Choisissez votre Wilaya',
    'onboarding-stream': 'Filière BAC', 'onboarding-stream-ph': 'Choisissez votre filière',
    'onboarding-finish': 'Terminer et continuer',
    'onboarding-why': 'Votre filière détermine les cours, quiz et ressources que vous voyez.',
    'profile-incomplete': 'Complétez votre profil pour continuer',
    'err-generic': "Une erreur s'est produite. Veuillez réessayer.",
    'err-network': 'Erreur réseau. Vérifiez votre connexion et réessayez.',
    'err-permission': "Vous n'avez pas la permission de faire cela.",
    'err-invalid-email': 'Veuillez saisir une adresse e-mail valide.',
    'err-weak-password': 'Le mot de passe doit comporter au moins 6 caractères.',
    'err-password-match': 'Les mots de passe ne correspondent pas.',
    'err-wrong-credentials': 'E-mail ou mot de passe incorrect.',
    'err-email-in-use': 'Cet e-mail est déjà utilisé.',
    'err-popup-closed': 'Connexion annulée.',
    'err-required-fields': 'Veuillez remplir tous les champs requis.',
    'not-found-title': 'Page introuvable',
    'not-found-cta': "Aller à l'accueil",
    'nav-progress': 'Progrès', 'nav-plans': 'Plans d\'étude', 'nav-favorites': 'Favoris',
    'continue-studying': 'Continuer à étudier', 'todays-plan': "Plan d'aujourd'hui",
    'your-progress': 'Votre progression', 'quick-access': 'Accès rapide', 'recent-activity': 'Activité récente',
    overall: 'Global', subjects: 'Matières', units: 'Unités', lessons: 'Leçons', summaries: 'Résumés',
    'video-courses': 'Cours vidéo', quizzes: 'Quiz', content: 'Contenu', 'all': 'Tout',
    search: 'Rechercher', start: 'Commencer', favorite: 'Enregistrer', saved: 'Enregistré', complete: 'terminé',
    best: 'Meilleur', questions: 'questions', 'view-plan': 'Voir le plan', 'tasks-done': '{done} / {total} terminées',
    'no-subjects-title': 'Aucune matière', 'no-subjects-desc': 'Les matières de votre filière apparaîtront ici une fois publiées.',
    'no-content-title': 'Rien pour le moment', 'no-content-desc': "Aucun contenu n'a encore été publié pour cette unité.",
    'no-favorites-title': 'Aucun favori', 'no-favorites-desc': 'Enregistrez des leçons, ressources, quiz et fiches pour plus tard.',
    'explore-library': 'Explorer la bibliothèque', 'no-plans-title': "Aucun plan d'étude",
    'no-plans-desc': "Créez un plan d'étude pour organiser votre révision du BAC.", 'create-study-plan': "Créer un plan d'étude",
    'no-progress-title': 'Commencez à étudier', 'no-progress-desc': 'Votre progression apparaîtra ici au fur et à mesure.',
    'open-library': 'Ouvrir la bibliothèque',
    'coming-soon': 'Bientôt disponible', back: 'Retour', 'available': 'disponible',
    'switch-to-admin': 'Passer au tableau de bord admin',
    teachers: 'Enseignants', 'nav-teachers': 'Enseignants', following: 'Suivi', follow: 'Suivre',
    'admin-students': 'Étudiants', 'total-students': "Total d'étudiants", 'new-this-week': 'Nouveaux cette semaine',
    'profile-completion': 'Profils complétés', 'by-stream': 'Par filière', student: 'Étudiant',
    wilaya: 'Wilaya', joined: 'Inscrit le', 'last-active': 'Dernière activité', never: 'Jamais',
    'search-students': 'Rechercher par nom ou e-mail…', 'all-streams': 'Toutes les filières',
    'status-complete': 'Complet', 'status-incomplete': 'Incomplet', enable: 'Activer', disable: 'Désactiver',
    disabled: 'Désactivé', active: 'Actif', 'no-students-found': 'Aucun étudiant ne correspond à vos filtres.',
    'account-disabled-title': 'Compte désactivé', 'account-disabled-desc': "Votre compte a été désactivé par un administrateur. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
    favorites: 'Favoris'
  },
  ar: {
    home: 'الرئيسية', courses: 'الدورات', library: 'المكتبة', pomodoro: 'بومودورو',
    calculator: 'الحاسبة', faq: 'الأسئلة الشائعة', games: 'الألعاب', 'get-started': 'ابدأ الآن',
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
    loading: 'جارٍ التحميل…', save: 'حفظ', saving: 'جارٍ الحفظ…', cancel: 'إلغاء',
    'continue': 'متابعة', retry: 'إعادة المحاولة', close: 'إغلاق', 'sign-out': 'تسجيل الخروج',
    'sign-in': 'تسجيل الدخول', 'sign-up': 'إنشاء حساب', dashboard: 'لوحة التحكم', admin: 'الإدارة',
    profile: 'الملف الشخصي', settings: 'الإعدادات', support: 'الدعم', required: 'مطلوب',
    optional: 'اختياري', 'theme-toggle': 'تبديل السمة', language: 'اللغة',
    'auth-login-title': 'مرحباً بعودتك',
    'auth-login-subtitle': 'سجّل الدخول لمتابعة رحلتك نحو البكالوريا.',
    'auth-register-title': 'أنشئ حسابك',
    'auth-register-subtitle': 'انضم إلى EZBAC وذاكر بذكاء.',
    'auth-email': 'البريد الإلكتروني', 'auth-password': 'كلمة المرور',
    'auth-confirm-password': 'تأكيد كلمة المرور', 'auth-name': 'الاسم الكامل',
    'auth-google': 'المتابعة عبر Google', 'auth-or': 'أو',
    'auth-have-account': 'لديك حساب بالفعل؟',
    'auth-no-account': 'ليس لديك حساب؟',
    'auth-forgot': 'نسيت كلمة المرور؟',
    'auth-reset-sent': 'تم إرسال رابط إعادة تعيين كلمة المرور. تحقق من بريدك.',
    'auth-login-cta': 'تسجيل الدخول', 'auth-register-cta': 'إنشاء الحساب',
    'auth-back-home': 'العودة إلى الرئيسية',
    'onboarding-title': 'أكمل ملفك الشخصي',
    'onboarding-subtitle': 'أخبرنا بولايتك وشعبتك في البكالوريا لفتح المحتوى المخصص لك.',
    'onboarding-wilaya': 'الولاية', 'onboarding-wilaya-ph': 'اختر ولايتك',
    'onboarding-stream': 'الشعبة', 'onboarding-stream-ph': 'اختر شعبتك',
    'onboarding-finish': 'إنهاء ومتابعة',
    'onboarding-why': 'تحدد شعبتك الدورات والاختبارات والمصادر التي تراها.',
    'profile-incomplete': 'أكمل ملفك الشخصي للمتابعة',
    'err-generic': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    'err-network': 'خطأ في الشبكة. تحقق من اتصالك وأعد المحاولة.',
    'err-permission': 'ليس لديك صلاحية للقيام بذلك.',
    'err-invalid-email': 'يرجى إدخال بريد إلكتروني صالح.',
    'err-weak-password': 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    'err-password-match': 'كلمتا المرور غير متطابقتين.',
    'err-wrong-credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'err-email-in-use': 'هذا البريد الإلكتروني مسجّل بالفعل.',
    'err-popup-closed': 'تم إلغاء تسجيل الدخول.',
    'err-required-fields': 'يرجى ملء جميع الحقول المطلوبة.',
    'not-found-title': 'الصفحة غير موجودة',
    'not-found-cta': 'الذهاب إلى الرئيسية',
    'nav-progress': 'التقدم', 'nav-plans': 'خطط الدراسة', 'nav-favorites': 'المفضلة',
    'continue-studying': 'واصل الدراسة', 'todays-plan': 'خطة اليوم',
    'your-progress': 'تقدمك', 'quick-access': 'وصول سريع', 'recent-activity': 'النشاط الأخير',
    overall: 'الإجمالي', subjects: 'المواد', units: 'الوحدات', lessons: 'الدروس', summaries: 'الملخصات',
    'video-courses': 'دورات الفيديو', quizzes: 'الاختبارات', content: 'المحتوى', 'all': 'الكل',
    search: 'بحث', start: 'ابدأ', favorite: 'حفظ', saved: 'محفوظ', complete: 'مكتمل',
    best: 'الأفضل', questions: 'أسئلة', 'view-plan': 'عرض الخطة', 'tasks-done': 'اكتمل {done} / {total}',
    'no-subjects-title': 'لا توجد مواد بعد', 'no-subjects-desc': 'ستظهر مواد شعبتك هنا بمجرد نشرها.',
    'no-content-title': 'لا يوجد شيء بعد', 'no-content-desc': 'لم يُنشر أي محتوى لهذه الوحدة بعد.',
    'no-favorites-title': 'لا توجد مفضلة بعد', 'no-favorites-desc': 'احفظ الدروس والمصادر والاختبارات والبطاقات لوقت لاحق.',
    'explore-library': 'استكشف المكتبة', 'no-plans-title': 'لا توجد خطة دراسة بعد',
    'no-plans-desc': 'أنشئ خطة دراسة لتنظيم مراجعتك للبكالوريا.', 'create-study-plan': 'إنشاء خطة دراسة',
    'no-progress-title': 'ابدأ الدراسة', 'no-progress-desc': 'سيظهر تقدمك هنا عند إكمال الدروس والاختبارات والبطاقات.',
    'open-library': 'افتح المكتبة',
    'coming-soon': 'قريباً', back: 'رجوع', 'available': 'متاح',
    'switch-to-admin': 'التبديل إلى لوحة تحكم المسؤول',
    teachers: 'الأساتذة', 'nav-teachers': 'الأساتذة', following: 'متابَع', follow: 'متابعة',
    'admin-students': 'الطلاب', 'total-students': 'إجمالي الطلاب', 'new-this-week': 'جدد هذا الأسبوع',
    'profile-completion': 'اكتمال الملف الشخصي', 'by-stream': 'حسب الشعبة', student: 'طالب',
    wilaya: 'الولاية', joined: 'تاريخ الانضمام', 'last-active': 'آخر نشاط', never: 'أبداً',
    'search-students': 'ابحث بالاسم أو البريد الإلكتروني…', 'all-streams': 'كل الشعب',
    'status-complete': 'مكتمل', 'status-incomplete': 'غير مكتمل', enable: 'تفعيل', disable: 'تعطيل',
    disabled: 'معطّل', active: 'نشط', 'no-students-found': 'لا يوجد طلاب مطابقون لعوامل التصفية.',
    'account-disabled-title': 'الحساب معطّل', 'account-disabled-desc': 'قام المسؤول بتعطيل حسابك. تواصل مع الدعم إذا كنت تعتقد أن هذا خطأ.',
    favorites: 'المفضلة'
  }
}

const LangContext = createContext({
  lang: 'en', dir: 'ltr', t: (k) => k, setLang: () => {}, toggle: () => {}, languages: LANGUAGES
})

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('ezbac_lang')
      return translations[saved] ? saved : 'en'
    } catch {
      return 'en'
    }
  })

  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try {
      localStorage.setItem('ezbac_lang', lang)
    } catch {
      /* ignore */
    }
  }, [lang, dir])

  // t(key, vars?) — falls back to English then the raw key, and interpolates
  // {placeholders} from `vars` (e.g. t('welcome-name', { name })).
  const t = useCallback((key, vars) => {
    let str = (translations[lang] && translations[lang][key])
      ?? translations.en[key]
      ?? key
    if (vars && typeof str === 'string') {
      for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, v)
    }
    return str
  }, [lang])

  const setLang = useCallback((code) => {
    if (translations[code]) setLangState(code)
  }, [])

  // Legacy 2-way toggle kept for backward-compat; cycles through all languages.
  const toggle = useCallback(() => {
    setLangState((p) => {
      const order = LANGUAGES.map((l) => l.code)
      return order[(order.indexOf(p) + 1) % order.length]
    })
  }, [])

  return (
    <LangContext.Provider value={{ lang, dir, t, setLang, toggle, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
