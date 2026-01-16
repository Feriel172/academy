"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export async function addStudent(formData: {
  firstName: string
  lastName: string
  parentName: string
  parentPhone: string
  parentEmail: string
  subjectLevels: { subjectId: string; levelId: string }[]
}) {
  const supabase = await getSupabaseServer()

  try {
    // Insert student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          parent_name: formData.parentName,
          parent_phone: formData.parentPhone,
          parent_email: formData.parentEmail,
        },
      ])
      .select()
      .single()

    if (studentError) throw studentError

    const subjectLevelIds: string[] = []
    for (const sl of formData.subjectLevels) {
      const { data, error } = await supabase
        .from("subject_levels")
        .select("id")
        .eq("subject_id", sl.subjectId)
        .eq("level_id", sl.levelId)
        .single()

      if (!error && data) {
        subjectLevelIds.push(data.id)
      }
    }

    // Insert student_subject_levels
    if (subjectLevelIds.length > 0) {
      const { error: enrollError } = await supabase.from("student_subject_levels").insert(
        subjectLevelIds.map((id) => ({
          student_id: student.id,
          subject_level_id: id,
        })),
      )

      if (enrollError) throw enrollError
    }

    return { success: true, student }
  } catch (error) {
    console.error("[v0] Error adding student:", error)
    return { success: false, error: String(error) }
  }
}

export async function getStudents() {
  const supabase = await getSupabaseServer()

  try {
    const { data: students, error } = await supabase
      .from("students")
      .select(
        `
        *,
        student_subject_levels (
          *,
          subject_levels (
            *,
            subjects (*),
            levels (*)
          )
        )
      `,
      )
      .order("first_name")

    if (error) throw error
    return { success: true, data: students }
  } catch (error) {
    console.error("[v0] Error fetching students:", error)
    return { success: false, error: String(error) }
  }
}
