import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Library from './pages/Library.jsx'
import SubjectView from './pages/SubjectView.jsx'
import UnitView from './pages/UnitView.jsx'
import Resources from './pages/Resources.jsx'
import Teachers from './pages/Teachers.jsx'
import Courses from './pages/Courses.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import Quiz from './pages/Quiz.jsx'
import Flashcard from './pages/Flashcard.jsx'
import QuizDecks from './pages/QuizDecks.jsx'
import FlashcardDecks from './pages/FlashcardDecks.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import Calculator from './pages/Calculator.jsx'
import Games from './pages/Games.jsx'
import Progress from './pages/Progress.jsx'
import Favorites from './pages/Favorites.jsx'
import StudyPlans from './pages/StudyPlans.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Onboarding from './pages/Onboarding.jsx'
import NotFound from './pages/NotFound.jsx'
import PomodoroWidget from './components/PomodoroWidget.jsx'
import { RequireAuth, RequireProfile, RequireAdmin, RedirectIfAuthed } from './components/RouteGuards.jsx'

// A student page: requires auth + a completed profile (wilaya + BAC stream).
const student = (el) => <RequireProfile>{el}</RequireProfile>

export default function App() {
  return (
    <>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />

      {/* Auth required, profile not yet complete */}
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

      {/* Student area (auth + completed profile) */}
      {/* Home page removed — Library is now the default landing destination.
          Redirect any old /home bookmark/link rather than 404ing it. */}
      <Route path="/home" element={<Navigate to="/library" replace />} />
      <Route path="/library" element={student(<Library />)} />
      <Route path="/library/subject/:subjectId" element={student(<SubjectView />)} />
      <Route path="/library/unit/:unitId" element={student(<UnitView />)} />
      <Route path="/resources" element={student(<Resources />)} />
      <Route path="/teachers" element={student(<Teachers />)} />
      <Route path="/courses" element={student(<Courses />)} />
      <Route path="/courses/:courseId" element={student(<CourseDetail />)} />
      <Route path="/quiz" element={student(<Quiz />)} />
      <Route path="/quizzes" element={student(<QuizDecks />)} />
      <Route path="/flashcard" element={student(<Flashcard />)} />
      <Route path="/flashcard-decks" element={student(<FlashcardDecks />)} />
      <Route path="/pomodoro" element={student(<Pomodoro />)} />
      <Route path="/calculator" element={student(<Calculator />)} />
      <Route path="/games" element={student(<Games />)} />
      <Route path="/progress" element={student(<Progress />)} />
      <Route path="/favorites" element={student(<Favorites />)} />
      <Route path="/study-plans" element={student(<StudyPlans />)} />
      <Route path="/profile" element={student(<Profile />)} />
      {/* /support replaced by Profile (personal stats + admin switch); keep the
          old URL working for anyone with it bookmarked. */}
      <Route path="/support" element={<Navigate to="/profile" replace />} />

      {/* Super Admin only */}
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    {/* Persistent, session-global Pomodoro control — outside <Routes> so it
        never unmounts on navigation. */}
    <PomodoroWidget />
    </>
  )
}
