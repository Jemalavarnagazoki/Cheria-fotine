import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { useAuth } from '../context/AuthContext'

const ChatWidget = ({ language }: { language: 'ka' | 'en' }) => {
  const { isAuthenticated, email, token } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSending, setIsSending] = useState(false)

  const isGeorgian = language === 'ka'
  const effectiveEmail = useMemo(() => contactEmail || email || '', [contactEmail, email])

  const toggleOpen = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setIsOpen((prev) => !prev)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !message) {
      setError(isGeorgian ? 'შეავსე ყველა ველი.' : 'Please fill in all fields.')
      return
    }

    setIsSending(true)
    try {
      await apiRequest('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email: effectiveEmail,
          message,
        }),
      })
      setMessage('')
      setSuccess(isGeorgian ? 'გაიგზავნა.' : 'Message sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="chat-widget">
      <button
        type="button"
        className="chat-fab"
        onClick={toggleOpen}
        aria-label={isGeorgian ? 'ჩატის გახსნა' : 'Open chat'}
      >
        <span className="chat-fab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M6.4 4.5h11.2c1.4 0 2.5 1.1 2.5 2.5v7c0 1.4-1.1 2.5-2.5 2.5H10l-3.9 2.7a.8.8 0 0 1-1.3-.6v-2.1H6.4A2.5 2.5 0 0 1 3.9 14V7c0-1.4 1.1-2.5 2.5-2.5Zm0 1.6c-.5 0-.9.4-.9.9v7c0 .5.4.9.9.9h2.2c.4 0 .8.4.8.8v1l2.4-1.7c.1-.1.3-.1.5-.1h5.9c.5 0 .9-.4.9-.9V7c0-.5-.4-.9-.9-.9H6.4Z" />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className="chat-panel" role="dialog" aria-modal="true">
          <div className="chat-header">
            <h3>{isGeorgian ? 'მოგვწერე' : 'Chat with us'}</h3>
            <button
              type="button"
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label={isGeorgian ? 'დახურვა' : 'Close'}
            >
              ×
            </button>
          </div>
          <p className="chat-subtitle">
            {isGeorgian
              ? 'ადმინი სწრაფად დაგიბრუნდება.'
              : 'Admin will get back to you soon.'}
          </p>
          <form className="chat-form" onSubmit={handleSubmit}>
            <label>
              {isGeorgian ? 'სახელი' : 'Name'}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={isGeorgian ? 'თქვენი სახელი' : 'Your name'}
                required
              />
            </label>
            <label>
              {isGeorgian ? 'ელ-ფოსტა' : 'Email'}
              <input
                type="email"
                value={effectiveEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder={isGeorgian ? 'name@email.com' : 'name@email.com'}
                required
              />
            </label>
            <label>
              {isGeorgian ? 'შეტყობინება' : 'Message'}
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  isGeorgian
                    ? 'რას გვწერთ?'
                    : 'What would you like to ask?'
                }
                required
              />
            </label>
            {error ? <span className="form-error">{error}</span> : null}
            {success ? <span className="form-note">{success}</span> : null}
            <button type="submit" disabled={isSending}>
              {isSending
                ? isGeorgian
                  ? 'იგზავნება...'
                  : 'Sending...'
                : isGeorgian
                  ? 'გაგზავნა'
                  : 'Send message'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default ChatWidget
