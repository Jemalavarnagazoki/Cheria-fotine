import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, getApiBase } from '../api'
import { useAuth } from '../context/AuthContext'

interface CartItem {
  product: {
    id: string
    name: string
    category: string
    price: string
    description: string
    images: string[]
    createdAt: string
  }
  quantity: number
}

const Cart = ({ language }: { language: 'ka' | 'en' }) => {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<CartItem[]>([])
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const apiBase = useMemo(() => getApiBase(), [])
  const isGeorgian = language === 'ka'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const loadCart = async () => {
      try {
        const data = await apiRequest<{ items: CartItem[] }>('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems(data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load cart')
      }
    }

    loadCart()
  }, [isAuthenticated, navigate, token])

  const updateQuantity = async (productId: string, nextQty: number) => {
    setIsUpdating(true)
    setError('')
    try {
      await apiRequest(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: nextQty }),
      })
      setItems((prev) =>
        prev
          .map((item) =>
            item.product.id === productId
              ? { ...item, quantity: nextQty }
              : item,
          )
          .filter((item) => item.quantity > 0),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update cart')
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async (productId: string) => {
    setIsUpdating(true)
    setError('')
    try {
      await apiRequest(`/api/cart/items/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove item')
    } finally {
      setIsUpdating(false)
    }
  }

  const goToCheckout = () => {
    navigate('/checkout')
  }

  return (
    <section className="cart-page">
      <header className="cart-header">
        <div>
          <h1>{isGeorgian ? 'კალათა' : 'Your cart'}</h1>
          <p>
            {isGeorgian
              ? 'განაახლე რაოდენობა ან გადადი გადახდაზე.'
              : 'Update quantities or continue to checkout.'}
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={goToCheckout}
          disabled={items.length === 0}
        >
          {isGeorgian ? 'გადახდაზე გადასვლა' : 'Go to checkout'}
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="cart-grid">
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>
              {isGeorgian
                ? 'კალათა ცარიელია.'
                : 'Your cart is empty.'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.product.id} className="cart-card">
              <div className="cart-image">
                {item.product.images.length ? (
                  <img
                    src={
                      item.product.images[0].startsWith('http')
                        ? item.product.images[0]
                        : `${apiBase}${item.product.images[0]}`
                    }
                    alt={item.product.name}
                  />
                ) : (
                  <div className="catalog-placeholder">No image</div>
                )}
              </div>
              <div className="cart-body">
                <div className="cart-title">
                  <h3>{item.product.name}</h3>
                  <span>{item.product.category}</span>
                </div>
                <p>{item.product.description || '-'}</p>
                <div className="cart-meta">
                  <span>{item.product.price || 'Price on request'}</span>
                  <div className="cart-qty">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={isUpdating || item.quantity <= 1}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={isUpdating}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeItem(item.product.id)}
                  disabled={isUpdating}
                >
                  {isGeorgian ? 'წაშლა' : 'Remove'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default Cart
