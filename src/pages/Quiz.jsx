import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'

export default function Quiz() {
  const navigate = useNavigate()
  const subject = localStorage.getItem('selectedQuizSubject') || 'Math'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [stage, setStage] = useState('cover')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [score, setScore] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'quizzes'), where('subject', '==', subject))
        const snap = await getDocs(q)
        const collected = []
        snap.forEach((d) => {
          const data = d.data()
          if (Array.isArray(data.questions)) collected.push(...data.questions)
          else collected.push(data)
        })
        setData(collected)
      } catch (e) {
        setLoadError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [subject])

  function selectAnswer(option) {
    if (answers[current]) return
    const q = data[current]
    const isCorrect = option === q.correctAnswer
    const next = [...answers]
    next[current] = { selected: option, isCorrect }
    setAnswers(next)
    if (isCorrect) setScore((s) => s + 1)
  }

  function nextQ() {
    if (current === data.length - 1 && answers[current]) {
      setStage('result')
    } else if (current < data.length - 1) {
      setCurrent(current + 1)
    }
  }

  function prevQ() { if (current > 0) setCurrent(current - 1) }

  if (loading) {
    return (
      <div>
        <DashboardNavbar />
        <div className="text-center p-[100px]">
          <h2 className="text-primary-strong">Fetching Quizzes...</h2>
          <p>Please wait for the live data.</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <DashboardNavbar />
        <div className="text-center p-[100px]"><h2>Error loading data.</h2><p>{loadError}</p></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div>
        <DashboardNavbar />
        <div className="text-center p-[100px]">
          <h2>No quizzes found for {subject}</h2>
          <button onClick={() => navigate('/courses')} className="mt-4 underline">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardNavbar />

      <div className="w-full pt-[100px] max-md:pt-5">
        <div className="flex justify-start px-10 max-md:px-4">
          <button onClick={() => navigate('/courses')} className="bg-transparent border-0 text-base font-semibold text-ink cursor-pointer flex items-center gap-2 hover:text-[#23415E] hover:-translate-x-1">
            <h5>← Back</h5>
          </button>
        </div>

        {stage === 'cover' && (
          <div className="flex gap-4 px-10 max-md:px-4 max-md:flex-col">
            <div className="w-1/5 text-ink max-md:w-full max-md:flex max-md:gap-3 max-md:items-baseline max-md:mb-3">
              <h4 className="mb-6 max-md:mb-2">{subject}</h4>
              <p>Interactive assessment powered by EzBac Firestore. {data.length} interactive questions found.</p>
            </div>
            <div className="flex-1 bg-white h-[516px] rounded-[56px] border border-border-soft p-[100px] flex flex-col justify-between max-md:h-auto max-md:min-h-[300px] max-md:p-[40px_24px] max-md:rounded-[30px]">
              <h3 className="text-left text-ez-2xl">{subject} Quiz</h3>
              <div className="flex justify-end">
                <button
                  onClick={() => setStage('active')}
                  className="bg-primary text-white border-0 rounded-pill text-ez-lg font-medium px-8 py-4 h-[59px] cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
                >
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'active' && (
          <div className="w-full min-h-screen p-[100px_40px] flex flex-col max-md:p-[20px_16px] max-[480px]:p-[16px_12px] max-md:min-h-0">
            <div className="flex justify-between items-center">
              <span className="text-ez-base">{current + 1} / {data.length}</span>
              <button className="bg-transparent border-0 text-ez-base cursor-pointer font-medium">Report</button>
            </div>
            <div className="w-full h-2 bg-border-soft rounded-[20px] mt-3 overflow-hidden">
              <div className="h-full bg-[#6366F1] rounded-[20px] transition-[width] duration-[400ms]" style={{ width: `${((current + 1) / data.length) * 100}%` }} />
            </div>
            <div>
              <h4 className="mt-8 mb-8 max-md:text-[1.2rem] max-md:mb-4">{data[current].question}</h4>
              <p className="mb-8 text-ez-base max-md:mb-4 max-md:text-[0.9rem]">Choose the correct answer</p>
            </div>

            <div className="flex flex-col gap-4">
              {data[current].options.map((opt, i) => {
                const ans = answers[current]
                let stateCls = ''
                if (ans) {
                  if (opt === data[current].correctAnswer) stateCls = 'correct'
                  else if (ans.selected === opt) stateCls = 'wrong'
                }
                return (
                  <div
                    key={i}
                    onClick={() => selectAnswer(opt)}
                    className={`answer w-full h-20 bg-[#edf2f7] rounded-[34px] flex items-center pl-[45px] cursor-pointer hover:bg-[#d8dee7] hover:scale-[1.01] ${stateCls} max-md:h-auto max-md:min-h-[56px] max-md:p-[14px_20px] max-md:rounded-[20px] max-[480px]:p-[12px_16px] max-[480px]:min-h-[48px] max-[480px]:rounded-2xl`}
                  >
                    <h5 className="m-0 max-md:text-[0.95rem] max-md:leading-[1.4]">{opt}</h5>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between mt-10 gap-5 max-md:flex-row max-md:gap-2.5 max-md:mt-6">
              <button
                onClick={prevQ}
                disabled={current === 0}
                className="bg-[#333] text-white border-0 rounded-pill font-medium px-8 py-4 h-[59px] flex-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer max-md:p-[12px_16px] max-md:text-[0.9rem] max-md:rounded-2xl"
              >
                Previous
              </button>
              <button
                onClick={nextQ}
                disabled={!answers[current]}
                className="bg-primary text-white border-0 rounded-pill font-medium px-8 py-4 h-[59px] flex-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer max-md:p-[12px_16px] max-md:text-[0.9rem] max-md:rounded-2xl"
              >
                {current === data.length - 1 && answers[current] ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="text-center py-[60px] px-5 fade-in-anim">
            <h1 className="text-[5rem] text-primary-strong mb-5 max-md:text-[3rem]">{score} / {data.length}</h1>
            <h2 className="font-bold max-md:text-[1.3rem]">Quiz Finished!</h2>
            <p className="my-5 text-[#666] max-w-[400px] mx-auto">
              {score === data.length ? 'Perfect Score! You are ready for the BAC.' : 'Good job! Keep practicing to improve your score.'}
            </p>
            <div className="flex gap-4 justify-center mt-[30px]">
              <button onClick={() => { setStage('cover'); setCurrent(0); setAnswers([]); setScore(0) }} className="bg-primary text-white border-0 rounded-pill font-medium px-[30px] py-3 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]">Restart</button>
              <button onClick={() => navigate('/courses')} className="bg-[#333] text-white border-0 rounded-pill font-medium px-[30px] py-3 cursor-pointer">Back to Courses</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
