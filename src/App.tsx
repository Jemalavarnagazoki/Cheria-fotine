import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { getCategoryOptions } from './constants/categories'
import Admin from './pages/Admin'
import Cart from './pages/Cart'
import Category from './pages/Category'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import Login from './pages/Login'
import Requests from './pages/Requests'
import Signup from './pages/Signup'
import ChatWidget from './components/ChatWidget'
import './App.css'

function App() {
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const [language, setLanguage] = useState<'ka' | 'en'>('en')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const location = useLocation()
  const categoryOptions = useMemo(
    () => getCategoryOptions(language),
    [language],
  )
  const activeCategory = useMemo(() => {
    const match = location.pathname.match(/^\/category\/([^/]+)$/)
    return match ? match[1] : null
  }, [location.pathname])
  const copy = useMemo(
    () =>
      language === 'ka'
        ? {
            nav: {
              home: 'მთავარი',
              login: 'შესვლა',
              signup: 'რეგისტრაცია',
              admin: 'პროდუქტის ატვირთვა',
              requests: 'მოთხოვნები',
              cart: 'კალათა',
              logout: 'გასვლა',
            },
            brand: 'ჩერია',
          }
        : {
            nav: {
              home: 'Home',
              login: 'Log in',
              signup: 'Sign up',
              admin: 'Upload products',
              requests: 'Requests',
              cart: 'Cart',
              logout: 'Log out',
            },
            brand: 'cheria',
          },
    [language],
  )

  const localizedNavItems = isAuthenticated
    ? isAdmin
      ? [
          { label: copy.nav.home, to: '/' },
          { label: copy.nav.admin, to: '/admin' },
          { label: copy.nav.requests, to: '/requests' },
          { label: copy.nav.cart, to: '/cart' },
        ]
      : [
          { label: copy.nav.home, to: '/' },
          { label: copy.nav.cart, to: '/cart' },
        ]
    : [
        { label: copy.nav.home, to: '/' },
        { label: copy.nav.login, to: '/login' },
        { label: copy.nav.signup, to: '/signup' },
      ]

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'ka' : 'en'))
  }

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="site-shell">
      <header className="nav-bar">
        <div className="brand">
          <span className="brand-mark">ჩერია</span>
          <span className="brand-divider">/</span>
          <span className="brand-mark">cheria</span>
        </div>
        <nav className="nav-links">
          {localizedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="nav-categories">
            {categoryOptions.map((category) => (
              <Link
                key={category.key}
                to={`/category/${category.key}`}
                className={
                  activeCategory === category.key
                    ? 'nav-category is-active'
                    : 'nav-category'
                }
              >
                {category.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="nav-button nav-toggle"
            onClick={handleLanguageToggle}
            aria-label="Toggle language"
          >
            <span
              className={language === 'en' ? 'fi fi-ge' : 'fi fi-us'}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="nav-button nav-toggle"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            <span
              className={
                theme === 'light' ? 'theme-icon theme-icon--moon' : 'theme-icon theme-icon--sun'
              }
            />
          </button>
          {isAuthenticated ? (
            <button type="button" className="nav-button" onClick={logout}>
              {copy.nav.logout}
            </button>
          ) : null}
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home language={language} />} />
          <Route
            path="/category/:categoryKey"
            element={<Category language={language} />}
          />
          <Route path="/login" element={<Login language={language} />} />
          <Route path="/signup" element={<Signup language={language} />} />
          <Route path="/admin" element={<Admin language={language} />} />
          <Route path="/requests" element={<Requests language={language} />} />
          <Route path="/cart" element={<Cart language={language} />} />
          <Route path="/checkout" element={<Checkout language={language} />} />
        </Routes>
      </main>

      <ChatWidget language={language} />

      <footer className="site-footer">
        <p>
          {language === 'ka'
            ? 'ხელნაკეთი ფენები, სიყვარულით და ზრუნვით.'
            : 'Handcrafted layers, managed with care in every stitch.'}
        </p>
        <div className="social-links">
          <a
            className="social-link"
            href="https://www.instagram.com/cheria_fotine?igsh=MWt4cHlvbmhjb3Yybw=="
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9A2.7 2.7 0 0 0 7.5 19.2h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 3.3a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Zm0 1.8a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Zm5.2-2.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
            </svg>
          </a>
          <a
            className="social-link"
            href="https://www.tiktok.com/@cheria_fotine?_r=1&_t=ZS-93mXZFqA7NA"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.6 3c.4 2.2 2 3.9 4.3 4.2v2.2c-1.7-.1-3.2-.7-4.3-1.7v6.3a5.5 5.5 0 1 1-5.5-5.5c.4 0 .8 0 1.2.1v2.3a3.3 3.3 0 1 0 2.1 3.1V3h2.2Z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
