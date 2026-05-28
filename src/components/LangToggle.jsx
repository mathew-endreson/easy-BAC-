import { useLang } from '../contexts/LangContext.jsx'

export default function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <div className="flex items-center gap-3 ml-5 rtl:ml-0 rtl:mr-5">
      <button
        onClick={toggle}
        className="bg-slate-100 border-0 px-3 py-2 rounded-[10px] cursor-pointer font-semibold text-sm flex items-center justify-center hover:bg-slate-200"
      >
        {lang === 'en' ? 'AR' : 'EN'}
      </button>
    </div>
  )
}
