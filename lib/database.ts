import { supabase } from "./auth"

export interface DatabaseTask {
  id: string
  user_id: string
  title: string
  description?: string
  project?: string
  quadrant: "doNow" | "schedule" | "delegate" | "minimize" | "trash"
  completed: boolean
  duration_minutes?: number
  date: string
  created_at: string
  updated_at: string
}

export interface DatabaseCustomLink {
  id: string
  user_id: string
  name: string
  url: string
  type: string
  phone?: string
  message?: string
  created_at: string
}

export interface TaskStats {
  tasksPerMinute: number
  completedTasksLast30Days: number
  trend: "up" | "down" | "stable"
  averageTasksPerDay: number
  totalMinutesSpent: number
}

export const databaseService = {
  // Tareas
  async getTasks(userId: string, date: string): Promise<DatabaseTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  },

  async getTaskStats(userId: string): Promise<TaskStats> {
    // Obtener fecha de hace 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    // Obtener fecha de hace 60 días para comparar tendencias
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0]

    // Obtener tareas completadas en los últimos 30 días
    const { data: recentTasks, error: recentError } = await supabase
      .from("tasks")
      .select("completed, duration_minutes, date")
      .eq("user_id", userId)
      .gte("date", thirtyDaysAgoStr)
      .eq("completed", true)

    if (recentError) throw recentError

    // Obtener tareas completadas en los 30 días anteriores (para comparar tendencias)
    const { data: previousTasks, error: previousError } = await supabase
      .from("tasks")
      .select("completed, duration_minutes, date")
      .eq("user_id", userId)
      .gte("date", sixtyDaysAgoStr)
      .lt("date", thirtyDaysAgoStr)
      .eq("completed", true)

    if (previousError) throw previousError

    // Calcular estadísticas
    const completedTasksLast30Days = recentTasks?.length || 0
    const completedTasksPrevious30Days = previousTasks?.length || 0
    
    // Calcular tiempo total gastado
    const totalMinutesSpent = recentTasks?.reduce((sum, task) => sum + (task.duration_minutes || 0), 0) || 0
    
    // Calcular promedio de tareas por día
    const averageTasksPerDay = completedTasksLast30Days / 30
    
    // Calcular tareas por minuto (basado en el tiempo total gastado)
    const tasksPerMinute = totalMinutesSpent > 0 ? completedTasksLast30Days / totalMinutesSpent : 0
    
    // Determinar tendencia
    let trend: "up" | "down" | "stable" = "stable"
    if (completedTasksLast30Days > completedTasksPrevious30Days) {
      trend = "up"
    } else if (completedTasksLast30Days < completedTasksPrevious30Days) {
      trend = "down"
    }

    return {
      tasksPerMinute,
      completedTasksLast30Days,
      trend,
      averageTasksPerDay,
      totalMinutesSpent
    }
  },

  async createTask(userId: string, task: Omit<DatabaseTask, "id" | "user_id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...task,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateTask(taskId: string, updates: Partial<DatabaseTask>) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) throw error
  },

  // Enlaces personalizados
  async getCustomLinks(userId: string): Promise<DatabaseCustomLink[]> {
    const { data, error } = await supabase
      .from("custom_links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  },

  async createCustomLink(userId: string, link: Omit<DatabaseCustomLink, "id" | "user_id" | "created_at">) {
    const { data, error } = await supabase
      .from("custom_links")
      .insert({
        ...link,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteCustomLink(linkId: string) {
    const { error } = await supabase.from("custom_links").delete().eq("id", linkId)

    if (error) throw error
  },
}
