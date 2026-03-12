import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  }
}
