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
  inShoppingList: boolean
  bought: boolean
  barcode?: string
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

    addItem(newItem: Omit<GroceryItem, 'id' | 'inShoppingList' | 'bought'> & { barcode?: string }) {
      this.items.push({
        id: Date.now(),
        ...newItem,
        inShoppingList: true,
        bought: false
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
    }
  }
})