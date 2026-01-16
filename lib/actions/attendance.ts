"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

// Get teacher assigned to a subject-level combination
export async function getTeacherForSubjectLevel(subjectId: string, levelId: string) {
  const supabase = await getSupabaseServer()

  try {
    // First get the subject_level_id
    const { data: subjectLevel, error: slError } = await supabase
      .from("subject_levels")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("level_id", levelId)
      .single()

    if (slError) throw slError
    if (!subjectLevel) {
      return { success: false, error: "Subject-level combination not found" }
    }

    // Get the teacher assigned to this subject-level
    const { data: teacherAssignment, error: taError } = await supabase
      .from("teacher_subject_levels")
      .select(
        `
        *,
        teachers (*)
      `,
      )
      .eq("subject_level_id", subjectLevel.id)
      .single()

    if (taError && taError.code !== "PGRST116") {
      // PGRST116 is "not found" which is okay
      throw taError
    }

    if (!teacherAssignment) {
      return { success: true, teacher: null, subjectLevelId: subjectLevel.id }
    }

    return {
      success: true,
      teacher: {
        id: teacherAssignment.teachers.id,
        firstName: teacherAssignment.teachers.first_name,
        lastName: teacherAssignment.teachers.last_name,
      },
      subjectLevelId: subjectLevel.id,
    }
  } catch (error) {
    console.error("[Attendance] Error fetching teacher:", error)
    return { success: false, error: String(error) }
  }
}

// Get students enrolled in a subject-level combination
export async function getStudentsForSubjectLevel(subjectId: string, levelId: string) {
  const supabase = await getSupabaseServer()

  try {
    // First get the subject_level_id
    const { data: subjectLevel, error: slError } = await supabase
      .from("subject_levels")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("level_id", levelId)
      .single()

    if (slError) throw slError
    if (!subjectLevel) {
      return { success: false, error: "Subject-level combination not found" }
    }

    // Get students enrolled in this subject-level
    const { data: enrollments, error: enrollError } = await supabase
      .from("student_subject_levels")
      .select(
        `
        *,
        students (*)
      `,
      )
      .eq("subject_level_id", subjectLevel.id)
      .eq("active", true)

    if (enrollError) throw enrollError

    const students = (enrollments || []).map((enrollment: any) => ({
      id: enrollment.students.id,
      firstName: enrollment.students.first_name,
      lastName: enrollment.students.last_name,
      enrollmentId: enrollment.id,
    }))

    return {
      success: true,
      students,
      subjectLevelId: subjectLevel.id,
    }
  } catch (error) {
    console.error("[Attendance] Error fetching students:", error)
    return { success: false, error: String(error) }
  }
}

// Save attendance for a day
export async function saveAttendance(data: {
  subjectLevelId: string
  attendanceDate: string // YYYY-MM-DD format
  teacherId: string
  teacherPresent: boolean
  replacementTeacherId?: string | null
  studentAttendance: Array<{ studentId: string; present: boolean }>
}) {
  const supabase = await getSupabaseServer()

  try {
    // Save teacher attendance
    const teacherToRecord = data.teacherPresent ? data.teacherId : data.replacementTeacherId || data.teacherId

    // Check if teacher attendance already exists for this date
    const { data: existingTeacherAttendance, error: checkError } = await supabase
      .from("teacher_attendance")
      .select("id")
      .eq("teacher_id", teacherToRecord)
      .eq("attendance_date", data.attendanceDate)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingTeacherAttendance) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("teacher_attendance")
        .update({ present: data.teacherPresent })
        .eq("id", existingTeacherAttendance.id)

      if (updateError) throw updateError
    } else {
      // Create new record
      const { error: insertError } = await supabase.from("teacher_attendance").insert([
        {
          teacher_id: teacherToRecord,
          attendance_date: data.attendanceDate,
          present: data.teacherPresent,
        },
      ])

      if (insertError) throw insertError
    }

    // If teacher was absent and replacement was used, also record the replacement teacher as present
    if (!data.teacherPresent && data.replacementTeacherId) {
      const { data: existingReplacement, error: checkReplacementError } = await supabase
        .from("teacher_attendance")
        .select("id")
        .eq("teacher_id", data.replacementTeacherId)
        .eq("attendance_date", data.attendanceDate)
        .single()

      if (checkReplacementError && checkReplacementError.code !== "PGRST116") {
        throw checkReplacementError
      }

      if (!existingReplacement) {
        const { error: insertReplacementError } = await supabase.from("teacher_attendance").insert([
          {
            teacher_id: data.replacementTeacherId,
            attendance_date: data.attendanceDate,
            present: true,
          },
        ])

        if (insertReplacementError) throw insertReplacementError
      }
    }

    // Save student attendance
    for (const student of data.studentAttendance) {
      // Check if attendance already exists
      const { data: existingStudentAttendance, error: checkStudentError } = await supabase
        .from("student_attendance")
        .select("id")
        .eq("student_id", student.studentId)
        .eq("subject_level_id", data.subjectLevelId)
        .eq("attendance_date", data.attendanceDate)
        .single()

      if (checkStudentError && checkStudentError.code !== "PGRST116") {
        throw checkStudentError
      }

      if (existingStudentAttendance) {
        // Update existing record
        const { error: updateStudentError } = await supabase
          .from("student_attendance")
          .update({ present: student.present })
          .eq("id", existingStudentAttendance.id)

        if (updateStudentError) throw updateStudentError
      } else {
        // Create new record
        const { error: insertStudentError } = await supabase.from("student_attendance").insert([
          {
            student_id: student.studentId,
            subject_level_id: data.subjectLevelId,
            attendance_date: data.attendanceDate,
            present: student.present,
          },
        ])

        if (insertStudentError) throw insertStudentError
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[Attendance] Error saving attendance:", error)
    return { success: false, error: String(error) }
  }
}

// Get attendance records
export async function getAttendanceRecords(filters?: {
  startDate?: string
  endDate?: string
  subjectLevelId?: string
  teacherId?: string
  studentId?: string
}) {
  const supabase = await getSupabaseServer()

  try {
    // Get teacher attendance
    let teacherQuery = supabase
      .from("teacher_attendance")
      .select(
        `
        *,
        teachers (*)
      `,
      )
      .order("attendance_date", { ascending: false })

    if (filters?.startDate) {
      teacherQuery = teacherQuery.gte("attendance_date", filters.startDate)
    }
    if (filters?.endDate) {
      teacherQuery = teacherQuery.lte("attendance_date", filters.endDate)
    }
    if (filters?.teacherId) {
      teacherQuery = teacherQuery.eq("teacher_id", filters.teacherId)
    }

    const { data: teacherAttendance, error: teacherError } = await teacherQuery

    if (teacherError) throw teacherError

    // Get student attendance
    let studentQuery = supabase
      .from("student_attendance")
      .select(
        `
        *,
        students (*),
        subject_levels (
          *,
          subjects (*),
          levels (*)
        )
      `,
      )
      .order("attendance_date", { ascending: false })

    if (filters?.startDate) {
      studentQuery = studentQuery.gte("attendance_date", filters.startDate)
    }
    if (filters?.endDate) {
      studentQuery = studentQuery.lte("attendance_date", filters.endDate)
    }
    if (filters?.subjectLevelId) {
      studentQuery = studentQuery.eq("subject_level_id", filters.subjectLevelId)
    }
    if (filters?.studentId) {
      studentQuery = studentQuery.eq("student_id", filters.studentId)
    }

    const { data: studentAttendance, error: studentError } = await studentQuery

    if (studentError) throw studentError

    return {
      success: true,
      teacherAttendance: teacherAttendance || [],
      studentAttendance: studentAttendance || [],
    }
  } catch (error) {
    console.error("[Attendance] Error fetching attendance records:", error)
    return {
      success: false,
      error: String(error),
      teacherAttendance: [],
      studentAttendance: [],
    }
  }
}
