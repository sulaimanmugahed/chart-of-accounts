import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { SelectedCompanyProvider } from '@/hooks/useSelectedCompany'
import { createQueryClient } from '@/lib/query-client'
import { App } from './App'
import './styles/index.css'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SelectedCompanyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SelectedCompanyProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
