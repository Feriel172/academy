"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export async function addTeacher(formData: {
  firstName: string
  lastName: string
  paymentType: "percentage" | "fixed"
  paymentValue: number
  subjectLevelAssignments: { subjectLevelId: string }[]
}) {
  const supabase = await getSupabaseServer()

  try {
    // Insert teacher
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          payment_type: formData.paymentType,
          payment_value: formData.paymentValue,
        },
      ])
      .select()
      .single()

    if (teacherError) throw teacherError

    // Extract subject and level IDs from temporary IDs (format: "subject-id-level-id")
    const subjectLevelQueries = formData.subjectLevelAssignments.map((sl) => {
      const [subjectId, levelId] = sl.subjectLevelId.split("-")
      return { subjectId, levelId }
    })

    // Fetch actual subject_level IDs
    const subjectLevelIds: string[] = []
    for (const query of subjectLevelQueries) {
      const { data, error } = await supabase
        .from("subject_levels")
        .select("id")
        .eq("subject_id", query.subjectId)
        .eq("level_id", query.levelId)
        .single()

      if (!error && data) {
        subjectLevelIds.push(data.id)
      }
    }

    // Insert teacher_subject_levels
    if (subjectLevelIds.length > 0) {
      const { error: assignError } = await supabase.from("teacher_subject_levels").insert(
        subjectLevelIds.map((id) => ({
          teacher_id: teacher.id,
          subject_level_id: id,
        })),
      )

      if (assignError) throw assignError
    }

    return { success: true, teacher }
  } catch (error) {
    console.error("[v0] Error adding teacher:", error)
    return { success: false, error: String(error) }
  }
}

export async function getTeachers() {
  const supabase = await getSupabaseServer()

  try {
    const { data: teachers, error } = await supabase
      .from("teachers")
      .select(
        `
        *,
        teacher_subject_levels (
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
    return { success: true, data: teachers }
  } catch (error) {
    console.error("[v0] Error fetching teachers:", error)
    return { success: false, error: String(error) }
  }
}
