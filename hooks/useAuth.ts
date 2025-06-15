"use client"

import { useState, useEffect } from "react"
import { authService, type User } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener usuario inicial
    authService
      .getCurrentUser()
      .then((user) => {
        setUser(user as User)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = authService.onAuthStateChange((user) => {
      setUser(user as User)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signIn(email, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true)
    try {
      await authService.signUp(email, password, name)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
