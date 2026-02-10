import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Signup = ({ language }: { language: 'ka' | 'en' }) => {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const isGeorgian = language === 'ka'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(isGeorgian ? 'პაროლები არ ემთხვევა' : 'Passwords do not match')
      return
    }

    try {
      await signup(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>{isGeorgian ? 'რეგისტრაცია' : 'Sign up'}</h1>
        <p>
          {isGeorgian
            ? 'შექმენი ანგარიში ჩერიას კალათისა და შეკვეთებისთვის.'
            : 'Create an account for Cheria cart and checkout.'}
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
              placeholder={isGeorgian ? 'შეიყვანე პაროლი' : 'Create a password'}
              required
            />
          </label>
          <label>
            {isGeorgian ? 'გაიმეორე პაროლი' : 'Confirm password'}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={
                isGeorgian ? 'გაიმეორე პაროლი' : 'Confirm your password'
              }
              required
            />
          </label>
          {error ? <span className="form-error">{error}</span> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading
              ? isGeorgian
                ? 'იტვირთება...'
                : 'Creating...'
              : isGeorgian
                ? 'რეგისტრაცია'
                : 'Create account'}
          </button>
        </form>
        <div className="auth-meta">
          <span>{isGeorgian ? 'უკვე გაქვს ანგარიში?' : 'Already have one?'}</span>
          <Link to="/login">{isGeorgian ? 'შესვლა' : 'Log in'}</Link>
        </div>
      </div>
    </section>
  )
}

export default Signup
