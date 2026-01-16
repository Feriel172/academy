"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export async function getSubjectsAndLevels() {
  const supabase = await getSupabaseServer()

  try {
    const [subjectsRes, levelsRes] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("levels").select("*").order("display_order"),
    ])

    if (subjectsRes.error) throw subjectsRes.error
    if (levelsRes.error) throw levelsRes.error

    return {
      success: true,
      subjects: subjectsRes.data,
      levels: levelsRes.data,
    }
  } catch (error) {
    console.error("[v0] Error fetching subjects and levels:", error)
    return {
      success: false,
      error: String(error),
      subjects: [],
      levels: [],
    }
  }
}

export async function getSubjectLevelsByIds(subjectId: string, levelId: string) {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("subject_levels")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("level_id", levelId)
      .single()

    if (error) throw error
    return { success: true, subjectLevelId: data.id }
  } catch (error) {
    console.error("[v0] Error fetching subject_level:", error)
    return { success: false, error: String(error) }
  }
}
