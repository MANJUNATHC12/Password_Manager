import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PrivateRoute } from '@/components/auth/PrivateRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { VaultPage } from '@/pages/VaultPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { StatementsPage } from '@/pages/StatementsPage'
import { GroceryPage } from '@/pages/GroceryPage'
import { GymPage } from '@/pages/GymPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <VaultPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <Layout>
              <DocumentsPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <PrivateRoute>
            <Layout>
              <ExpensesPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/statements"
        element={
          <PrivateRoute>
            <Layout>
              <StatementsPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/grocery"
        element={
          <PrivateRoute>
            <Layout>
              <GroceryPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/gym"
        element={
          <PrivateRoute>
            <Layout>
              <GymPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
