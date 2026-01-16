"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

// Subject management
export async function addSubject(name: string, description?: string) {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("subjects")
      .insert([{ name, description }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[Settings] Error adding subject:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateSubject(id: string, name: string, description?: string) {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("subjects")
      .update({ name, description })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[Settings] Error updating subject:", error)
    return { success: false, error: String(error) }
  }
}

export async function deleteSubject(id: string) {
  const supabase = await getSupabaseServer()

  try {
    const { error } = await supabase.from("subjects").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[Settings] Error deleting subject:", error)
    return { success: false, error: String(error) }
  }
}

// Level management
export async function addLevel(name: string, displayOrder: number) {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("levels")
      .insert([{ name, display_order: displayOrder }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[Settings] Error adding level:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateLevel(id: string, name: string, displayOrder: number) {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("levels")
      .update({ name, display_order: displayOrder })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[Settings] Error updating level:", error)
    return { success: false, error: String(error) }
  }
}

export async function deleteLevel(id: string) {
  const supabase = await getSupabaseServer()

  try {
    const { error } = await supabase.from("levels").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[Settings] Error deleting level:", error)
    return { success: false, error: String(error) }
  }
}

// Subject-Level combination management
export async function createSubjectLevel(data: {
  subjectId: string
  levelId: string
  teacherId: string
  pricePerMonth: number
  timesPerWeek: number
}) {
  const supabase = await getSupabaseServer()

  try {
    // Check if subject_level already exists
    const { data: existing, error: checkError } = await supabase
      .from("subject_levels")
      .select("id")
      .eq("subject_id", data.subjectId)
      .eq("level_id", data.levelId)
      .single()

    let subjectLevelId: string

    if (existing) {
      // Update existing subject_level
      const { data: updated, error: updateError } = await supabase
        .from("subject_levels")
        .update({
          price_per_month: data.pricePerMonth,
          times_per_week: data.timesPerWeek,
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      subjectLevelId = updated.id

      // Update teacher assignment
      const { data: existingTeacher, error: teacherCheckError } = await supabase
        .from("teacher_subject_levels")
        .select("id")
        .eq("subject_level_id", subjectLevelId)
        .single()

      if (existingTeacher) {
        // Update existing teacher assignment
        const { error: updateTeacherError } = await supabase
          .from("teacher_subject_levels")
          .update({ teacher_id: data.teacherId })
          .eq("id", existingTeacher.id)

        if (updateTeacherError) throw updateTeacherError
      } else {
        // Create new teacher assignment
        const { error: insertTeacherError } = await supabase
          .from("teacher_subject_levels")
          .insert([{ teacher_id: data.teacherId, subject_level_id: subjectLevelId }])

        if (insertTeacherError) throw insertTeacherError
      }
    } else {
      // Create new subject_level
      const { data: created, error: createError } = await supabase
        .from("subject_levels")
        .insert([
          {
            subject_id: data.subjectId,
            level_id: data.levelId,
            price_per_month: data.pricePerMonth,
            times_per_week: data.timesPerWeek,
          },
        ])
        .select()
        .single()

      if (createError) throw createError
      subjectLevelId = created.id

      // Create teacher assignment
      const { error: insertTeacherError } = await supabase
        .from("teacher_subject_levels")
        .insert([{ teacher_id: data.teacherId, subject_level_id: subjectLevelId }])

      if (insertTeacherError) throw insertTeacherError
    }

    return { success: true, subjectLevelId }
  } catch (error) {
    console.error("[Settings] Error creating subject-level:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateSubjectLevel(
  subjectLevelId: string,
  data: {
    teacherId: string
    pricePerMonth: number
    timesPerWeek: number
  },
) {
  const supabase = await getSupabaseServer()

  try {
    // Update subject_level
    const { error: updateError } = await supabase
      .from("subject_levels")
      .update({
        price_per_month: data.pricePerMonth,
        times_per_week: data.timesPerWeek,
      })
      .eq("id", subjectLevelId)

    if (updateError) throw updateError

    // Update teacher assignment
    const { data: existingTeacher, error: teacherCheckError } = await supabase
      .from("teacher_subject_levels")
      .select("id")
      .eq("subject_level_id", subjectLevelId)
      .single()

    if (existingTeacher) {
      const { error: updateTeacherError } = await supabase
        .from("teacher_subject_levels")
        .update({ teacher_id: data.teacherId })
        .eq("id", existingTeacher.id)

      if (updateTeacherError) throw updateTeacherError
    } else {
      const { error: insertTeacherError } = await supabase
        .from("teacher_subject_levels")
        .insert([{ teacher_id: data.teacherId, subject_level_id: subjectLevelId }])

      if (insertTeacherError) throw insertTeacherError
    }

    return { success: true }
  } catch (error) {
    console.error("[Settings] Error updating subject-level:", error)
    return { success: false, error: String(error) }
  }
}

export async function deleteSubjectLevel(subjectLevelId: string) {
  const supabase = await getSupabaseServer()

  try {
    const { error } = await supabase.from("subject_levels").delete().eq("id", subjectLevelId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[Settings] Error deleting subject-level:", error)
    return { success: false, error: String(error) }
  }
}

// Get all subject-level combinations with their teachers
export async function getSubjectLevelsWithTeachers() {
  const supabase = await getSupabaseServer()

  try {
    const { data, error } = await supabase
      .from("subject_levels")
      .select(
        `
        *,
        subjects (*),
        levels (*),
        teacher_subject_levels (
          *,
          teachers (*)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the data to include teacher info
    const formatted = data?.map((sl: any) => ({
      id: sl.id,
      subjectId: sl.subject_id,
      levelId: sl.level_id,
      subjectName: sl.subjects?.name,
      levelName: sl.levels?.name,
      pricePerMonth: sl.price_per_month,
      timesPerWeek: sl.times_per_week || 1,
      teacherId: sl.teacher_subject_levels?.[0]?.teacher_id || null,
      teacherName: sl.teacher_subject_levels?.[0]?.teachers
        ? `${sl.teacher_subject_levels[0].teachers.first_name} ${sl.teacher_subject_levels[0].teachers.last_name}`
        : null,
    }))

    return { success: true, data: formatted || [] }
  } catch (error) {
    console.error("[Settings] Error fetching subject-levels:", error)
    return { success: false, error: String(error), data: [] }
  }
}
