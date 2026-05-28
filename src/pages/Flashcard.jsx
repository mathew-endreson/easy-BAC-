import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'

export default function Flashcard() {
  const navigate = useNavigate()
  const subject = localStorage.getItem('selectedFlashSubject') || 'Physics'
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showQ, setShowQ] = useState('')
  const [showA, setShowA] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'flashcards'), where('subject', '==', subject))
        const snap = await getDocs(q)
        const result = []
        snap.forEach((d) => result.push(d.data()))
        setCards(result)
      } catch (e) {
        alert(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [subject])

  useEffect(() => {
    if (cards.length === 0) return
    setFlipped(false)
    const timer = setTimeout(() => {
      setShowQ(cards[index]?.question || '')
      setShowA(cards[index]?.answer || '')
    }, 150)
    return () => clearTimeout(timer)
  }, [index, cards])

  function next() { if (index < cards.length - 1) setIndex(index + 1) }
  function prev() { if (index > 0) setIndex(index - 1) }

  if (loading) {
    return (
      <div>
        <DashboardNavbar />
        <div className="text-center p-[100px]"><h2 className="text-primary-strong">Loading Decks...</h2></div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div>
        <DashboardNavbar />
        <div className="text-center p-[100px]"><h2>No cards for {subject}</h2></div>
      </div>
    )
  }

  return (
    <>
      <DashboardNavbar />

      <div className="w-full pt-[100px] max-md:pt-5">
        <div className="flex justify-start px-10 max-md:px-4">
          <button onClick={() => navigate('/home')} className="bg-transparent border-0 text-base font-semibold text-ink cursor-pointer flex items-center gap-2 hover:text-[#23415E] hover:-translate-x-1">
            <h5>← Back</h5>
          </button>
        </div>

        <div className="flex gap-4 px-10 max-md:flex-col max-md:px-4">
          <div className="w-1/5 text-ink max-md:w-full max-md:flex max-md:gap-3 max-md:items-baseline max-md:mb-3">
            <h4 className="mb-6 max-md:mb-2">{subject}</h4>
            <p>Card {index + 1} / {cards.length}</p>
          </div>

          <div className="flex-1 flex flex-col" style={{ background: 'transparent' }}>
            <div className={`flash-card-outer max-md:h-[220px] max-md:mt-5 max-[480px]:h-[180px] ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
              <div className="flash-card-inner">
                <div className="flash-front max-md:p-6 max-md:rounded-[20px]"><h2 className="max-md:text-[1.2rem] max-[480px]:text-base">{showQ}</h2></div>
                <div className="flash-back max-md:p-6 max-md:rounded-[20px]"><h3 className="max-md:text-[1.1rem] max-[480px]:text-[0.95rem]">{showA}</h3></div>
              </div>
            </div>

            <div className="flex justify-center gap-5 mt-10 max-md:mt-6">
              <button onClick={prev} className="bg-[#eee] border-0 py-2.5 px-[25px] rounded-xl cursor-pointer font-semibold hover:bg-[#ddd] max-md:py-2.5 max-md:px-5 max-md:text-[0.9rem]">Previous</button>
              <button onClick={next} className="bg-[#eee] border-0 py-2.5 px-[25px] rounded-xl cursor-pointer font-semibold hover:bg-[#ddd] max-md:py-2.5 max-md:px-5 max-md:text-[0.9rem]">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
