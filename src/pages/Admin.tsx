import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, getApiBase } from '../api'
import { useAuth } from '../context/AuthContext'
import { getCategoryOptions } from '../constants/categories'

interface Product {
  id: string
  name: string
  category: string
  price: string
  description: string
  images: string[]
  createdAt: string
}

const Admin = ({ language }: { language: 'ka' | 'en' }) => {
  const navigate = useNavigate()
  const { token, email, isAuthenticated, isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
  })

  const apiBase = useMemo(() => getApiBase(), [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!isAdmin) {
      navigate('/')
      return
    }

    const loadProducts = async () => {
      try {
        const data = await apiRequest<{ products: Product[] }>('/api/products', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProducts(data.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load products')
      }
    }

    loadProducts()
  }, [isAuthenticated, isAdmin, navigate, token])

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('category', form.category)
      data.append('price', form.price)
      data.append('description', form.description)

      if (files) {
        Array.from(files).forEach((file) => data.append('images', file))
      }

      const response = await apiRequest<{ product: Product }>('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })

      setProducts((prev) => [response.product, ...prev])
      setForm({ name: '', category: '', price: '', description: '' })
      setFiles(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    setIsDeleting(productId)
    setError('')

    try {
      await apiRequest(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setProducts((prev) => prev.filter((product) => product.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    await handleDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  const isGeorgian = language === 'ka'
  const categories = useMemo(
    () => getCategoryOptions(isGeorgian ? 'ka' : 'en'),
    [isGeorgian],
  )

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <h1>{isGeorgian ? 'ადმინ პანელი' : 'Admin panel'}</h1>
          <p>
            {isGeorgian
              ? `შესული ხარ როგორც ${email || 'მფლობელი'}.`
              : `Signed in as ${email || 'owner'}.`}
          </p>
        </div>
      </header>

      <div className="admin-grid">
        <form className="admin-card" onSubmit={handleUpload}>
          <h2>{isGeorgian ? 'პროდუქტის ატვირთვა' : 'Upload product'}</h2>
          <label>
            {isGeorgian ? 'პროდუქტის სახელი' : 'Product name'}
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={
                isGeorgian ? 'ქსოვილი ბალაკლავა' : 'Crocheted balaclava'
              }
              required
            />
          </label>
          <label>
            {isGeorgian ? 'კატეგორია' : 'Category'}
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">
                {isGeorgian ? 'აირჩიე კატეგორია' : 'Select a category'}
              </option>
              {categories.map((category) => (
                <option key={category.key} value={category.label}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {isGeorgian ? 'ფასი' : 'Price'}
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder={isGeorgian ? '120 ₾' : '$120'}
            />
          </label>
          <label>
            {isGeorgian ? 'აღწერა' : 'Description'}
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={
                isGeorgian
                  ? 'ძაფის ტიპი, ზომები და სტილის იდეები.'
                  : 'Yarn blend, size notes, and styling ideas.'
              }
            />
          </label>
          <label className="file-input">
            {isGeorgian ? 'ფოტოები' : 'Images'}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(event) => setFiles(event.target.files)}
            />
          </label>
          {error ? <span className="form-error">{error}</span> : null}
          <button type="submit" disabled={isSaving}>
            {isSaving
              ? isGeorgian
                ? 'იტვირთება...'
                : 'Uploading...'
              : isGeorgian
                ? 'ატვირთე პროდუქტი'
                : 'Upload product'}
          </button>
        </form>

        <div className="admin-card">
          <h2>{isGeorgian ? 'ატვირთული პროდუქტები' : 'Uploaded products'}</h2>
          <div className="product-grid">
            {products.length === 0 ? (
              <p className="empty-state">
                {isGeorgian
                  ? 'ჯერ არაფერი ატვირთულა. დაიწყე პირველით.'
                  : 'No products yet. Upload your first crochet piece to start the catalog.'}
              </p>
            ) : (
              products.map((product) => (
                <article key={product.id} className="product-card">
                  <button
                    type="button"
                    className="product-delete"
                    onClick={() =>
                      setDeleteTarget({
                        id: product.id,
                        name: product.name,
                      })
                    }
                    disabled={isDeleting === product.id}
                    aria-label={
                      isGeorgian ? 'პროდუქტის წაშლა' : 'Delete product'
                    }
                  >
                    ×
                  </button>
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span>{product.category}</span>
                  </div>
                  <p>{product.description || 'No description yet.'}</p>
                  <div className="product-meta">
                    <span>
                      {product.price ||
                        (isGeorgian ? 'ფასი მოგვიანებით' : 'Price TBD')}
                    </span>
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                  {product.images.length ? (
                    <div className="product-images">
                      {product.images.map((image) => (
                        <img
                          key={image}
                          src={image.startsWith('http') ? image : `${apiBase}${image}`}
                          alt={product.name}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>{isGeorgian ? 'წაშლა' : 'Delete product'}</h3>
            <p>
              {isGeorgian
                ? `ნამდვილად გსურთ წაშლა: ${deleteTarget.name}?`
                : `Are you sure you want to delete ${deleteTarget.name}?`}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDeleteTarget(null)}
              >
                {isGeorgian ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting === deleteTarget.id}
              >
                {isDeleting === deleteTarget.id
                  ? isGeorgian
                    ? 'იშლება...'
                    : 'Deleting...'
                  : isGeorgian
                    ? 'წაშლა'
                    : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Admin
