import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Quiz from './pages/Quiz.jsx'
import Flashcard from './pages/Flashcard.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import Calculator from './pages/Calculator.jsx'
import Games from './pages/Games.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/library" element={<Library />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/flashcard" element={<Flashcard />} />
      <Route path="/pomodoro" element={<Pomodoro />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/games" element={<Games />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
