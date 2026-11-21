import { useAppSelector } from '@/store/hooks'

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth,
  )

  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    role: user?.role ?? null,
  }
}
