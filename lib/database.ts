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
