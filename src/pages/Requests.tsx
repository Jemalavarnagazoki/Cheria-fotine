import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { useAuth } from '../context/AuthContext'

interface MessageItem {
  id: string
  name: string
  email: string
  fromEmail: string
  message: string
  createdAt: string
  repliedAt: string
  repliedBy: string
  reply: string
}

const Requests = ({ language }: { language: 'ka' | 'en' }) => {
  const { isAuthenticated, isAdmin, token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [error, setError] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [isSending, setIsSending] = useState<string | null>(null)
  const isGeorgian = language === 'ka'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!isAdmin) {
      navigate('/')
      return
    }

    const loadMessages = async () => {
      try {
        const data = await apiRequest<{ messages: MessageItem[] }>('/api/messages', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setMessages(data.messages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load messages')
      }
    }

    loadMessages()
  }, [isAuthenticated, isAdmin, navigate, token])

  const handleReplyChange = (id: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: value }))
  }

  const handleReplySubmit = async (id: string) => {
    const reply = replyDrafts[id]
    if (!reply) {
      return
    }

    setIsSending(id)
    setError('')
    try {
      const data = await apiRequest<{ message: MessageItem }>(
        `/api/messages/${id}/reply`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply }),
        },
      )
      setMessages((prev) =>
        prev.map((item) => (item.id === id ? data.message : item)),
      )
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reply')
    } finally {
      setIsSending(null)
    }
  }

  return (
    <section className="requests-page">
      <header className="requests-header">
        <div>
          <h1>{isGeorgian ? 'მოთხოვნები' : 'Requests'}</h1>
          <p>
            {isGeorgian
              ? 'კლიენტების შეტყობინებები და პასუხები.'
              : 'Customer messages and replies.'}
          </p>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="requests-list">
        {messages.length === 0 ? (
          <div className="catalog-empty">
            <p>
              {isGeorgian
                ? 'შეტყობინებები ჯერ არ არის.'
                : 'No messages yet.'}
            </p>
          </div>
        ) : (
          messages.map((item) => (
            <article key={item.id} className="request-card">
              <div className="request-meta">
                <div>
                  <h3>{item.name}</h3>
                  <span>{item.email || item.fromEmail}</span>
                </div>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="request-message">{item.message}</p>
              {item.reply ? (
                <div className="request-reply">
                  <span>
                    {isGeorgian ? 'პასუხი:' : 'Reply:'}{' '}
                    {item.reply}
                  </span>
                  <small>
                    {item.repliedAt
                      ? new Date(item.repliedAt).toLocaleString()
                      : ''}
                  </small>
                </div>
              ) : null}
              <div className="request-actions">
                <textarea
                  value={replyDrafts[item.id] || ''}
                  onChange={(event) =>
                    handleReplyChange(item.id, event.target.value)
                  }
                  placeholder={
                    isGeorgian
                      ? 'უპასუხე კლიენტს...'
                      : 'Write a reply...'
                  }
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleReplySubmit(item.id)}
                  disabled={isSending === item.id}
                >
                  {isSending === item.id
                    ? isGeorgian
                      ? 'იგზავნება...'
                      : 'Sending...'
                    : isGeorgian
                      ? 'პასუხის გაგზავნა'
                      : 'Send reply'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default Requests
