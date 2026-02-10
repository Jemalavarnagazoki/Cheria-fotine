import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest, getApiBase } from '../api'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_DEFS, getCategoryLabel } from '../constants/categories'

interface Product {
  id: string
  name: string
  category: string
  price: string
  description: string
  images: string[]
  createdAt: string
}

const Category = ({ language }: { language: 'ka' | 'en' }) => {
  const { categoryKey } = useParams()
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const apiBase = useMemo(() => getApiBase(), [])
  const isGeorgian = language === 'ka'

  const categoryDef = useMemo(
    () => CATEGORY_DEFS.find((category) => category.key === categoryKey),
    [categoryKey],
  )

  const categoryLabel = categoryDef
    ? getCategoryLabel(categoryDef.key, language)
    : ''

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiRequest<{ products: Product[] }>(
          '/api/public/products',
        )
        setProducts(data.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load products')
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = categoryDef
    ? products.filter((product) =>
        [categoryDef.labels.en, categoryDef.labels.ka].includes(product.category),
      )
    : []

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await apiRequest('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      setActionMessage(
        isGeorgian ? 'კალათაში დამატებულია.' : 'Added to cart.',
      )
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : 'Unable to add to cart',
      )
    }
  }

  const handleBuyNow = async (productId: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    navigate(`/checkout?productId=${productId}`)
  }

  if (!categoryDef) {
    return (
      <section className="catalog-section">
        <div className="catalog-header">
          <h2>{isGeorgian ? 'კატეგორია ვერ მოიძებნა' : 'Category not found'}</h2>
          <p>
            {isGeorgian
              ? 'გთხოვ აირჩიე კატეგორია მენიუდან.'
              : 'Please choose a category from the menu.'}
          </p>
          <Link className="ghost-button" to="/">
            {isGeorgian ? 'მთავარზე დაბრუნება' : 'Back to home'}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="catalog-section">
      <div className="catalog-header">
        <h2>
          {isGeorgian ? 'კატეგორია' : 'Category'}: {categoryLabel}
        </h2>
        <p>
          {isGeorgian
            ? 'ნახე ამ კატეგორიის ხელნაკეთი ნივთები.'
            : 'Browse handmade pieces in this category.'}
        </p>
      </div>
      {actionMessage ? <p className="form-note">{actionMessage}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="catalog-grid">
        {filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <p>
              {isGeorgian
                ? 'ამ კატეგორიაში არაფერი მოიძებნა.'
                : 'No items found in this category.'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <article key={product.id} className="catalog-card">
              {product.images.length ? (
                <img
                  src={
                    product.images[0].startsWith('http')
                      ? product.images[0]
                      : `${apiBase}${product.images[0]}`
                  }
                  alt={product.name}
                />
              ) : (
                <div className="catalog-placeholder">No image yet</div>
              )}
              <div className="catalog-body">
                <div className="catalog-top">
                  <h3>{product.name}</h3>
                  <span>{product.category}</span>
                </div>
                <p>
                  {product.description ||
                    (isGeorgian
                      ? 'აღწერა მალე დაემატება.'
                      : 'Details coming soon.')}
                </p>
                <div className="catalog-meta">
                  <span>
                    {product.price ||
                      (isGeorgian ? 'ფასი მოთხოვნით' : 'Price on request')}
                  </span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="catalog-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleAddToCart(product.id)}
                  >
                    {isGeorgian ? 'კალათაში' : 'Add to cart'}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleBuyNow(product.id)}
                  >
                    {isGeorgian ? 'ყიდვა' : 'Buy now'}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default Category
