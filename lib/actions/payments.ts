"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

// Get payment alerts - students who have attended enough classes but haven't paid
export async function getPaymentAlerts() {
  const supabase = await getSupabaseServer()

  try {
    // Get all active student enrollments with subject-level info
    const { data: enrollments, error: enrollError } = await supabase
      .from("student_subject_levels")
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
      .eq("active", true)

    if (enrollError) throw enrollError

    const alerts: Array<{
      id: string
      studentId: string
      studentName: string
      subjectLevelId: string
      subjectName: string
      levelName: string
      attendanceCount: number
      expectedAttendance: number
      amount: number
      timesPerWeek: number
    }> = []

    const currentDate = new Date()
    const currentMonth = currentDate.toISOString().slice(0, 7) // YYYY-MM format
    const startOfMonth = `${currentMonth}-01`

    for (const enrollment of enrollments || []) {
      const subjectLevel = enrollment.subject_levels
      if (!subjectLevel) continue

      const timesPerWeek = subjectLevel.times_per_week || 1
      // Calculate expected attendance: times_per_week * 4 (assuming 4 weeks per month)
      const expectedAttendance = timesPerWeek * 4

      // Get attendance count for this student in this subject-level for current month
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("student_attendance")
        .select("id")
        .eq("student_id", enrollment.student_id)
        .eq("subject_level_id", enrollment.subject_level_id)
        .eq("present", true)
        .gte("attendance_date", startOfMonth)
        .lte("attendance_date", currentDate.toISOString().split("T")[0])

      if (attendanceError) {
        console.error(`Error fetching attendance for enrollment ${enrollment.id}:`, attendanceError)
        continue
      }

      const attendanceCount = attendanceRecords?.length || 0

      // Check if student has already paid for this month
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select("id")
        .eq("student_id", enrollment.student_id)
        .eq("subject_level_id", enrollment.subject_level_id)
        .eq("month_paid_for", currentMonth)

      if (paymentError) {
        console.error(`Error fetching payments for enrollment ${enrollment.id}:`, paymentError)
        continue
      }

      // If student has attended enough classes and hasn't paid, create an alert
      if (attendanceCount >= expectedAttendance && (!payments || payments.length === 0)) {
        alerts.push({
          id: enrollment.id,
          studentId: enrollment.student_id,
          studentName: `${enrollment.students.first_name} ${enrollment.students.last_name}`,
          subjectLevelId: enrollment.subject_level_id,
          subjectName: subjectLevel.subjects?.name || "Unknown",
          levelName: subjectLevel.levels?.name || "Unknown",
          attendanceCount,
          expectedAttendance,
          amount: parseFloat(subjectLevel.price_per_month) || 0,
          timesPerWeek,
        })
      }
    }

    return { success: true, alerts }
  } catch (error) {
    console.error("[Payments] Error fetching payment alerts:", error)
    return { success: false, error: String(error), alerts: [] }
  }
}

// Record a payment
export async function recordPayment(data: {
  studentId: string
  subjectLevelId: string
  amount: number
  paymentDate: string // YYYY-MM-DD format
  monthPaidFor: string // YYYY-MM format
}) {
  const supabase = await getSupabaseServer()

  try {
    // Check if payment already exists for this month
    const { data: existingPayment, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("student_id", data.studentId)
      .eq("subject_level_id", data.subjectLevelId)
      .eq("month_paid_for", data.monthPaidFor)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingPayment) {
      // Update existing payment
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          amount: data.amount,
          payment_date: data.paymentDate,
        })
        .eq("id", existingPayment.id)

      if (updateError) throw updateError
      return { success: true, paymentId: existingPayment.id }
    } else {
      // Create new payment
      const { data: newPayment, error: insertError } = await supabase
        .from("payments")
        .insert([
          {
            student_id: data.studentId,
            subject_level_id: data.subjectLevelId,
            amount: data.amount,
            payment_date: data.paymentDate,
            month_paid_for: data.monthPaidFor,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError
      return { success: true, paymentId: newPayment.id }
    }
  } catch (error) {
    console.error("[Payments] Error recording payment:", error)
    return { success: false, error: String(error) }
  }
}

// Get payment history for a student
export async function getStudentPayments(studentId: string) {
  const supabase = await getSupabaseServer()

  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        subject_levels (
          *,
          subjects (*),
          levels (*)
        )
      `,
      )
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false })

    if (error) throw error

    return { success: true, payments: payments || [] }
  } catch (error) {
    console.error("[Payments] Error fetching student payments:", error)
    return { success: false, error: String(error), payments: [] }
  }
}
