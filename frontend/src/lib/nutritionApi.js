import { api } from './api.js'

const directProduct = async barcode => {
  const fields = 'code,product_name,brands,quantity,serving_size,serving_quantity,nutriments,image_front_small_url'
  const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}?fields=${fields}`)
  if (!response.ok) throw new Error('Product lookup failed')
  const data = await response.json()
  if (!data.product) return { found: false, barcode }
  const p = data.product
  const n = p.nutriments || {}
  return {
    found: true,
    food: {
      name: p.product_name || `Product ${barcode}`,
      brand: p.brands || '',
      barcode: String(p.code || barcode),
      source: 'openfoodfacts',
      per100: {
        calories: Number(n['energy-kcal_100g']) || 0,
        protein: Number(n.proteins_100g) || 0,
        carbs: Number(n.carbohydrates_100g) || 0,
        fat: Number(n.fat_100g) || 0,
        fiber: Number(n.fiber_100g) || 0,
      },
      serving: {
        label: p.serving_size || '',
        grams: Number(p.serving_quantity) || null,
      },
      image: p.image_front_small_url || null,
    },
  }
}

export async function lookupProduct(barcode) {
  const clean = String(barcode || '').replace(/[^0-9]/g, '')
  if (clean.length < 8 || clean.length > 14) throw new Error('Enter a valid EAN or UPC barcode')
  try {
    return await api(`/api/nutrition/product?barcode=${encodeURIComponent(clean)}`)
  } catch (error) {
    if (![401, 404, 503].includes(error.status)) throw error
    return directProduct(clean)
  }
}

export const searchMealie = query => api(`/api/nutrition/mealie/recipes?q=${encodeURIComponent(query || '')}`)

export const getMealieRecipe = slug => api(`/api/nutrition/mealie/recipe?slug=${encodeURIComponent(slug)}`)

export const requestCoach = payload => api('/api/coach/recommend', {
  method: 'POST',
  body: JSON.stringify(payload),
})

