import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // لا نعيد المحاولة مع أخطاء التحقق (4xx) فهي أخطاء منطقية
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
