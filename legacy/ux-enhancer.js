/* ux-enhancer.js - EZ Bac Interactivity Engine */

const translations = {
    en: {
        "home": "Home",
        "courses": "Courses",
        "library": "Library",
        "pomodoro": "Pomodoro",
        "calculator": "Calculator",
        "faq": "FAQ",
        "get-started": "Get Started",
        "how-it-works": "How it works",
        "search-placeholder": "resumes, flash cards, books...",
        "hero-title": "Your All-in-One Mentor for an Easier BAC !",
        "search-title": "Start looking now through our vast library!",
        "search-btn": "Search",
        "why-us": "Why you have to choose us?",
        "sources": "Sources",
        "efficiency": "Efficiency",
        "less-work": "Less Work",
        "progress": "Progress",
        "exit-admin": "Exit Admin",
        "focus-timer": "Focus Timer",
        "short-break": "Short Break",
        "long-break": "Long Break",
        "add-task": "Add a new task",
        "results": "Results",
        "passed": "🎉 Passed",
        "failed": "❌ Failed",
        "calculate": "Calculate",
        "assessment": "Assessment",
        "flashcards": "Flashcards",
        "resources": "Resources",
        "welcome": "Welcome Back,",
        "todo-list": "To-Do List"
    },
    ar: {
        "home": "الرئيسية",
        "courses": "الدورات",
        "library": "المكتبة",
        "pomodoro": "بومودورو",
        "calculator": "الحاسبة",
        "faq": "الأسئلة الشائعة",
        "get-started": "ابدأ الآن",
        "how-it-works": "كيف يعمل؟",
        "search-placeholder": "ملخصات، بطاقات تعليمية، كتب...",
        "hero-title": "مرشدك الشامل لبكالوريا أسهل!",
        "search-title": "ابدأ البحث الآن في مكتبتنا الواسعة!",
        "search-btn": "بحث",
        "why-us": "لماذا تختارنا؟",
        "sources": "المصادر",
        "efficiency": "الكفاءة",
        "less-work": "جهد أقل",
        "progress": "التقدم",
        "exit-admin": "خروج من الإدارة",
        "focus-timer": "وقت التركيز",
        "short-break": "استراحة قصيرة",
        "long-break": "استراحة طويلة",
        "add-task": "إضافة مهمة جديدة",
        "results": "النتائج",
        "passed": "🎉 ناجح",
        "failed": "❌ راسب",
        "calculate": "احسب المعدل",
        "assessment": "تقييم",
        "flashcards": "بطاقات مراجعة",
        "resources": "مصادر",
        "welcome": "مرحباً بعودتك،",
        "todo-list": "قائمة المهام"
    }
};

// --- INITIAL STATES ---
let currentLang = localStorage.getItem("ezbac_lang") || "en";

// --- CORE FUNCTIONS ---
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("ezbac_lang", lang);
    
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
    
    // Replace text for all data-key elements
    document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        if (translations[lang][key]) {
            if (el.tagName === "INPUT" && el.placeholder) {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    // Handle button toggle text
    const langBtn = document.getElementById("langToggle");
    if(langBtn) langBtn.innerText = (lang === "en") ? "AR" : "EN";
}

// --- REVEAL ON SCROLL ---
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".course-card, .service-card, .about-card, .right-card, .section-header").forEach(el => {
        el.classList.add("reveal-up");
        observer.observe(el);
    });
}

// --- BOOTSTRAP ---
function injectControls() {
    // Inject Language toggle into navbars
    const navs = document.querySelectorAll(".nav-container, .dashboard-container");
    navs.forEach(nav => {
        if (!nav.querySelector(".theme-lang-controls")) {
            const controls = document.createElement("div");
            controls.className = "theme-lang-controls";
            controls.innerHTML = `
                <button class="control-btn" id="langToggle" onclick="window.switchLang()">${currentLang === 'en' ? 'AR' : 'EN'}</button>
            `;
            nav.appendChild(controls);
        }
    });
}

window.switchLang = () => {
    setLanguage(currentLang === "en" ? "ar" : "en");
};

// Handle initial load
document.addEventListener("DOMContentLoaded", () => {
    injectControls();
    setLanguage(currentLang);
    initReveal();
});
