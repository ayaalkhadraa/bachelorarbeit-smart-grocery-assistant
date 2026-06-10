import { defineStore } from 'pinia'
import { groceryItems } from '@/data/groceryItems'

type GroceryStatus = 'fresh' | 'soon' | 'critical'

interface GroceryItem {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: string
  location: string
  status: GroceryStatus
  favorite: boolean
}

const STORAGE_KEY = 'smart-grocery-items'

export const useGroceryStore = defineStore('groceryStore', {
  state: () => ({
    items: [] as GroceryItem[]
  }),

  getters: {
    totalItems: (state) => state.items.length,

    freshItems: (state) => {
      return state.items.filter((item) => item.status === 'fresh')
    },

    soonExpiringItems: (state) => {
      return state.items.filter((item) => item.status === 'soon')
    },

    criticalItems: (state) => {
      return state.items.filter((item) => item.status === 'critical')
    },

    favoriteItems: (state) => {
      return state.items.filter((item) => item.favorite)
    }
  },

  actions: {
    loadItems() {
      const savedItems = localStorage.getItem(STORAGE_KEY)

      if (savedItems) {
        this.items = JSON.parse(savedItems) as GroceryItem[]
      } else {
        this.items = groceryItems as GroceryItem[]
        this.saveItems()
      }
    },

    saveItems() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    },

    addItem(newItem: Omit<GroceryItem, 'id'>) {
      this.items.push({
        id: Date.now(),
        ...newItem
      })

      this.saveItems()
    },

    deleteItem(id: number) {
      this.items = this.items.filter((item) => item.id !== id)
      this.saveItems()
    },

    toggleFavorite(id: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.favorite = !item.favorite
        this.saveItems()
      }
    },

    updateQuantity(id: number, quantity: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.quantity = quantity
        this.saveItems()
      }
    }
  }
})