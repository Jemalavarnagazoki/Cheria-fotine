import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = ({ language }: { language: 'ka' | 'en' }) => {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const isGeorgian = language === 'ka'

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>{isGeorgian ? 'შესვლა' : 'Log in'}</h1>
        <p>
          {isGeorgian
            ? 'მფლობელის წვდომა ატვირთვებისთვის და მართვისთვის.'
            : 'Owner access for Cheria uploads and product management.'}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {isGeorgian ? 'ელ-ფოსტა' : 'Email'}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={isGeorgian ? 'name@email.com' : 'name@email.com'}
              required
            />
          </label>
          <label>
            {isGeorgian ? 'პაროლი' : 'Password'}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isGeorgian ? 'შეიყვანე პაროლი' : 'Your password'}
              required
            />
          </label>
          {error ? <span className="form-error">{error}</span> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading
              ? isGeorgian
                ? 'იტვირთება...'
                : 'Signing in...'
              : isGeorgian
                ? 'შესვლა'
                : 'Log in'}
          </button>
        </form>
        <div className="auth-meta">
          <span>{isGeorgian ? 'ანგარიში არ გაქვს?' : 'Need an account?'}</span>
          <Link to="/signup">{isGeorgian ? 'რეგისტრაცია' : 'Create one'}</Link>
        </div>
      </div>
    </section>
  )
}

export default Login
