import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

// Funciones de autenticación
export const authService = {
  // Registrar usuario
  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    })

    if (error) throw error
    return data
  },

  // Iniciar sesión
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  },
}
