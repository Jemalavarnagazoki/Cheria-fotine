export type Language = 'ka' | 'en'

export const CATEGORY_DEFS = [
  {
    key: 'balaclavas',
    labels: { en: 'Balaclavas', ka: 'ბალაკლავები' },
  },
  {
    key: 'hats',
    labels: { en: 'Hats', ka: 'ქუდები' },
  },
  {
    key: 'scarves',
    labels: { en: 'Scarves', ka: 'შარფები' },
  },
  {
    key: 'gloves',
    labels: { en: 'Gloves', ka: 'ხელთათმანები' },
  },
  {
    key: 'sweaters',
    labels: { en: 'Sweaters', ka: 'სვიტერები' },
  },
  {
    key: 'accessories',
    labels: { en: 'Accessories', ka: 'აქსესუარები' },
  },
]

export const getCategoryOptions = (language: Language) =>
  CATEGORY_DEFS.map((category) => ({
    key: category.key,
    label: category.labels[language],
  }))

export const getCategoryLabel = (key: string, language: Language) =>
  CATEGORY_DEFS.find((category) => category.key === key)?.labels[language] || ''
