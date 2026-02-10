import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest, getApiBase } from '../api'
import { useAuth } from '../context/AuthContext'

interface Product {
  id: string
  name: string
  category: string
  price: string
  description: string
  images: string[]
  createdAt: string
}

interface CartItem {
  product: Product
  quantity: number
}

const parsePrice = (value: string) => {
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

const Checkout = ({ language }: { language: 'ka' | 'en' }) => {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<CartItem[]>([])
  const [error, setError] = useState('')
  const apiBase = useMemo(() => getApiBase(), [])
  const isGeorgian = language === 'ka'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const productId = searchParams.get('productId')

    const loadCheckout = async () => {
      try {
        if (productId) {
          const data = await apiRequest<{ product: Product }>(
            `/api/public/products/${productId}`,
          )
          setItems([{ product: data.product, quantity: 1 }])
          return
        }

        const data = await apiRequest<{ items: CartItem[] }>('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems(data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load checkout')
      }
    }

    loadCheckout()
  }, [isAuthenticated, navigate, searchParams, token])

  const totals = items.reduce(
    (acc, item) => {
      const parsed = parsePrice(item.product.price)
      if (parsed === null) {
        return acc
      }
      return {
        count: acc.count + item.quantity,
        total: acc.total + parsed * item.quantity,
      }
    },
    { count: 0, total: 0 },
  )

  const hasPricedItems = totals.count > 0

  return (
    <section className="checkout-page">
      <header className="checkout-header">
        <div>
          <h1>{isGeorgian ? 'გადახდა' : 'Checkout'}</h1>
          <p>
            {isGeorgian
              ? 'გადახდის ეტაპი მალე დაემატება Stripe-ით.'
              : 'Stripe payment will be added next.'}
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled
        >
          {isGeorgian ? 'გადახდა მალე' : 'Payment coming soon'}
        </button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="checkout-grid">
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>{isGeorgian ? 'სია ცარიელია.' : 'No items to checkout.'}</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.product.id} className="checkout-card">
              <div className="checkout-image">
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
              <div className="checkout-body">
                <div className="checkout-title">
                  <h3>{item.product.name}</h3>
                  <span>{item.product.category}</span>
                </div>
                <p>{item.product.description || '-'}</p>
                <div className="checkout-meta">
                  <span>
                    {item.product.price ||
                      (isGeorgian ? 'ფასი მოთხოვნით' : 'Price on request')}
                  </span>
                  <span>
                    {isGeorgian ? 'რაოდენობა' : 'Qty'}: {item.quantity}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="checkout-summary">
        <div>
          <h2>{isGeorgian ? 'შეჯამება' : 'Summary'}</h2>
          <p>
            {isGeorgian
              ? 'გადახდა Stripe-ზე გადავა შემდეგ ეტაპზე.'
              : 'Payment will be handled by Stripe next.'}
          </p>
        </div>
        <div className="checkout-total">
          {hasPricedItems ? (
            <span>
              {isGeorgian ? 'ჯამი' : 'Total'}: ${totals.total.toFixed(2)}
            </span>
          ) : (
            <span>
              {isGeorgian
                ? 'ფასები დაკონკრეტდება.'
                : 'Prices will be confirmed.'}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

export default Checkout
