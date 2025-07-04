"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  Archive,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Link,
  Search,
  Phone,
  User,
  MessageCircle,
  Loader2,
  HelpCircle,
  Grid3X3,
  Focus,
  Zap,
  ExternalLinkIcon,
  CalendarDays,
  Copy,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Timer,
  Pause,
  Play,
  X,
  Settings,
  Book,
} from "lucide-react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"

import { useAuth } from "@/hooks/useAuth"
import { databaseService, type DatabaseTask, type TaskStats } from "@/lib/database"
import { LoginForm } from "@/components/auth/login-form"

type QuadrantType = "doNow" | "schedule" | "delegate" | "minimize" | "trash"

interface Task {
  id: string
  title: string
  description?: string
  project?: string
  assignedTo?: string
  completed?: boolean
  duration_minutes?: number
  createdAt: Date
  quadrant?: QuadrantType
}

interface Project {
  id: string
  name: string
  tasks: Task[]
}

interface WhatsAppContact {
  id: string
  name: string
  phone: string
  category?: string
  lastUsed?: Date
}

interface CustomLink {
  id: string
  name: string
  url: string
  type: string
  phone?: string
  message?: string
}

interface DayData {
  date: string
  tasks: {
    doNow: Task[]
    schedule: Task[]
    delegate: Task[]
    minimize: Task[]
    trash: Task[]
  }
  customLinks: CustomLink[]
}

// Simulación de API de contactos
class ContactsAPI {
  private static contacts: WhatsAppContact[] = [
    { id: "1", name: "Juan Pérez", phone: "+5493489659359", category: "Trabajo" },
    { id: "2", name: "María García", phone: "+5491123456789", category: "Familia" },
    { id: "3", name: "Carlos López", phone: "+5493487654321", category: "Trabajo" },
    { id: "4", name: "Ana Martínez", phone: "+5491198765432", category: "Amigos" },
    { id: "5", name: "Roberto Silva", phone: "+5493481234567", category: "Trabajo" },
    { id: "6", name: "Laura Rodríguez", phone: "+5491187654321", category: "Familia" },
    { id: "7", name: "Diego Fernández", phone: "+5493489876543", category: "Amigos" },
    { id: "8", name: "Sofía González", phone: "+5491176543210", category: "Trabajo" },
  ]

  static async searchContacts(
    query = "",
    page = 1,
    limit = 20,
    category?: string,
  ): Promise<{
    contacts: WhatsAppContact[]
    total: number
    hasMore: boolean
  }> {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 150))

    let filtered = this.contacts

    // Filtrar por búsqueda
    if (query) {
      const searchTerm = query.toLowerCase()
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.phone.includes(searchTerm) ||
          (contact.category && contact.category.toLowerCase().includes(searchTerm)),
      )
    }

    // Filtrar por categoría
    if (category) {
      filtered = filtered.filter((contact) => contact.category === category)
    }

    // Paginación
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedContacts = filtered.slice(start, end)

    return {
      contacts: paginatedContacts,
      total: filtered.length,
      hasMore: end < filtered.length,
    }
  }

  static async getContactById(id: string): Promise<WhatsAppContact | null> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return this.contacts.find((contact) => contact.id === id) || null
  }

  static async addContact(contact: Omit<WhatsAppContact, "id">): Promise<WhatsAppContact> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const newContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    this.contacts.push(newContact)
    return newContact
  }

  static async importContacts(contacts: Omit<WhatsAppContact, "id">[]): Promise<WhatsAppContact[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const newContacts = contacts.map((contact, index) => ({
      ...contact,
      id: `imported_${Date.now()}_${index}`,
    }))
    this.contacts.push(...newContacts)
    return newContacts
  }

  static async getStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    const byCategory: Record<string, number> = {}
    this.contacts.forEach((contact) => {
      const category = contact.category || "Sin categoría"
      byCategory[category] = (byCategory[category] || 0) + 1
    })
    return {
      total: this.contacts.length,
      byCategory,
    }
  }

  static parseVCardFile(vCardContent: string): Omit<WhatsAppContact, "id">[] {
    const contacts: Omit<WhatsAppContact, "id">[] = []
    const vCardBlocks = vCardContent.split("BEGIN:VCARD").filter((block) => block.trim())

    vCardBlocks.forEach((block) => {
      try {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)

        let name = ""
        let phone = ""

        lines.forEach((line) => {
          if (line.startsWith("FN:")) {
            name = line.replace("FN:", "").trim()
          }
          if (line.includes("TEL") && line.includes(":")) {
            const phoneMatch = line.split(":")[1]
            if (phoneMatch) {
              phone = phoneMatch.trim()
              if (!phone.startsWith("+")) {
                if (phone.startsWith("9 ")) {
                  phone = "+54 " + phone
                } else if (phone.match(/^\d/)) {
                  phone = "+54 9 " + phone
                }
              }
            }
          }
        })

        if (name && phone) {
          contacts.push({
            name: name,
            phone: phone,
            category: "Importado",
            lastUsed: new Date(),
          })
        }
      } catch (error) {
        console.warn("Error parsing vCard block:", error)
      }
    })

    return contacts
  }
}

const INITIAL_PROJECTS = [
  "Project Manager Antares",
  "Bautec Deposito",
  "CMP Sige",
  "Musica",
  "Relación",
  "Familia",
  "Amigos",
  "hasan",
]

const DEFAULT_DELEGATION_CONTACTS = [
  { id: "chatgpt", name: "ChatGPT", type: "AI", url: "https://chat.openai.com" },
  { id: "claude", name: "Claude", type: "AI", url: "https://claude.ai" },
  { id: "v0", name: "v0", type: "AI", url: "https://v0.dev/community" },
  { id: "Jira", name: "Jira", type: "Jira", url: "https://antarestechnologies.atlassian.net/jira/software/c/projects/MHS/boards/564" },
  { id: "Figma", name: "Figma", type: "Figma", url: "https://www.figma.com/files/team/1271555205494061869/recents-and-sharing?fuid=1271555203491090310" },
]

// Hook personalizado para debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EisenhowerMatrix() {
  const { user, loading: authLoading, signOut } = useAuth()

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return <LoginForm />
  }

  // Si hay usuario, mostrar la aplicación principal
  return <EisenhowerMatrixApp user={user} onSignOut={signOut} />
}

function EisenhowerMatrixApp({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dayData, setDayData] = useState<DayData>({
    date: new Date().toISOString().split("T")[0],
    tasks: {
      doNow: [],
      schedule: [],
      delegate: [],
      minimize: [],
      trash: [],
    },
    customLinks: [],
  })

  const [projects, setProjects] = useState<Project[]>([])

  // Estados separados para evitar el bug del modal
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false)
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: "", description: "", project: "" })
  const [linkForm, setLinkForm] = useState({
    name: "",
    url: "",
    type: "Custom",
    phone: "",
    message: "",
  })

  // Estados para expandir secciones
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)

  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", project: "" })
  const [keepOriginalTask, setKeepOriginalTask] = useState(true)

  const [isAssignProjectDialogOpen, setIsAssignProjectDialogOpen] = useState(false)
  const [assigningTask, setAssigningTask] = useState<Task | null>(null)
  const [assignProjectForm, setAssignProjectForm] = useState({ project: "" })

  // Estados para el asistente de tareas
  const [isTaskWizardOpen, setIsTaskWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardAnswers, setWizardAnswers] = useState({
    title: "",
    isUrgent: "",
    isImportant: "",
    hasDetails: "",
    description: "",
    belongsToProject: "",
    project: "",
    canDelegate: "",
  })

  // Estado para el launcher de aplicaciones
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false)

  // Estados para animaciones y transiciones
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Estado para el selector de fecha
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const [syncLoading, setSyncLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState<{ id: string; quadrant: QuadrantType } | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number>(0)

  // Estado para mostrar/ocultar el menú de propina
  const [showTipMenu, setShowTipMenu] = useState(false)

  // Estado para las estadísticas
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })
  }

  const navigateDay = (direction: "prev" | "next") => {
    setIsTransitioning(true)

    setTimeout(() => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
      setCurrentDate(newDate)
      loadDayData(newDate)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 200)
    }, 100)
  }

  const jumpToDate = (date: Date) => {
    setIsTransitioning(true)

    setTimeout(() => {
      setCurrentDate(date)
      loadDayData(date)
      setIsDatePickerOpen(false)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 200)
    }, 100)
  }

  const loadDayData = async (date: Date) => {
    const dateKey = date.toISOString().split("T")[0]
    setSyncLoading(true)

    try {
      // Cargar tareas desde la base de datos
      const dbTasks = await databaseService.getTasks(user.id, dateKey)
      const dbLinks = await databaseService.getCustomLinks(user.id)

      // Convertir tareas de la base de datos al formato local
      const tasksByQuadrant: Record<QuadrantType, Task[]> = {
        doNow: [],
        schedule: [],
        delegate: [],
        minimize: [],
        trash: [],
      }

      dbTasks.forEach((dbTask) => {
        const task: Task = {
          id: dbTask.id,
          title: dbTask.title,
          description: dbTask.description,
          project: dbTask.project,
          completed: dbTask.completed,
          duration_minutes: dbTask.duration_minutes,
          createdAt: new Date(dbTask.created_at),
          quadrant: dbTask.quadrant as QuadrantType,
        }
        const quadrant = dbTask.quadrant as QuadrantType
        if (tasksByQuadrant[quadrant]) {
          tasksByQuadrant[quadrant].push(task)
        }
      })

      // Convertir enlaces de la base de datos al formato local
      const customLinks: CustomLink[] = dbLinks.map((dbLink) => ({
        id: dbLink.id,
        name: dbLink.name,
        url: dbLink.url,
        type: dbLink.type,
        phone: dbLink.phone,
        message: dbLink.message,
      }))

      setDayData({
        date: dateKey,
        tasks: tasksByQuadrant,
        customLinks,
      })

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error loading data:", error)
      // Fallback a localStorage si hay error
      const saved = localStorage.getItem(`eisenhower-${dateKey}`)
      if (saved) {
        const data = JSON.parse(saved)
        setDayData(data)
      } else {
        setDayData({
          date: dateKey,
          tasks: {
            doNow: [],
            schedule: [],
            delegate: [],
            minimize: [],
            trash: [],
          },
          customLinks: [],
        })
      }
    } finally {
      setSyncLoading(false)
    }
  }

  const loadTaskStats = async () => {
    setStatsLoading(true)
    try {
      const stats = await databaseService.getTaskStats(user.id)
      setTaskStats(stats)
    } catch (error) {
      console.error("Error loading task stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    const initialProjects = INITIAL_PROJECTS.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      tasks: [],
    }))
    setProjects(initialProjects)
    loadDayData(currentDate)
    loadTaskStats()
  }, [currentDate, user])

  // Lógica de categorización automática
  const determineQuadrant = (title: string, description: string, project: string): QuadrantType => {
    if (title && description && project) return "delegate"
    if (title && description) return "schedule"
    if (title && project) return "schedule"
    if (title) return "minimize" // Solo título = backlog
    return "minimize"
  }

  const addTask = async () => {
    if (!taskForm.title.trim()) return

    const quadrant = determineQuadrant(taskForm.title, taskForm.description, taskForm.project)

    const task: Task = {
      id: Date.now().toString(),
      title: taskForm.title,
      description: taskForm.description,
      project: taskForm.project,
      completed: false,
      duration_minutes: undefined,
      createdAt: new Date(),
      quadrant,
    }

    try {
      // Guardar en la base de datos
      const dbTask = await databaseService.createTask(user.id, {
        title: task.title,
        description: task.description,
        project: task.project,
        quadrant,
        completed: false,
        duration_minutes: undefined,
        date: dayData.date,
      })

      // Actualizar el estado local con el ID real de la DB
      const taskWithDbId = { ...task, id: dbTask.id }

      setDayData((prev) => {
        const newData = {
          ...prev,
          tasks: {
            ...prev.tasks,
            [quadrant]: [...prev.tasks[quadrant], taskWithDbId],
          },
        }
        localStorage.setItem(`eisenhower-${dayData.date}`, JSON.stringify(newData))
        return newData
      })

      setTaskForm({ title: "", description: "", project: "" })
      setIsAddTaskDialogOpen(false)
      setLastSyncTime(new Date())
      
      // Actualizar estadísticas
      await loadTaskStats()
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Error al crear la tarea. Inténtalo de nuevo.")
    }
  }

  // Función para generar URL de WhatsApp
  const generateWhatsAppUrl = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, "")
      return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedMessage}`
    } else {
      return `https://wa.me/?text=${encodedMessage}`
    }
  }

  // Seleccionar contacto de WhatsApp
  const selectContact = (contact: WhatsAppContact) => {
    setSelectedContact(contact)
    setLinkForm((prev) => ({
      ...prev,
      name: contact.name,
      phone: contact.phone,
      type: "WhatsApp",
    }))
    setIsContactSelectorOpen(false)
  }

  const addCustomLink = async () => {
    if (!linkForm.name.trim()) return

    let finalUrl = linkForm.url

    if (linkForm.type === "WhatsApp") {
      if (!linkForm.message.trim()) {
        alert("El mensaje es requerido para enlaces de WhatsApp")
        return
      }
      finalUrl = generateWhatsAppUrl(linkForm.phone, linkForm.message)
    } else if (!linkForm.url.trim()) {
      alert("La URL es requerida")
      return
    }

    try {
      // Guardar en la base de datos
      const dbLink = await databaseService.createCustomLink(user.id, {
        name: linkForm.name,
        url: finalUrl,
        type: linkForm.type,
        phone: linkForm.phone,
        message: linkForm.message,
      })

      const newLink: CustomLink = {
        id: dbLink.id,
        name: dbLink.name,
        url: dbLink.url,
        type: dbLink.type,
        phone: dbLink.phone,
        message: dbLink.message,
      }

      setDayData((prev) => ({
        ...prev,
        customLinks: [...prev.customLinks, newLink],
      }))

      setLinkForm({ name: "", url: "", type: "Custom", phone: "", message: "" })
      setSelectedContact(null)
      setIsAddLinkDialogOpen(false)
      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error creating custom link:", error)
      alert("Error al crear el enlace. Inténtalo de nuevo.")
    }
  }

  const deleteCustomLink = (linkId: string) => {
    setDayData((prev) => ({
      ...prev,
      customLinks: prev.customLinks.filter((link) => link.id !== linkId),
    }))
  }

  const updateTaskInDb = async (taskId: string, updates: Partial<DatabaseTask>) => {
    try {
      console.log('Actualizando tarea:', { taskId, updates })
      const result = await databaseService.updateTask(taskId, {
        ...updates,
        date: dayData.date // Asegurarnos de mantener la fecha
      })
      console.log('Tarea actualizada:', result)
      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTaskFromDb = async (taskId: string) => {
    try {
      await databaseService.deleteTask(taskId)
      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const completeTask = async (taskId: string, quadrant: QuadrantType) => {
    const task = dayData.tasks[quadrant].find((t) => t.id === taskId)
    if (!task) return

    if (!task.completed) {
      // Mostrar SIEMPRE el diálogo de duración al completar, sin importar el cuadrante
      setCompletingTask({ id: taskId, quadrant })
      setIsDurationDialogOpen(true)
      return
    }

    // Si la tarea ya está completada, simplemente desmarcarla
    const newCompleted = false
    setDayData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [quadrant]: prev.tasks[quadrant].map((task) =>
          task.id === taskId ? { ...task, completed: newCompleted, duration_minutes: undefined } : task,
        ),
      },
    }))

    // Sincronizar con la base de datos
    await updateTaskInDb(taskId, { 
      completed: newCompleted, 
      duration_minutes: undefined,
      quadrant: quadrant,
      date: dayData.date
    })

    // Actualizar estadísticas
    await loadTaskStats()
  }

  const handleDurationSubmit = async () => {
    if (!completingTask) return

    const { id, quadrant } = completingTask
    const task = dayData.tasks[quadrant].find((t) => t.id === id)
    if (!task) return

    const newCompleted = true
    setDayData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [quadrant]: prev.tasks[quadrant].map((task) =>
          task.id === id ? { ...task, completed: newCompleted, duration_minutes: durationMinutes } : task,
        ),
      },
    }))

    // Sincronizar con la base de datos
    await updateTaskInDb(id, { completed: newCompleted, duration_minutes: durationMinutes })

    // Actualizar estadísticas
    await loadTaskStats()

    // Resetear el estado
    setDurationMinutes(0)
    setCompletingTask(null)
    setIsDurationDialogOpen(false)
  }

  const deleteTask = async (taskId: string, quadrant: QuadrantType) => {
    const task = dayData.tasks[quadrant].find((t) => t.id === taskId)
    if (!task) return

    if (quadrant === "trash") {
      // Si la tarea está en la basura, eliminarla permanentemente
      setDayData((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          trash: prev.tasks.trash.filter((t) => t.id !== taskId),
        },
      }))

      // Eliminar de la base de datos
      await deleteTaskFromDb(taskId)
    } else {
      // Si la tarea está en cualquier otro cuadrante, moverla a la basura
      setDayData((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [quadrant]: prev.tasks[quadrant].filter((t) => t.id !== taskId),
          trash: [...prev.tasks.trash, task],
        },
      }))

      // Actualizar en la base de datos
      await updateTaskInDb(taskId, { quadrant: "trash" })
    }
  }

  const moveTask = async (taskId: string, from: QuadrantType, to: QuadrantType) => {
    const task = dayData.tasks[from].find((t) => t.id === taskId)
    if (!task) return

    setDayData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [from]: prev.tasks[from].filter((t) => t.id !== taskId),
        [to]: [...prev.tasks[to], task],
      },
    }))

    // Sincronizar con la base de datos
    await updateTaskInDb(taskId, { quadrant: to })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      project: task.project || "",
    })
    setKeepOriginalTask(true)
    setIsEditTaskDialogOpen(true)
  }

  const saveEditedTask = () => {
    if (!editTaskForm.title.trim() || !editingTask) return

    // Detectar si la tarea original viene de minimizar y solo tiene título
    let quadrant = determineQuadrant(editTaskForm.title, editTaskForm.description, editTaskForm.project)
    if (
      editingTask.quadrant === "minimize" &&
      editTaskForm.title &&
      !editTaskForm.description &&
      !editTaskForm.project
    ) {
      quadrant = "doNow"
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: editTaskForm.title,
      description: editTaskForm.description,
      project: editTaskForm.project,
      completed: false,
      duration_minutes: undefined,
      createdAt: new Date(),
      quadrant,
    }

    setDayData((prev) => {
      const updatedTasks = { ...prev.tasks }

      // Agregar la nueva tarea
      updatedTasks[quadrant] = [...updatedTasks[quadrant], newTask]

      // Si no se mantiene la original, moverla a basura
      if (!keepOriginalTask) {
        // Encontrar en qué cuadrante está la tarea original
        const originalQuadrant = Object.keys(updatedTasks).find((key) =>
          updatedTasks[key as QuadrantType].some((t) => t.id === editingTask.id),
        ) as QuadrantType

        if (originalQuadrant) {
          updatedTasks[originalQuadrant] = updatedTasks[originalQuadrant].filter((t) => t.id !== editingTask.id)
          updatedTasks.trash = [...updatedTasks.trash, editingTask]
        }
      }

      const newData = {
        ...prev,
        tasks: updatedTasks,
      }
      localStorage.setItem(`eisenhower-${dayData.date}`, JSON.stringify(newData))
      return newData
    })

    setEditTaskForm({ title: "", description: "", project: "" })
    setEditingTask(null)
    setIsEditTaskDialogOpen(false)
  }

  const openAssignProjectDialog = (task: Task) => {
    setAssigningTask(task)
    setAssignProjectForm({ project: task.project || "" })
    setIsAssignProjectDialogOpen(true)
  }

  const assignProject = async () => {
    if (!assigningTask || !assignProjectForm.project) return

    const quadrant = assigningTask.quadrant as QuadrantType
    const task = dayData.tasks[quadrant].find((t: Task) => t.id === assigningTask.id)
    if (!task) return

    // Si la tarea está en doNow y se le asigna un proyecto, moverla a schedule
    if (quadrant === "doNow") {
      setDayData((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          doNow: prev.tasks.doNow.filter((t: Task) => t.id !== assigningTask.id),
          schedule: [...prev.tasks.schedule, { ...task, project: assignProjectForm.project }],
        },
      }))

      // Actualizar en la base de datos
      await updateTaskInDb(assigningTask.id, { 
        project: assignProjectForm.project,
        quadrant: "schedule"
      })
    } else {
      // Para otros cuadrantes, solo actualizar el proyecto
      setDayData((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [quadrant]: prev.tasks[quadrant].map((t: Task) =>
            t.id === assigningTask.id ? { ...t, project: assignProjectForm.project } : t,
          ),
        },
      }))

      // Actualizar en la base de datos
      await updateTaskInDb(assigningTask.id, { project: assignProjectForm.project })
    }

    setAssignProjectForm({ project: "" })
    setAssigningTask(null)
    setIsAssignProjectDialogOpen(false)
  }

  const markAsDelegated = (taskId: string) => {
    setDayData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        delegate: prev.tasks.delegate.map((task) => (task.id === taskId ? { ...task, completed: true } : task)),
      },
    }))
  }

  // Funciones del asistente de tareas
  const resetWizard = () => {
    setWizardStep(1)
    setWizardAnswers({
      title: "",
      isUrgent: "",
      isImportant: "",
      hasDetails: "",
      description: "",
      belongsToProject: "",
      project: "",
      canDelegate: "",
    })
  }

  const openTaskWizard = () => {
    resetWizard()
    setIsTaskWizardOpen(true)
  }

  const nextWizardStep = () => {
    setWizardStep((prev) => prev + 1)
  }

  const prevWizardStep = () => {
    setWizardStep((prev) => prev - 1)
  }

  const getWizardRecommendation = () => {
    const { isUrgent, isImportant, hasDetails, belongsToProject, canDelegate } = wizardAnswers

    if (isUrgent === "yes" && isImportant === "yes") {
      return {
        quadrant: "doNow",
        title: "🔥 Hacer Ahora",
        reason: "Es urgente e importante, requiere atención inmediata",
        color: "text-red-600",
        bgColor: "bg-red-50",
      }
    }

    if (isUrgent === "no" && isImportant === "yes") {
      if (belongsToProject === "yes" && hasDetails === "yes" && canDelegate === "yes") {
        return {
          quadrant: "delegate",
          title: "👥 Delegar",
          reason: "Es importante pero no urgente, tiene detalles completos y puede ser delegada",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        }
      } else if (belongsToProject === "yes") {
        return {
          quadrant: "schedule",
          title: "📋 Planificación",
          reason: "Es importante, no urgente y pertenece a un proyecto específico",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
        }
      } else {
        return {
          quadrant: "doNow",
          title: "🔥 Hacer Ahora",
          reason: "Es importante y requiere tu atención personal",
          color: "text-red-600",
          bgColor: "bg-red-50",
        }
      }
    }

    if (isUrgent === "yes" && isImportant === "no") {
      return {
        quadrant: "delegate",
        title: "👥 Delegar",
        reason: "Es urgente pero no importante, ideal para delegar",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      }
    }

    return {
      quadrant: "minimize",
      title: "🗂️ Minimizar",
      reason: "No es urgente ni importante, considera si realmente es necesaria",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    }
  }

  const createTaskFromWizard = () => {
    const recommendation = getWizardRecommendation()
    const { title, description, project } = wizardAnswers

    const task: Task = {
      id: Date.now().toString(),
      title: title,
      description: description || undefined,
      project: project || undefined,
      completed: false,
      duration_minutes: undefined,
      createdAt: new Date(),
      quadrant: recommendation.quadrant as QuadrantType,
    }

    setDayData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [recommendation.quadrant as QuadrantType]: [
          ...prev.tasks[recommendation.quadrant as QuadrantType],
          task,
        ],
      },
    }))

    setIsTaskWizardOpen(false)
    resetWizard()
  }

  // Generar días para el selector rápido
  const generateQuickDays = () => {
    const days = []
    const today = new Date()

    // Ayer
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    days.push({ date: yesterday, label: "Ayer", isToday: false, isYesterday: true })

    // Hoy
    days.push({ date: today, label: "Hoy", isToday: true, isYesterday: false })

    // Próximos 5 días
    for (let i = 1; i <= 5; i++) {
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + i)
      days.push({
        date: futureDate,
        label: formatShortDate(futureDate),
        isToday: false,
        isYesterday: false,
      })
    }

    return days
  }

  const TaskItemComponent = ({ task, quadrant, compact = false }: { task: Task; quadrant: QuadrantType; compact?: boolean }) => {
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);

    const copyToClipboard = () => {
      const projectName = task.project ? projects.find((p) => p.id === task.project)?.name : "";
      const textToCopy = [
        `Título: ${task.title}`,
        task.description ? `Descripción: ${task.description}` : "",
        projectName ? `Proyecto: ${projectName}` : "",
      ].filter(Boolean).join("\n");
      
      navigator.clipboard.writeText(textToCopy);
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 2000);
    };

    return (
      <div
        className={[
          "flex items-center gap-2 p-2 rounded border",
          task.completed ? "bg-gray-50 opacity-60" : "bg-white",
          compact ? "text-sm" : "",
          "mb-1 transition-all duration-200 hover:shadow-sm",
          quadrant === "delegate" && !task.completed ? "bg-[rgba(162,89,255,0.08)] border-l-4 border-violet-400" : ""
        ].filter(Boolean).join(" ")}
      >
        <div className="flex-1 min-w-0">
          <span className={`block truncate ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
            {quadrant === "doNow" && task.completed ? `✓ ${task.title} terminada` : task.title}
            {quadrant === "schedule" && task.completed ? ` (Planificada)` : ""}
            {quadrant === "delegate" && task.completed ? ` (Delegada)` : ""}
          </span>
          {task.description && <p className="text-xs text-gray-600 mt-0.5 truncate">{task.description}</p>}
          {task.project && (
            <Badge variant="outline" className="mt-1 text-xs text-gray-600 border-gray-300 h-4 px-1">
              {projects.find((p) => p.id === task.project)?.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <TooltipProvider>
            <Tooltip open={showCopyTooltip}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                  title="Copiar detalles"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">¡Copiado al portapapeles!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {quadrant === "doNow" && !task.completed && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openAssignProjectDialog(task)}
                title="Asignar a proyecto"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <Calendar className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => completeTask(task.id, quadrant)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-green-600"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            </>
          )}
          {quadrant === "doNow" && task.completed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => completeTask(task.id, quadrant)}
              className="h-6 w-6 p-0 text-green-600"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
          {quadrant === "delegate" && !task.completed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => completeTask(task.id, quadrant)}
              title="Marcar como delegada"
              className="h-6 w-6 p-0 text-gray-500 hover:text-amber-600"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
          {quadrant === "minimize" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!task.description && !task.project) {
                    // Solo título: mover a Hacer Ahora
                    moveTask(task.id, quadrant, "doNow")
                  } else {
                    // Si tiene descripción o proyecto, mover a la basura
                    moveTask(task.id, quadrant, "trash")
                  }
                }}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditTaskDialog(task)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
          {quadrant === "trash" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => moveTask(task.id, quadrant, "minimize")}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteTask(task.id, quadrant)}
            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {quadrant === "schedule" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => completeTask(task.id, quadrant)}
              className={`h-6 w-6 p-0 ${task.completed ? "text-green-600" : "text-gray-500 hover:text-green-600"}`}
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }
  const TaskItem = memo(TaskItemComponent);
  TaskItem.displayName = "TaskItem";

  const TaskSectionComponent = ({ tasks, quadrant, sectionKey }: { tasks: Task[]; quadrant: QuadrantType; sectionKey: string }) => {
    const isExpanded = expandedSections[sectionKey]
    // Ordenar: primero no completadas (más nuevas primero), luego completadas (más nuevas primero)
    const sortedTasks = [...tasks]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .sort((a, b) => Number(a.completed) - Number(b.completed))
    const visibleTasks = isExpanded ? sortedTasks : sortedTasks.slice(0, 3)
    const hasMore = tasks.length > 3

    return (
      <div>
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} quadrant={quadrant} compact />
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionKey)}
            className="w-full mt-1 h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver {tasks.length - 3} más
              </>
            )}
          </Button>
        )}
      </div>
    )
  }
  const TaskSection = memo(TaskSectionComponent);
  TaskSection.displayName = "TaskSection";

  // Componente optimizado para selector de contactos
  const WhatsAppContactSelector = () => {
    // Estados locales para evitar que se cierre el modal
    const [localContactSearch, setLocalContactSearch] = useState("")
    const [localContacts, setLocalContacts] = useState<WhatsAppContact[]>([])
    const [localContactsLoading, setLocalContactsLoading] = useState(false)
    const [localContactsPage, setLocalContactsPage] = useState(1)
    const [localContactsHasMore, setLocalContactsHasMore] = useState(true)
    const [localContactsTotal, setLocalContactsTotal] = useState(0)
    const [localContactStats, setLocalContactStats] = useState<{ total: number; byCategory: Record<string, number> }>({
      total: 0,
      byCategory: {},
    })

    // Debounce local
    const localDebouncedSearch = useDebounce(localContactSearch, 300)

    // Cargar contactos localmente
    const loadLocalContacts = useCallback(async (search = "", page = 1, reset = false) => {
      setLocalContactsLoading(true)
      try {
        const result = await ContactsAPI.searchContacts(search, page, 20)
        if (reset || page === 1) {
          setLocalContacts(result.contacts)
        } else {
          setLocalContacts((prev) => [...prev, ...result.contacts])
        }
        setLocalContactsHasMore(result.hasMore)
        setLocalContactsTotal(result.total)
        setLocalContactsPage(page)
      } catch (error) {
        console.error("Error loading contacts:", error)
      } finally {
        setLocalContactsLoading(false)
      }
    }, [])

    // Cargar estadísticas localmente
    const loadLocalContactStats = useCallback(async () => {
      try {
        const stats = await ContactsAPI.getStats()
        setLocalContactStats(stats)
      } catch (error) {
        console.error("Error loading contact stats:", error)
      }
    }, [])

    // Cargar más contactos localmente
    const loadMoreLocalContacts = () => {
      if (!localContactsLoading && localContactsHasMore) {
        loadLocalContacts(localDebouncedSearch, localContactsPage + 1, false)
      }
    }

    // Importar contactos localmente
    const importLocalContactsFromFile = async (file: File) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const parsedContacts = ContactsAPI.parseVCardFile(content)

          if (parsedContacts.length > 0) {
            setLocalContactsLoading(true)
            const importedContacts = await ContactsAPI.importContacts(parsedContacts)
            await loadLocalContacts("", 1, true)
            await loadLocalContactStats()
            alert(`¡Éxito! Se importaron ${importedContacts.length} contactos.`)
          } else {
            alert("No se encontraron contactos válidos en el archivo.")
          }
        } catch (error) {
          console.error("Error importing contacts:", error)
          alert("Error al importar contactos. Verifica que el archivo sea válido.")
        } finally {
          setLocalContactsLoading(false)
        }
      }

      reader.readAsText(file)
    }

    // Efectos locales
    useEffect(() => {
      if (isContactSelectorOpen) {
        loadLocalContacts()
        loadLocalContactStats()
      }
    }, [isContactSelectorOpen, loadLocalContacts, loadLocalContactStats])

    useEffect(() => {
      if (isContactSelectorOpen) {
        loadLocalContacts(localDebouncedSearch, 1, true)
      }
    }, [localDebouncedSearch, loadLocalContacts, isContactSelectorOpen])

    return (
      <Dialog open={isContactSelectorOpen} onOpenChange={setIsContactSelectorOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <Phone className="h-3 w-3 mr-1" />
            Seleccionar Contacto
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Gestionar Contactos de WhatsApp</DialogTitle>
            <p className="text-xs text-gray-600">{localContactStats.total} contactos disponibles</p>
          </DialogHeader>
          <div className="space-y-3">
            {/* Botones de importar/exportar */}
            <div className="flex gap-2 p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <label htmlFor="import-contacts" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    asChild
                    disabled={localContactsLoading}
                  >
                    <span>
                      {localContactsLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Importar vCard
                    </span>
                  </Button>
                </label>
                <input
                  id="import-contacts"
                  type="file"
                  accept=".vcf,.vcard"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      importLocalContactsFromFile(file)
                      e.target.value = ""
                    }
                  }}
                />
              </div>
            </div>

            {/* Buscador optimizado */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={localContactSearch}
                onChange={(e) => setLocalContactSearch(e.target.value)}
                placeholder="Buscar contactos..."
                className="pl-7 h-8 text-sm"
                disabled={localContactsLoading}
              />
              {localContactsLoading && (
                <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-gray-400" />
              )}
            </div>

            {/* Estadísticas optimizadas */}
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="font-bold text-gray-700 text-sm">{localContactStats.byCategory["Trabajo"] || 0}</div>
                <div className="text-gray-600">Trabajo</div>
              </div>
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="font-bold text-gray-700 text-sm">{localContactStats.byCategory["Familia"] || 0}</div>
                <div className="text-gray-600">Familia</div>
              </div>
              <div className="text-center p-1.5 bg-gray-50 rounded">
                <div className="font-bold text-gray-700 text-sm">{localContactStats.byCategory["Importado"] || 0}</div>
                <div className="text-gray-600">Importados</div>
              </div>
            </div>

            {/* Lista de contactos con scroll virtual */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {localContacts.length === 0 && !localContactsLoading ? (
                <div className="text-center py-6">
                  <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {localContactSearch ? "No se encontraron contactos" : "No hay contactos disponibles"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Importa un archivo vCard para comenzar</p>
                </div>
              ) : (
                <>
                  {localContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectContact(contact)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs truncate">{contact.name}</p>
                          <p className="text-xs text-gray-600 truncate">{contact.phone}</p>
                          {contact.category && (
                            <Badge variant="secondary" className="text-xs mt-0.5 bg-gray-100 text-gray-700 h-4 px-1">
                              {contact.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <MessageCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}

                  {/* Botón cargar más */}
                  {localContactsHasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={loadMoreLocalContacts}
                      disabled={localContactsLoading}
                    >
                      {localContactsLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <ChevronDown className="h-3 w-3 mr-1" />
                      )}
                      Cargar más contactos
                    </Button>
                  )}

                  {/* Indicador de resultados */}
                  <div className="text-center text-xs text-gray-500 py-1">
                    Mostrando {localContacts.length} de {localContactsTotal} contactos
                  </div>
                </>
              )}
            </div>

            {/* Información de ayuda */}
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <p className="font-medium mb-1">💡 Optimizado para grandes listas:</p>
              <ul className="space-y-0.5">
                <li>• Búsqueda en tiempo real con debounce</li>
                <li>• Carga paginada para mejor rendimiento</li>
                <li>• Importación masiva de archivos vCard</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const allLinks = [...DEFAULT_DELEGATION_CONTACTS, ...dayData.customLinks]

  // Componente del Launcher de Aplicaciones
  const AppLauncher = () => {
    const apps = [
      {
        id: "focus",
        name: "Centro de Enfoque",
        description: "Mantén tu mente en el aquí y ahora",
        icon: Focus,
        color: "bg-gray-800",
        hoverColor: "hover:bg-gray-900",
        url: "https://kzmingw9nu381xwxnpf6.lite.vusercontent.net",
      },
      {
        id: "matrix",
        name: "Matriz Eisenhower",
        description: "Organiza tus tareas por prioridad",
        icon: Grid3X3,
        color: "bg-gray-700",
        hoverColor: "hover:bg-gray-800",
        url: "#",
        current: true,
      },
      {
        id: "blog-minimalista",
        name: "Agenda publica",
        description: "Agenda personal",
        icon: Book,
        color: "bg-blue-700",
        hoverColor: "hover:bg-blue-800",
        url: "https://v0.dev/chat/minimalist-blog-design-Bx2kz86PHeY",
      },
    ]

    return (
      <>
        {/* Header con usuario */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                {lastSyncTime && (
                  <p className="text-xs text-gray-500">Última sincronización: {lastSyncTime.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-600" />}
              <Button variant="outline" size="sm" onClick={onSignOut} className="h-7 px-2 text-xs border-gray-300">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Botón flotante del launcher */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
            className={`w-10 h-10 rounded-full shadow-lg transition-all duration-300 ${
              isAppLauncherOpen ? "bg-gray-600 hover:bg-gray-700 rotate-45" : "bg-gray-800 hover:bg-gray-900"
            }`}
            size="sm"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Panel del launcher */}
        {isAppLauncherOpen && (
          <div className="fixed bottom-16 right-4 z-40">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 min-w-[280px]">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">Mis Aplicaciones</h3>
                <p className="text-xs text-gray-500">Acceso rápido a tus herramientas</p>
              </div>

              <div className="space-y-1">
                {apps.map((app) => {
                  const IconComponent = app.icon
                  return (
                    <div
                      key={app.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        app.current
                          ? "bg-gray-50 border border-gray-200"
                          : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                      }`}
                      onClick={() => {
                        if (!app.current) {
                          window.open(app.url, "_blank")
                        }
                        setIsAppLauncherOpen(false)
                      }}
                    >
                      <div className={`w-8 h-8 rounded ${app.color} flex items-center justify-center text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-xs text-gray-800 truncate">{app.name}</p>
                          {app.current && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 bg-gray-100 text-gray-600 h-4">
                              Actual
                            </Badge>
                          )}
                          {!app.current && <ExternalLinkIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{app.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Indicador de más aplicaciones próximamente */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  <Zap className="h-3 w-3" />
                  <span>Más aplicaciones próximamente</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay para cerrar el launcher */}
        {isAppLauncherOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm"
            onClick={() => setIsAppLauncherOpen(false)}
          />
        )}
      </>
    )
  }

  // Componente de Estadísticas
  const StatsPanel = () => {
    const [isHovered, setIsHovered] = useState(false)
    
    const getTrendIcon = () => {
      if (!taskStats) return <Minus className="h-3 w-3 text-gray-400" />
      
      switch (taskStats.trend) {
        case "up":
          return <TrendingUp className="h-3 w-3 text-green-500" />
        case "down":
          return <TrendingDown className="h-3 w-3 text-red-500" />
        default:
          return <Minus className="h-3 w-3 text-gray-400" />
      }
    }

    const getTrendText = () => {
      if (!taskStats) return "Sin datos"
      
      switch (taskStats.trend) {
        case "up":
          return "En alza"
        case "down":
          return "En baja"
        default:
          return "Estable"
      }
    }

    const getTrendColor = () => {
      if (!taskStats) return "text-gray-400"
      
      switch (taskStats.trend) {
        case "up":
          return "text-green-600"
        case "down":
          return "text-red-600"
        default:
          return "text-gray-600"
      }
    }

    return (
      <div 
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`bg-white rounded-t-lg shadow-lg border border-gray-200 transition-all duration-300 ease-in-out ${
                isHovered ? 'h-auto pb-3' : 'h-8'
              }`}>
                {/* Barra visible cuando está oculto */}
                <div className={`flex items-center justify-center gap-2 px-4 py-1.5 cursor-pointer transition-colors duration-200 ${
                  isHovered ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}>
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">Productividad</span>
                  {statsLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-xs font-medium ${getTrendColor()}`}>
                      {taskStats ? taskStats.completedTasksLast30Days : 0} tareas
                    </span>
                  </div>
                  <ChevronUp className={`h-3 w-3 text-gray-400 transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Contenido completo que se muestra en hover */}
                <div className={`px-4 transition-all duration-300 ${isHovered ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <div className="space-y-2 pt-2">
                    {/* Tareas por minuto */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tareas/min:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {taskStats ? taskStats.tasksPerMinute.toFixed(3) : "0.000"}
                      </span>
                    </div>
                    
                    {/* Tareas completadas en 30 días */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Últimos 30 días:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {taskStats ? taskStats.completedTasksLast30Days : 0}
                      </span>
                    </div>
                    
                    {/* Promedio por día */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Promedio/día:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {taskStats ? taskStats.averageTasksPerDay.toFixed(1) : "0.0"}
                      </span>
                    </div>
                    
                    {/* Tendencia */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-600">Tendencia:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon()}
                        <span className={`text-xs font-medium ${getTrendColor()}`}>
                          {getTrendText()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tiempo total gastado */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tiempo total:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {taskStats ? `${Math.round(taskStats.totalMinutesSpent / 60)}h ${taskStats.totalMinutesSpent % 60}m` : "0h 0m"}
                      </span>
                    </div>
                    
                    {/* Botón de cafecito sutil */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowTipMenu((prev) => !prev)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        title="¿Te gusta la app?"
                      >
                        <span role="img" aria-label="Café" className="text-xs opacity-60">☕️</span>
                        <span className="text-xs">Pagale un café a Mencho</span>
                      </button>
                      {showTipMenu && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs z-50">
                          <div className="mb-2 text-gray-800 font-medium flex items-center gap-2">
                            <span role="img" aria-label="Gracias">🙏</span>
                            ¿Te gusta la app?
                          </div>
                          <div className="mb-2 text-gray-600">Puedes invitarme un cafecito o ayudarme a cumplir mi sueño:</div>
                          <ul className="space-y-1.5">
                            <li>
                              <a
                                href="https://cafecito.app/ejemplo" // Cambia este link por el tuyo
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                              >
                                <span role="img" aria-label="Café">☕️</span>
                                Invitar un cafecito
                              </a>
                            </li>
                            <li>
                              <a
                                href="https://www.lamborghini.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-yellow-600 hover:underline"
                              >
                                <span role="img" aria-label="Lamborghini">🏎️</span>
                                Cumplir mi sueño: regalarle a mi mamá un Lamborghini Gallardo amarillo
                              </a>
                            </li>
                          </ul>
                          <div className="mt-2 text-xs text-gray-400">
                            Es que se lo jure cuando tenia cinco completamente euforico al ver el pedazo de auto ese
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Pasa el mouse para ver estadísticas detalladas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  // Componente PomodoroPanel
  function PomodoroPanel() {
    // Configuración inicial y persistencia
    const defaultConfig = {
      workMinutes: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4,
      omitBreaks: false,
    }
    const [config, setConfig] = useState(() => {
      try {
        const saved = localStorage.getItem("pomodoro-config")
        return saved ? JSON.parse(saved) : defaultConfig
      } catch {
        return defaultConfig
      }
    })
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [currentSession, setCurrentSession] = useState(1)
    const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>("work")
    const [timeLeft, setTimeLeft] = useState(config.workMinutes * 60)
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

    // Guardar configuración en localStorage
    useEffect(() => {
      localStorage.setItem("pomodoro-config", JSON.stringify(config))
    }, [config])

    // Actualizar timeLeft si cambia la configuración
    useEffect(() => {
      if (!isRunning) {
        if (mode === "work") setTimeLeft(config.workMinutes * 60)
        if (mode === "shortBreak") setTimeLeft(config.shortBreak * 60)
        if (mode === "longBreak") setTimeLeft(config.longBreak * 60)
      }
      // eslint-disable-next-line
    }, [config, mode])

    // Mostrar tiempo en el título de la pestaña
    useEffect(() => {
      if (isOpen && isRunning) {
        const min = Math.floor(timeLeft / 60).toString().padStart(2, "0")
        const sec = (timeLeft % 60).toString().padStart(2, "0")
        document.title = `${min}:${sec} - Pomodoro`
      } else {
        document.title = "Matriz Eisenhower"
      }
      return () => {
        document.title = "Matriz Eisenhower"
      }
    }, [isOpen, isRunning, timeLeft])

    // Temporizador
    useEffect(() => {
      if (isRunning && !isPaused) {
        if (timeLeft > 0) {
          const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
          setIntervalId(id as any)
        } else {
          // Cambiar de modo
          if (mode === "work") {
            if (config.omitBreaks) {
              setCurrentSession((s) => s + 1)
              setTimeLeft(config.workMinutes * 60)
              setMode("work")
            } else if (currentSession % config.sessionsBeforeLongBreak === 0) {
              setTimeLeft(config.longBreak * 60)
              setMode("longBreak")
            } else {
              setTimeLeft(config.shortBreak * 60)
              setMode("shortBreak")
            }
          } else {
            setCurrentSession((s) => (mode === "longBreak" ? 1 : s + 1))
            setTimeLeft(config.workMinutes * 60)
            setMode("work")
          }
        }
      }
      return () => {
        if (intervalId) clearTimeout(intervalId)
      }
      // eslint-disable-next-line
    }, [isRunning, isPaused, timeLeft, mode])

    // Formatear tiempo
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60).toString().padStart(2, "0")
      const s = (sec % 60).toString().padStart(2, "0")
      return `${m}:${s}`
    }

    // Handlers
    const start = () => {
      setIsRunning(true)
      setIsPaused(false)
    }
    const pause = () => setIsPaused(true)
    const resume = () => setIsPaused(false)
    const reset = () => {
      setIsRunning(false)
      setIsPaused(false)
      setCurrentSession(1)
      setMode("work")
      setTimeLeft(config.workMinutes * 60)
    }
    const handleConfigChange = (field: string, value: any) => {
      setConfig((prev: any) => ({ ...prev, [field]: value }))
    }

    // Panel visual
    return (
      <>
        {/* Overlay de concentración */}
        {isOpen && isRunning && !isPaused && (
          <>
            {/* Spotlight cónico */}
            <div
              className="fixed inset-0 z-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% calc(100% - 5.5rem), rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.85) 100%)',
                transition: 'background 0.4s',
              }}
            />
            {/* Overlay oscuro extra */}
            <div className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300" style={{ pointerEvents: 'auto' }} />
          </>
        )}
        {/* Botón flotante */}
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2">
          <Button
            size="icon"
            variant="outline"
            className={`rounded-full shadow border-gray-300 bg-white hover:bg-gray-100 transition-all duration-300 ${
              isRunning && !isPaused
                ? 'ring-4 ring-red-400/60 shadow-[0_0_40px_10px_rgba(255,80,80,0.7),0_8px_32px_0_rgba(0,0,0,0.25)] scale-110'
                : ''
            }`}
            onClick={() => setIsOpen((o) => !o)}
            title="Pomodoro"
          >
            <Timer className="h-5 w-5 text-red-500 drop-shadow-[0_0_8px_rgba(255,80,80,0.7)]" />
          </Button>
        </div>
        {/* Panel Pomodoro */}
        {isOpen && (
          <div className="fixed bottom-32 left-1/2 z-50 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 min-w-[320px] max-w-xs animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-red-500" />
                <span className="font-bold text-lg">Pomodoro</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2 mb-3">
              <span className={`text-3xl font-mono font-bold ${mode === "work" ? "text-red-600" : "text-green-600"}`}>{formatTime(timeLeft)}</span>
              <span className="text-xs text-gray-500">{mode === "work" ? `Sesión ${currentSession}` : mode === "shortBreak" ? "Descanso corto" : "Descanso largo"}</span>
            </div>
            <div className="flex justify-center gap-2 mb-3">
              {!isRunning ? (
                <Button onClick={start} className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 text-sm"><Play className="h-4 w-4 mr-1" />Iniciar</Button>
              ) : isPaused ? (
                <Button onClick={resume} className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-sm"><Play className="h-4 w-4 mr-1" />Reanudar</Button>
              ) : (
                <Button onClick={pause} className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 px-4 text-sm"><Pause className="h-4 w-4 mr-1" />Pausar</Button>
              )}
              <Button onClick={reset} variant="outline" className="h-8 px-4 text-sm">Reiniciar</Button>
              <Button onClick={() => setIsConfigOpen((v) => !v)} variant="ghost" className="h-8 px-2"><Settings className="h-4 w-4" /></Button>
            </div>
            {isConfigOpen && (
              <div className="space-y-2 border-t pt-2 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Duración trabajo</span>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={config.workMinutes}
                    onChange={e => handleConfigChange("workMinutes", Math.max(5, Math.min(120, Number(e.target.value))))}
                    className="w-16 h-7 text-xs"
                  />
                  <span>min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Descanso corto</span>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={config.shortBreak}
                    onChange={e => handleConfigChange("shortBreak", Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-16 h-7 text-xs"
                  />
                  <span>min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Descanso largo</span>
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={config.longBreak}
                    onChange={e => handleConfigChange("longBreak", Math.max(5, Math.min(60, Number(e.target.value))))}
                    className="w-16 h-7 text-xs"
                  />
                  <span>min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Sesiones antes de largo</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={config.sessionsBeforeLongBreak}
                    onChange={e => handleConfigChange("sessionsBeforeLongBreak", Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="w-16 h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.omitBreaks}
                    onChange={e => handleConfigChange("omitBreaks", e.target.checked)}
                    id="omit-breaks"
                    className="accent-red-600"
                  />
                  <label htmlFor="omit-breaks">Omitir descansos</label>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Panel de Estadísticas */}
      <StatsPanel />
      
      {/* Navegación Izquierda */}
      <div className="w-[8%] flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay("prev")}
          className="h-16 w-full flex flex-col items-center gap-1 hover:bg-white/50 text-gray-600 hover:text-gray-800"
          disabled={isTransitioning}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-xs">Ayer</span>
        </Button>
      </div>

      {/* Contenido Principal */}
      <div className="w-[84%] p-4">
        {/* Header con selector de fecha mejorado */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div className={`transition-opacity duration-200 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{formatDate(currentDate)}</h1>
            </div>
          </div>

          {/* Selector rápido de días */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {generateQuickDays().map((day) => (
              <Button
                key={day.date.toISOString()}
                variant={day.date.toDateString() === currentDate.toDateString() ? "default" : "outline"}
                size="sm"
                onClick={() => jumpToDate(day.date)}
                disabled={isTransitioning}
                className={`transition-all duration-200 h-7 px-2 text-xs ${
                  day.date.toDateString() === currentDate.toDateString()
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : day.isYesterday
                      ? "text-gray-400 border-gray-200"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {day.label}
              </Button>
            ))}

            {/* Botón para abrir calendario completo */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="text-gray-600 border-gray-300 hover:bg-gray-50 h-7 w-7 p-0"
              >
                <CalendarDays className="h-3 w-3" />
              </Button>

              {/* Calendario desplegable */}
              {isDatePickerOpen && (
                <div className="absolute top-8 left-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[280px]">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setMonth(newDate.getMonth() - 1)
                          setCurrentDate(newDate)
                        }}
                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setMonth(newDate.getMonth() + 1)
                          setCurrentDate(newDate)
                        }}
                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                        <div key={day} className="text-xs text-gray-500 text-center py-1 font-medium">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const year = currentDate.getFullYear()
                        const month = currentDate.getMonth()
                        const firstDay = new Date(year, month, 1)
                        const lastDay = new Date(year, month + 1, 0)
                        const startDate = new Date(firstDay)
                        startDate.setDate(startDate.getDate() - firstDay.getDay())

                        const days = []
                        const today = new Date()

                        for (let i = 0; i < 42; i++) {
                          const date = new Date(startDate)
                          date.setDate(startDate.getDate() + i)

                          const isCurrentMonth = date.getMonth() === month
                          const isToday = date.toDateString() === today.toDateString()
                          const isSelected = date.toDateString() === currentDate.toDateString()

                          days.push(
                            <Button
                              key={i}
                              variant="ghost"
                              size="sm"
                              onClick={() => jumpToDate(date)}
                              className={`h-6 w-6 p-0 text-xs transition-all duration-200 ${
                                !isCurrentMonth
                                  ? "text-gray-300 hover:text-gray-400"
                                  : isSelected
                                    ? "bg-gray-900 text-white hover:bg-gray-800"
                                    : isToday
                                      ? "bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold"
                                      : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {date.getDate()}
                            </Button>,
                          )
                        }

                        return days
                      })()}
                    </div>
                  </div>

                  {/* Botones de acción rápida */}
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => jumpToDate(new Date())}
                      className="w-full justify-start h-6 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Ir a hoy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)
                        jumpToDate(yesterday)
                      }}
                      className="w-full justify-start h-6 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Ir a ayer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay para cerrar el calendario */}
            {isDatePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)} />}
          </div>

          {/* Botones para agregar tarea */}
          <div className="flex gap-2 justify-center mt-3">
            <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800 h-8 px-3 text-sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader className="pb-3">
                  <DialogTitle className="text-base">Agregar Nueva Tarea</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Título *</label>
                    <Input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enviarle una foto a mama"
                      className="h-8 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Solo título → Hacer Ahora</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Descripción</label>
                    <Textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Mira mama, estoy usando la freidora de aire que me regalaste"
                      className="h-16 text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Título + Descripción → Planificación</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Proyecto</label>
                    <Select
                      value={taskForm.project}
                      onValueChange={(value) => setTaskForm((prev) => ({ ...prev, project: value }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id} className="text-sm">
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-0.5">Título + Proyecto → Planificación</p>
                    <p className="text-xs text-gray-500">Título + Descripción + Proyecto → Delegar</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={addTask} className="flex-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm">
                      Agregar Tarea
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)} className="h-8 text-sm">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={openTaskWizard}
              className="border-gray-300 text-gray-700 h-8 px-3 text-sm"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </Button>
          </div>

          {/* Asistente de Tareas */}
          <Dialog open={isTaskWizardOpen} onOpenChange={setIsTaskWizardOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-base">🧙‍♂️ Asistente de Tareas - Paso {wizardStep} de 7</DialogTitle>
                <DialogDescription className="text-xs">
                  Te ayudo a determinar dónde ubicar tu tarea en la Matriz de Eisenhower
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Paso 1: Título */}
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">¿Cuál es tu tarea?</h3>
                      <p className="text-xs text-gray-600">Describe brevemente qué necesitas hacer</p>
                    </div>
                    <Input
                      value={wizardAnswers.title}
                      onChange={(e) => setWizardAnswers((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Revisar propuesta de cliente, Llamar al médico..."
                      className="text-center h-8 text-sm"
                    />
                  </div>
                )}

                {/* Paso 2: Urgencia */}
                {wizardStep === 2 && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">¿Es urgente?</h3>
                      <p className="text-xs text-gray-600">
                        ¿Necesita ser hecho hoy o en los próximos días? ¿Hay consecuencias si se retrasa?
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={wizardAnswers.isUrgent === "yes" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, isUrgent: "yes" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.isUrgent === "yes" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">⚡</span>
                        <span>Sí, es urgente</span>
                      </Button>
                      <Button
                        variant={wizardAnswers.isUrgent === "no" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, isUrgent: "no" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.isUrgent === "no" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">🕐</span>
                        <span>No es urgente</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Importancia */}
                {wizardStep === 3 && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">¿Es importante?</h3>
                      <p className="text-xs text-gray-600">
                        ¿Contribuye a tus objetivos principales? ¿Tiene impacto significativo en tu trabajo o vida?
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={wizardAnswers.isImportant === "yes" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, isImportant: "yes" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.isImportant === "yes" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">⭐</span>
                        <span>Sí, es importante</span>
                      </Button>
                      <Button
                        variant={wizardAnswers.isImportant === "no" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, isImportant: "no" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.isImportant === "no" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">📝</span>
                        <span>No es tan importante</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Detalles */}
                {wizardStep === 4 && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">¿Necesitas agregar detalles?</h3>
                      <p className="text-xs text-gray-600">
                        ¿Hay pasos específicos, contexto o información adicional que ayude a completar la tarea?
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={wizardAnswers.hasDetails === "yes" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, hasDetails: "yes" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.hasDetails === "yes" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">📋</span>
                        <span>Sí, agregar detalles</span>
                      </Button>
                      <Button
                        variant={wizardAnswers.hasDetails === "no" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, hasDetails: "no" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.hasDetails === "no" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">✨</span>
                        <span>No, es suficiente</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 5: Descripción (condicional) */}
                {wizardStep === 5 && wizardAnswers.hasDetails === "yes" && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">Agrega los detalles</h3>
                      <p className="text-xs text-gray-600">Describe los pasos o información adicional necesaria</p>
                    </div>
                    <Textarea
                      value={wizardAnswers.description}
                      onChange={(e) => setWizardAnswers((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Ej: Revisar sección de precios, verificar términos legales, preparar preguntas para la reunión..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                )}

                {/* Paso 6: Proyecto */}
                {wizardStep === (wizardAnswers.hasDetails === "yes" ? 6 : 5) && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-1">¿Pertenece a un proyecto específico?</h3>
                      <p className="text-xs text-gray-600">
                        ¿Esta tarea es parte de un proyecto más grande o área específica de tu vida/trabajo?
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={wizardAnswers.belongsToProject === "yes" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, belongsToProject: "yes" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.belongsToProject === "yes" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">📁</span>
                        <span>Sí, es parte de un proyecto</span>
                      </Button>
                      <Button
                        variant={wizardAnswers.belongsToProject === "no" ? "default" : "outline"}
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, belongsToProject: "no" }))}
                        className={`h-16 flex flex-col text-sm ${wizardAnswers.belongsToProject === "no" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                      >
                        <span className="text-xl mb-1">🎯</span>
                        <span>No, es una tarea independiente</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 7: Selección de proyecto (condicional) */}
                {wizardStep === (wizardAnswers.hasDetails === "yes" ? 7 : 6) &&
                  wizardAnswers.belongsToProject === "yes" && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <h3 className="text-base font-semibold mb-1">¿A qué proyecto pertenece?</h3>
                        <p className="text-xs text-gray-600">Selecciona el proyecto correspondiente</p>
                      </div>
                      <Select
                        value={wizardAnswers.project}
                        onValueChange={(value) => setWizardAnswers((prev) => ({ ...prev, project: value }))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id} className="text-sm">
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Paso final: Delegación (condicional) */}
                {wizardStep ===
                  (wizardAnswers.hasDetails === "yes"
                    ? wizardAnswers.belongsToProject === "yes"
                      ? 8
                      : 7
                    : wizardAnswers.belongsToProject === "yes"
                      ? 7
                      : 6) &&
                  wizardAnswers.isUrgent === "yes" &&
                  wizardAnswers.isImportant === "no" && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <h3 className="text-base font-semibold mb-1">¿Puedes delegarla?</h3>
                        <p className="text-xs text-gray-600">
                          ¿Hay alguien más que pueda hacer esta tarea? ¿Tienes los recursos para delegarla?
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={wizardAnswers.canDelegate === "yes" ? "default" : "outline"}
                          onClick={() => setWizardAnswers((prev) => ({ ...prev, canDelegate: "yes" }))}
                          className={`h-16 flex flex-col text-sm ${wizardAnswers.canDelegate === "yes" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                        >
                          <span className="text-xl mb-1">👥</span>
                          <span>Sí, puedo delegarla</span>
                        </Button>
                        <Button
                          variant={wizardAnswers.canDelegate === "no" ? "default" : "outline"}
                          onClick={() => setWizardAnswers((prev) => ({ ...prev, canDelegate: "no" }))}
                          className={`h-16 flex flex-col text-sm ${wizardAnswers.canDelegate === "no" ? "bg-gray-900 hover:bg-gray-800" : ""}`}
                        >
                          <span className="text-xl mb-1">🙋‍♂️</span>
                          <span>No, debo hacerla yo</span>
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Recomendación final */}
                {wizardStep ===
                  (wizardAnswers.hasDetails === "yes"
                    ? wizardAnswers.belongsToProject === "yes"
                      ? wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                        ? 9
                        : 8
                      : wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                        ? 8
                        : 7
                    : wizardAnswers.belongsToProject === "yes"
                      ? wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                        ? 8
                        : 7
                      : wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                        ? 7
                        : 6) && (
                  <div className="space-y-3">
                    {(() => {
                      const recommendation = getWizardRecommendation()
                      return (
                        <div className="text-center">
                          <h3 className="text-base font-semibold mb-3">🎯 Recomendación</h3>
                          <div className={`p-4 rounded ${recommendation.bgColor} border border-gray-200`}>
                            <div className={`text-lg font-bold ${recommendation.color} mb-2`}>
                              {recommendation.title}
                            </div>
                            <p className="text-xs text-gray-700 mb-3">{recommendation.reason}</p>
                            <div className="space-y-1 text-left">
                              <p className="font-medium text-xs">Resumen de tu tarea:</p>
                              <p className="text-xs">
                                <strong>Título:</strong> {wizardAnswers.title}
                              </p>
                              {wizardAnswers.description && (
                                <p className="text-xs">
                                  <strong>Descripción:</strong> {wizardAnswers.description}
                                </p>
                              )}
                              {wizardAnswers.project && (
                                <p className="text-xs">
                                  <strong>Proyecto:</strong>{" "}
                                  {projects.find((p) => p.id === wizardAnswers.project)?.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Navegación */}
                <div className="flex justify-between pt-3">
                  <Button
                    variant="outline"
                    onClick={prevWizardStep}
                    disabled={wizardStep === 1}
                    className="flex items-center gap-1 h-8 text-sm"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Anterior
                  </Button>

                  <div className="flex gap-2">
                    {wizardStep <
                    (wizardAnswers.hasDetails === "yes"
                      ? wizardAnswers.belongsToProject === "yes"
                        ? wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                          ? 9
                          : 8
                        : wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                          ? 8
                          : 7
                      : wizardAnswers.belongsToProject === "yes"
                        ? wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                          ? 8
                          : 7
                        : wizardAnswers.isUrgent === "yes" && wizardAnswers.isImportant === "no"
                          ? 7
                          : 6) ? (
                      <Button
                        onClick={nextWizardStep}
                        disabled={
                          (wizardStep === 1 && !wizardAnswers.title) ||
                          (wizardStep === 2 && !wizardAnswers.isUrgent) ||
                          (wizardStep === 3 && !wizardAnswers.isImportant) ||
                          (wizardStep === 4 && !wizardAnswers.hasDetails) ||
                          (wizardStep === 5 && wizardAnswers.hasDetails === "yes" && !wizardAnswers.description) ||
                          ((wizardStep === 5 || wizardStep === 6) && !wizardAnswers.belongsToProject) ||
                          ((wizardStep === 6 || wizardStep === 7) &&
                            wizardAnswers.belongsToProject === "yes" &&
                            !wizardAnswers.project) ||
                          ((wizardStep === 6 || wizardStep === 7 || wizardStep === 8) &&
                            wizardAnswers.isUrgent === "yes" &&
                            wizardAnswers.isImportant === "no" &&
                            !wizardAnswers.canDelegate)
                        }
                        className="flex items-center gap-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm"
                      >
                        Siguiente
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        onClick={createTaskFromWizard}
                        className="flex items-center gap-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Crear Tarea
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal para editar tarea */}
          <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-base">Editar Tarea</DialogTitle>
                <DialogDescription className="text-xs">
                  Modifica la tarea y decide si mantener la original o reemplazarla
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Título *</label>
                  <Input
                    value={editTaskForm.title}
                    onChange={(e) => setEditTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="¿Qué necesitas hacer?"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Descripción</label>
                  <Textarea
                    value={editTaskForm.description}
                    onChange={(e) => setEditTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalles adicionales..."
                    className="h-16 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Proyecto</label>
                  <Select
                    value={editTaskForm.project}
                    onValueChange={(value) => setEditTaskForm((prev) => ({ ...prev, project: value }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="text-sm">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Switch para mantener o borrar tarea original */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {keepOriginalTask
                        ? "Crear nueva tarea sin borrar la anterior"
                        : "Crear nueva tarea borrando la anterior"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {keepOriginalTask
                        ? "La tarea original se mantendrá en su lugar"
                        : "La tarea original se moverá a la basura"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setKeepOriginalTask(!keepOriginalTask)}
                    className="h-7 text-xs"
                  >
                    {keepOriginalTask ? "Mantener" : "Borrar"}
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={saveEditedTask} className="flex-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm">
                    {keepOriginalTask ? "Crear Nueva Tarea" : "Reemplazar Tarea"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditTaskDialogOpen(false)} className="h-8 text-sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal para asignar proyecto */}
          <Dialog open={isAssignProjectDialogOpen} onOpenChange={setIsAssignProjectDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-base">Asignar a Proyecto</DialogTitle>
                <DialogDescription className="text-xs">
                  Asigna esta tarea a un proyecto. Se moverá automáticamente a Planificación o Delegación según
                  corresponda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {assigningTask && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm">{assigningTask.title}</p>
                    {assigningTask.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{assigningTask.description}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium">Proyecto *</label>
                  <Select
                    value={assignProjectForm.project}
                    onValueChange={(value) => setAssignProjectForm({ project: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="text-sm">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">
                    <strong>Resultado:</strong>
                    <br />• La tarea se marcará como completada en "Hacer Ahora"
                    <br />• Se creará una nueva tarea en "Planificación" o "Delegación"
                    <br />• Depende de si tiene descripción y proyecto asignado
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={assignProject} className="flex-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm">
                    Asignar Proyecto
                  </Button>
                  <Button variant="outline" onClick={() => setIsAssignProjectDialogOpen(false)} className="h-8 text-sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de duración */}
          <Dialog open={isDurationDialogOpen} onOpenChange={setIsDurationDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-base">¿Cuánto tiempo tomó?</DialogTitle>
                <DialogDescription className="text-xs">
                  Registra el tiempo que te tomó completar esta tarea
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duración en minutos</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[durationMinutes]}
                      onValueChange={(value) => setDurationMinutes(value[0])}
                      max={480}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[60px]">{durationMinutes} min</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleDurationSubmit} className="flex-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm">
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setIsDurationDialogOpen(false)} className="h-8 text-sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Matriz con animaciones */}
        <div className={`space-y-4 transition-opacity duration-200 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
          {/* Minimizar */}
          <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow mb-4">
            <CardHeader className="bg-gray-50 border-b border-gray-100 py-2">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Archive className="h-3 w-3 text-gray-600" />
                </div>
                <div>
                  <div className="text-base font-semibold">Minimizar & Backlog</div>
                  <div className="text-xs font-normal text-gray-600">No Importante + No Urgente</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Tabs defaultValue="minimize" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-7">
                  <TabsTrigger value="minimize" className="data-[state=active]:bg-white text-xs">
                    Backlog ({dayData.tasks.minimize.length})
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="data-[state=active]:bg-white text-xs">
                    Basura ({dayData.tasks.trash.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="minimize" className="mt-2">
                  {dayData.tasks.minimize.length === 0 ? (
                    <p className="text-center text-gray-500 py-3 text-sm">Backlog vacío - ¡Excelente enfoque!</p>
                  ) : (
                    <TaskSection tasks={dayData.tasks.minimize} quadrant="minimize" sectionKey="minimize" />
                  )}
                </TabsContent>
                <TabsContent value="trash" className="mt-2">
                  {dayData.tasks.trash.length === 0 ? (
                    <p className="text-center text-gray-500 py-3 text-sm">Basura vacía</p>
                  ) : (
                    <TaskSection tasks={dayData.tasks.trash} quadrant="trash" sectionKey="trash" />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Hacer Ahora */}
          <Card className="border-red-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-red-50 border-b border-red-100 py-2">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-red-600" />
                </div>
                <div>
                  <div className="text-base font-semibold">Hacer Ahora ({dayData.tasks.doNow.length})</div>
                  <div className="text-xs font-normal text-gray-600">Importante + Urgente</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {dayData.tasks.doNow.length === 0 ? (
                <p className="text-center text-gray-500 py-3 text-sm">¿No hiciste nada?, bueno entonces acordate de mi instagram: <a href="https://www.instagram.com/martinsktordie" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@martinsktordie</a></p>
              ) : (
                <TaskSection tasks={dayData.tasks.doNow} quadrant="doNow" sectionKey="doNow" />
              )}
            </CardContent>
          </Card>

          {/* Sección Media */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Planificación */}
            <Card className="lg:col-span-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 border-b border-gray-100 py-2">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">Planificación ({dayData.tasks.schedule.length})</div>
                    <div className="text-xs font-normal text-gray-600">Importante + No Urgente</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Tabs defaultValue="tasks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-7">
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-white text-xs">
                      Tareas
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="data-[state=active]:bg-white text-xs">
                      Proyectos
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tasks" className="mt-2">
                    {dayData.tasks.schedule.length === 0 ? (
                      <p className="text-center text-gray-500 py-3 text-sm">
                        Agrega tareas importantes para planificar
                      </p>
                    ) : (
                      <TaskSection tasks={dayData.tasks.schedule} quadrant="schedule" sectionKey="schedule" />
                    )}
                  </TabsContent>
                  <TabsContent value="projects" className="mt-2">
                    <div className="grid grid-cols-2 gap-1">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-1.5 bg-gray-50 rounded border text-xs hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900 truncate">{project.name}</div>
                          <div className="text-xs text-gray-600">
                            {dayData.tasks.schedule.filter((t) => t.project === project.id).length} tareas hoy
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Delegación */}
            <Card className="border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-amber-50 border-b border-amber-100 py-2">
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Users className="h-3 w-3 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">Delegar ({dayData.tasks.delegate.length})</div>
                      <div className="text-xs font-normal text-gray-600">No Importante + Urgente</div>
                    </div>
                  </div>
                  <Dialog open={isAddLinkDialogOpen} onOpenChange={setIsAddLinkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-gray-300 h-6 px-2 text-xs">
                        <Link className="h-3 w-3 mr-0.5" />
                        Enlace
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="pb-3">
                        <DialogTitle className="text-base">Agregar Enlace Personalizado</DialogTitle>
                        <DialogDescription className="text-xs">
                          Agrega un enlace rápido para delegar tareas o acceder a herramientas.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium">Nombre</label>
                          <Input
                            value={linkForm.name}
                            onChange={(e) => setLinkForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="ej: Mi Asistente IA"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium">Tipo</label>
                          <Select
                            value={linkForm.type}
                            onValueChange={(value) =>
                              setLinkForm((prev) => ({ ...prev, type: value, url: "", phone: "", message: "" }))
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="AI" className="text-sm">
                                IA
                              </SelectItem>
                              <SelectItem value="Person" className="text-sm">
                                Persona
                              </SelectItem>
                              <SelectItem value="Tool" className="text-sm">
                                Herramienta
                              </SelectItem>
                              <SelectItem value="WhatsApp" className="text-sm">
                                WhatsApp
                              </SelectItem>
                              <SelectItem value="Custom" className="text-sm">
                                Personalizado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {linkForm.type === "WhatsApp" ? (
                          <>
                            {/* Selector de contactos de WhatsApp */}
                            <div>
                              <label className="text-xs font-medium">Contacto</label>
                              <div className="space-y-2">
                                <WhatsAppContactSelector />
                                {selectedContact && (
                                  <div className="p-2 bg-gray-50 rounded border">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-gray-600" />
                                      <div>
                                        <p className="text-xs font-medium">{selectedContact.name}</p>
                                        <p className="text-xs text-gray-600">{selectedContact.phone}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Campo manual para número (opcional) */}
                            <div>
                              <label className="text-xs font-medium">O ingresa número manualmente</label>
                              <Input
                                value={linkForm.phone}
                                onChange={(e) => {
                                  setLinkForm((prev) => ({ ...prev, phone: e.target.value }))
                                  setSelectedContact(null)
                                }}
                                placeholder="ej: +5493489659359"
                                className="h-8 text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-0.5">
                                Déjalo vacío para mostrar lista de contactos de WhatsApp
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium">Mensaje Predeterminado *</label>
                              <Textarea
                                value={linkForm.message}
                                onChange={(e) => setLinkForm((prev) => ({ ...prev, message: e.target.value }))}
                                placeholder="ej: Hola, necesito ayuda con..."
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>

                            <div className="p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-700">
                                <strong>Vista previa:</strong>
                                <br />
                                {linkForm.phone || selectedContact?.phone
                                  ? `Enviará a: ${linkForm.phone || selectedContact?.phone}`
                                  : "Mostrará lista de contactos"}
                                <br />
                                {linkForm.message && `Mensaje: "${linkForm.message}"`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="text-xs font-medium">URL</label>
                            <Input
                              value={linkForm.url}
                              onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                              placeholder="https://..."
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button onClick={addCustomLink} className="flex-1 bg-gray-900 hover:bg-gray-800 h-8 text-sm">
                            Agregar Enlace
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddLinkDialogOpen(false)}
                            className="h-8 text-sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2 mb-3">
                  <h4 className="font-medium text-xs">Enlaces rápidos:</h4>
                  <div className="space-y-0.5">
                    {allLinks.map((link) => (
                      <div key={link.id} className="flex items-center gap-0.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-between text-xs border-gray-300 hover:bg-gray-50 h-6 px-2"
                          onClick={() => window.open(link.url, "_blank")}
                        >
                          <span className="flex items-center gap-0.5 truncate">
                            {link.type === "WhatsApp" && "💬"}
                            {link.type === "AI" && "🤖"}
                            {link.type === "Person" && "👤"}
                            {link.type === "Tool" && "🔧"}
                            <span className="truncate">{link.name}</span>
                          </span>
                          <ExternalLink className="h-2 w-2 flex-shrink-0" />
                        </Button>
                        {!DEFAULT_DELEGATION_CONTACTS.find((c) => c.id === link.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCustomLink(link.id)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {dayData.tasks.delegate.length === 0 ? (
                  <p className="text-center text-gray-500 py-2 text-xs">No hay delegaciones pendientes</p>
                ) : (
                  <TaskSection tasks={dayData.tasks.delegate} quadrant="delegate" sectionKey="delegate" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* App Launcher */}
        <AppLauncher />
        {/* Pomodoro Panel */}
        <PomodoroPanel />
      </div>

      {/* Navegación Derecha */}
      <div className="w-[8%] flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay("next")}
          className="h-16 w-full flex flex-col items-center gap-1 hover:bg-white/50 text-gray-600 hover:text-gray-800"
          disabled={isTransitioning}
        >
          <ChevronRight className="h-6 w-6" />
          <span className="text-xs">Mañana</span>
        </Button>
      </div>
    </div>
  )
}
