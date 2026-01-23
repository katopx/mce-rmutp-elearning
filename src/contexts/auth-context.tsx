'use client'

import GlobalLoading from '@/components/layout/common/GlobalLoading'
import { auth } from '@/lib/firebase/config'
import { syncUserDatabase } from '@/lib/firebase'
import { deleteCookie, setCookie } from 'cookies-next'
import { onAuthStateChanged, User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  role: 'admin' | 'instructor' | 'student' | null
  userData: any | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userData: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'admin' | 'instructor' | 'student' | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true)

      if (currentUser) {
        try {
          const data = await syncUserDatabase(currentUser)

          if (data) {
            const userRole = data.role || 'student'
            setUser(currentUser)
            setRole(userRole)
            setUserData(data)

            // บันทึก Cookies
            setCookie('session', currentUser.uid, { maxAge: 60 * 60 * 24 * 7 })
            setCookie('user_role', userRole, { maxAge: 60 * 60 * 24 * 7 })
          }
        } catch (error) {
          console.error('Auth Context Error:', error)
        }
      } else {
        setUser(null)
        setRole(null)
        setUserData(null)
        deleteCookie('session')
        deleteCookie('user_role')
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, userData, loading }}>
      {loading ? <GlobalLoading /> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
