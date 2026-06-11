import { defineStore } from 'pinia'
import { groceryItems } from '@/data/groceryItems'

type GroceryStatus = 'fresh' | 'soon' | 'critical'

export interface GroceryItem {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: string
  location: string
  status: GroceryStatus
  favorite: boolean
  inShoppingList: boolean
  bought: boolean
  barcode?: string
}

const STORAGE_KEY = 'smart-grocery-items'

function calculateStatus(isoDate: string): GroceryStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(isoDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'critical'
  if (diffDays <= 3) return 'soon'
  return 'fresh'
}

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
    },

    shoppingListItems: (state) => {
      return state.items.filter((item) => item.inShoppingList)
    },

    openShoppingItems: (state) => {
      return state.items.filter((item) => item.inShoppingList && !item.bought)
    },

    boughtShoppingItems: (state) => {
      return state.items.filter((item) => item.inShoppingList && item.bought)
    },

    availableForShoppingList: (state) => {
      return state.items.filter((item) => !item.inShoppingList)
    }
  },

  actions: {
    loadItems() {
      const savedItems = localStorage.getItem(STORAGE_KEY)

      if (savedItems) {
        const parsed = JSON.parse(savedItems) as Omit<GroceryItem, 'inShoppingList' | 'bought'>[]
        this.items = parsed.map((item) => ({
          ...item,
          inShoppingList: (item as GroceryItem).inShoppingList ?? true,
          bought: (item as GroceryItem).bought ?? false,
          barcode: (item as GroceryItem).barcode ?? undefined
        }))
      } else {
        this.items = (groceryItems as Omit<GroceryItem, 'inShoppingList' | 'bought'>[]).map(
          (item) => ({
            ...item,
            inShoppingList: true,
            bought: false,
            barcode: (item as GroceryItem).barcode ?? undefined
          })
        )
        this.saveItems()
      }
    },

    saveItems() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    },

    addItem(
      newItem: Omit<GroceryItem, 'id' | 'status' | 'inShoppingList' | 'bought'> & {
        status?: GroceryStatus
        inShoppingList?: boolean
        bought?: boolean
        barcode?: string
      }
    ) {
      const expiryDate = newItem.expiryDate ?? ''
      const status: GroceryStatus = expiryDate ? calculateStatus(expiryDate) : 'fresh'

      // TODO: consider deduplication by barcode if needed
      this.items.push({
        id: Date.now(),
        ...newItem,
        status,
        inShoppingList: newItem.inShoppingList ?? false,
        bought: newItem.bought ?? false,
        favorite: newItem.favorite ?? false
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
    },

    toggleBought(id: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.bought = !item.bought
        this.saveItems()
      }
    },

    toggleInShoppingList(id: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.inShoppingList = !item.inShoppingList
        this.saveItems()
      }
    },

    clearBoughtItems() {
      this.items.forEach((item) => {
        if (item.inShoppingList && item.bought) {
          item.inShoppingList = false
          item.bought = false
        }
      })
      this.saveItems()
    },

    addToShoppingList(id: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.inShoppingList = true
        item.bought = false
        this.saveItems()
      }
    },

    removeFromShoppingList(id: number) {
      const item = this.items.find((item) => item.id === id)

      if (item) {
        item.inShoppingList = false
        item.bought = false
        this.saveItems()
      }
    },

    markShoppingItemAsPurchased(id: number, quantity: number, expiryDate: Date) {
      const item = this.items.find((item) => item.id === id)
      if (!item) return

      const safeQuantity = Math.max(1, Number(quantity) || 1)
      const isoDate = expiryDate.toISOString().split('T')[0] ?? ''

      item.quantity = Math.max(0, Number(item.quantity) || 0) + safeQuantity
      item.expiryDate = isoDate
      item.status = calculateStatus(isoDate)
      item.inShoppingList = false
      item.bought = false

      this.saveItems()
    },

    updateItem(updatedItem: GroceryItem) {
      const index = this.items.findIndex((item) => item.id === updatedItem.id)
      if (index === -1) return

      const existingItem = this.items[index] as GroceryItem

      this.items[index] = {
        ...existingItem,
        ...updatedItem,
        name: updatedItem.name.trim(),
        quantity: Math.max(0, Number(updatedItem.quantity) || 0),
        status: calculateStatus(updatedItem.expiryDate),
        favorite: existingItem.favorite,
        inShoppingList: existingItem.inShoppingList,
        bought: existingItem.bought
      }

      this.saveItems()
    }
  }
})