import type { Router } from 'vue-router'

export function logout(router: Pick<Router, 'push'>): void {
  localStorage.removeItem('smart-grocery-demo-user')
  router.push('/login')
}