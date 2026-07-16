import { defineStore } from 'pinia'
import { groceryItems } from '@/data/groceryItems'
import { getExpiryInfo } from '@/utils/expiryUtils'

type GroceryStatus = 'fresh' | 'soon' | 'critical'

const INITIAL_INVENTORY_ITEM_IDS = new Set(groceryItems.map((item) => item.id))

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
  sourceInventoryItemId?: number
}

const STORAGE_KEY = 'smart-grocery-items'

function normalizePurchasedExpiryDate(expiryDate: Date | string | null | undefined): string {
  if (!expiryDate) return ''

  if (expiryDate instanceof Date) {
    return Number.isNaN(expiryDate.getTime()) ? '' : expiryDate.toISOString().split('T')[0] ?? ''
  }

  const trimmedValue = expiryDate.trim()
  if (!trimmedValue) return ''

  const normalizedValue = trimmedValue.length === 10 ? `${trimmedValue}T12:00:00` : trimmedValue
  const parsedDate = new Date(normalizedValue)

  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString().split('T')[0] ?? ''
}

function calculateStatus(isoDate: string): GroceryStatus {
  const { status } = getExpiryInfo(isoDate)
  if (status === 'expired' || status === 'today') return 'critical'
  if (status === 'soon') return 'soon'
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
          barcode: (item as GroceryItem).barcode ?? undefined,
          sourceInventoryItemId:
            (item as GroceryItem).sourceInventoryItemId ??
            (INITIAL_INVENTORY_ITEM_IDS.has(item.id) ? item.id : undefined)
        }))
      } else {
        this.items = (groceryItems as Omit<GroceryItem, 'inShoppingList' | 'bought'>[]).map(
          (item) => ({
            ...item,
            inShoppingList: true,
            bought: false,
            barcode: (item as GroceryItem).barcode ?? undefined,
            sourceInventoryItemId: item.id
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
        sourceInventoryItemId?: number
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
        favorite: newItem.favorite ?? false,
        sourceInventoryItemId: newItem.sourceInventoryItemId
      })

      this.saveItems()
    },
    

    addManualShoppingListItem(newItem: {
      name: string
      category: string
      quantity: number
    }): boolean {
      const trimmedName = newItem.name.trim()

      if (!trimmedName) {
        return false
      }

      this.addItem({
        name: trimmedName,
        category: newItem.category,
        quantity: Math.max(1, Number(newItem.quantity) || 1),
        unit: 'Stück',
        expiryDate: '',
        location: 'Küche',
        favorite: false,
        inShoppingList: true,
        bought: false
      })

      return true
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
        if (item.inShoppingList) {
          item.sourceInventoryItemId = item.sourceInventoryItemId ?? item.id
        }
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
        item.sourceInventoryItemId = item.sourceInventoryItemId ?? item.id
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

    markShoppingItemAsPurchased(id: number, quantity: number, expiryDate?: Date | string | null) {
      const item = this.items.find((item) => item.id === id)
      if (!item) return

      const safeQuantity = Math.max(1, Number(quantity) || 1)
      const isoDate = normalizePurchasedExpiryDate(expiryDate)

      const sourceItem =
        item.sourceInventoryItemId !== undefined
          ? this.items.find((candidate) => candidate.id === item.sourceInventoryItemId)
          : null

      if (sourceItem && sourceItem.id !== item.id) {
        sourceItem.quantity = Math.max(0, Number(sourceItem.quantity) || 0) + safeQuantity
        sourceItem.expiryDate = isoDate
        sourceItem.status = isoDate ? calculateStatus(isoDate) : 'fresh'
        sourceItem.inShoppingList = false
        sourceItem.bought = false

        this.items = this.items.filter((candidate) => candidate.id !== item.id)
        this.saveItems()
        return
      }

      if (sourceItem && sourceItem.id === item.id) {
        item.quantity = Math.max(0, Number(item.quantity) || 0) + safeQuantity
        item.expiryDate = isoDate
        item.status = isoDate ? calculateStatus(isoDate) : 'fresh'
        item.inShoppingList = false
        item.bought = false

        this.saveItems()
        return
      }

      item.quantity = safeQuantity
      item.expiryDate = isoDate
      item.status = isoDate ? calculateStatus(isoDate) : 'fresh'
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