import { useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'

const streams = {
  science: [['رياضيات', 5], ['علوم طبيعية', 6], ['فيزياء', 5], ['عربية', 3], ['فلسفة', 2], ['إسلامية', 2], ['تاريخ', 2], ['إنجليزية', 2], ['فرنسية', 2], ['رياضة', 1]],
  math: [['رياضيات', 7], ['فيزياء', 6], ['علوم', 2], ['عربية', 3], ['فلسفة', 2], ['إسلامية', 2], ['تاريخ', 2], ['إنجليزية', 2], ['فرنسية', 2], ['رياضة', 1]],
  literature: [['عربية', 6], ['فلسفة', 6], ['تاريخ', 4], ['إنجليزية', 3], ['فرنسية', 3], ['رياضيات', 2], ['إسلامية', 2], ['رياضة', 1]],
  management: [['محاسبة', 6], ['اقتصاد', 5], ['رياضيات', 5], ['عربية', 3], ['فلسفة', 2], ['إنجليزية', 2], ['فرنسية', 2], ['تاريخ', 2], ['إسلامية', 2], ['رياضة', 1]],
  languages: [['إنجليزية', 5], ['فرنسية', 5], ['لغة ثالثة', 4], ['عربية', 3], ['فلسفة', 2], ['تاريخ', 2], ['إسلامية', 2], ['رياضيات', 2], ['رياضة', 1]]
}

// Note: the previous version of this page had a second "To-Do" panel next to
// the calculator — a static input + button with no state or handler at all
// (dead UI, not wired to anything). It duplicated the real global To-Do
// (Pomodoro page / floating widget), so it was removed rather than fixed.
export default function Calculator() {
  const { t, lang } = useLang()
  const [stream, setStream] = useState('')
  const [grades, setGrades] = useState({})
  const [result, setResult] = useState('--')
  const [status, setStatus] = useState({ text: '', cls: '' })

  const subjects = stream ? streams[stream] : []

  function setGrade(i, value) {
    setGrades({ ...grades, [i]: value })
  }

  function calculate() {
    if (!stream) return
    let total = 0
    let coeffSum = 0
    subjects.forEach((sub, i) => {
      const grade = parseFloat(grades[i])
      const coeff = sub[1]
      if (!isNaN(grade)) {
        total += grade * coeff
        coeffSum += coeff
      }
    })
    if (coeffSum === 0) return
    const avg = (total / coeffSum).toFixed(2)
    setResult(avg)
    if (parseFloat(avg) >= 10) {
      setStatus({ text: lang === 'en' ? '🎉 Passed' : '🎉 ناجح', cls: 'text-emerald-500 pop-anim' })
    } else {
      setStatus({ text: lang === 'en' ? '❌ Failed' : '❌ راسب', cls: 'text-red-500 shake-anim' })
    }
  }

  return (
    <div className="font-outfit bg-bg-page min-h-screen pt-[120px] px-5 pb-10 max-md:pt-5">
      <DashboardNavbar />

      <div className="max-w-[700px] mx-auto">
        <div className="bg-surface border border-border-soft rounded-[25px] p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] max-md:rounded-[20px] max-md:p-5">
          <h1 className="text-[2rem] mb-5 text-ink max-md:text-[1.5rem]">🎓 Bac Calculator</h1>

          <select
            value={stream}
            onChange={(e) => { setStream(e.target.value); setGrades({}); setResult('--'); setStatus({ text: '', cls: '' }) }}
            className="p-3 rounded-xl border border-border-card bg-surface text-ink mb-6 w-full text-base outline-none focus:border-primary"
          >
            <option value="">اختر الشعبة</option>
            <option value="science">علوم تجريبية</option>
            <option value="math">رياضيات</option>
            <option value="literature">آداب وفلسفة</option>
            <option value="management">تسيير واقتصاد</option>
            <option value="languages">لغات أجنبية</option>
          </select>

          <div>
            {subjects.map((sub, i) => (
              <div key={i} className="flex justify-between items-center my-2.5 py-[14px] px-5 bg-surface-muted rounded-[14px] border border-transparent hover:border-border-soft max-md:py-2.5 max-md:px-3.5 max-md:rounded-[10px]">
                <span className="text-ink">{sub[0]} (معامل {sub[1]})</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0-20"
                  value={grades[i] || ''}
                  onChange={(e) => setGrade(i, e.target.value)}
                  className="w-20 p-2 rounded-[10px] border border-border-card bg-surface text-ink text-center text-base outline-none focus:border-primary max-md:w-[65px] max-md:p-1.5"
                />
              </div>
            ))}
          </div>

          <button onClick={calculate} className="w-full mt-6 p-4 rounded-2xl border-0 bg-primary text-white font-semibold text-[1.1rem] cursor-pointer hover:bg-primary-strong hover:-translate-y-0.5 transition-all max-md:text-[0.95rem] max-md:p-3.5">
            {t('calculate')}
          </button>

          <div className="mt-[30px] text-[60px] font-bold text-center text-ink max-md:text-[40px] max-[480px]:text-[32px]">{result}</div>
          <div className={`mt-2.5 text-[28px] text-center font-semibold opacity-100 ${status.cls}`}>{status.text}</div>
        </div>
      </div>
    </div>
  )
}
