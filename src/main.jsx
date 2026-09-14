import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { LangProvider } from './contexts/LangContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { PomodoroProvider } from './contexts/PomodoroContext.jsx'
import { TodoProvider } from './contexts/TodoContext.jsx'
import { FavoritesProvider } from './contexts/FavoritesContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <PomodoroProvider>
              <TodoProvider>
                <FavoritesProvider>
                  <App />
                </FavoritesProvider>
              </TodoProvider>
            </PomodoroProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
