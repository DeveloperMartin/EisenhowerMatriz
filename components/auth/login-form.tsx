"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Mail, Lock, User, Grid3X3 } from "lucide-react"

export function LoginForm() {
  const { signIn, signUp, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("signin")

  const validateForm = (isSignUp = false) => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (isSignUp) {
      if (!formData.name) {
        newErrors.name = "El nombre es requerido"
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await signIn(formData.email, formData.password)
    } catch (error: any) {
      setErrors({ general: error.message || "Error al iniciar sesión" })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm(true)) return

    try {
      await signUp(formData.email, formData.password, formData.name)
      setErrors({ general: "Cuenta creada exitosamente. Revisa tu email para confirmar." })
    } catch (error: any) {
      setErrors({ general: error.message || "Error al crear cuenta" })
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Matriz Eisenhower</CardTitle>
          </div>
          <p className="text-sm text-gray-600">Organiza tus tareas por prioridad</p>
        </CardHeader>

        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-8">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white text-xs">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white text-xs">
                Crear Cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="tu@email.com"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      placeholder="••••••••"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password}</p>}
                </div>

                {errors.general && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700">{errors.general}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 h-8 text-sm" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Tu nombre"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="tu@email.com"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      placeholder="••••••••"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Confirmar Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      className="pl-7 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword}</p>}
                </div>

                {errors.general && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700">{errors.general}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 h-8 text-sm" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Al continuar, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
