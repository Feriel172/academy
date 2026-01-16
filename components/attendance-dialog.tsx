"use client"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getSubjectsAndLevels } from "@/lib/actions/data"
import { getTeachers } from "@/lib/actions/teachers"
import {
  getTeacherForSubjectLevel,
  getStudentsForSubjectLevel,
  saveAttendance,
} from "@/lib/actions/attendance"

type Subject = { id: string; name: string }
type Level = { id: string; name: string }
type Teacher = { id: string; first_name: string; last_name: string }
type Student = { id: string; firstName: string; lastName: string }

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AttendanceDialog({ open, onOpenChange }: AttendanceDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null)
  const [teacherPresent, setTeacherPresent] = useState<boolean>(true)
  const [replacementTeacher, setReplacementTeacher] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [studentAttendance, setStudentAttendance] = useState<Record<string, boolean>>({})
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [subjectLevelId, setSubjectLevelId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadInitialData()
    } else {
      // Reset form when dialog closes
      setSelectedSubject("")
      setSelectedLevel("")
      setSelectedTeacher(null)
      setTeacherPresent(true)
      setReplacementTeacher("")
      setStudents([])
      setStudentAttendance({})
      setSubjectLevelId(null)
    }
  }, [open])

  const loadInitialData = async () => {
    const [subjectsLevelsRes, teachersRes] = await Promise.all([
      getSubjectsAndLevels(),
      getTeachers(),
    ])

    if (subjectsLevelsRes.success) {
      setSubjects(subjectsLevelsRes.subjects || [])
      setLevels(subjectsLevelsRes.levels || [])
    }

    if (teachersRes.success) {
      setTeachers(teachersRes.data || [])
    }
  }

  const handleSubjectLevelChange = async () => {
    if (!selectedSubject || !selectedLevel) {
      setSelectedTeacher(null)
      setStudents([])
      setStudentAttendance({})
      setSubjectLevelId(null)
      return
    }

    startTransition(async () => {
      // Get teacher for this subject-level combination
      const teacherRes = await getTeacherForSubjectLevel(selectedSubject, selectedLevel)
      if (teacherRes.success && teacherRes.teacher) {
        setSelectedTeacher({
          id: teacherRes.teacher.id,
          name: `${teacherRes.teacher.firstName} ${teacherRes.teacher.lastName}`,
        })
        setSubjectLevelId(teacherRes.subjectLevelId)
      } else {
        setSelectedTeacher(null)
        setSubjectLevelId(teacherRes.subjectLevelId || null)
        if (!teacherRes.teacher) {
          toast({
            title: "No Teacher Assigned",
            description: "No teacher is assigned to this subject-level combination. Please assign one in Settings.",
            variant: "destructive",
          })
        }
      }

      // Get students for this subject-level combination
      const studentsRes = await getStudentsForSubjectLevel(selectedSubject, selectedLevel)
      if (studentsRes.success) {
        const studentsList = studentsRes.students || []
        setStudents(studentsList)
        // Initialize all students as present by default
        const initialAttendance: Record<string, boolean> = {}
        studentsList.forEach((student) => {
          initialAttendance[student.id] = true
        })
        setStudentAttendance(initialAttendance)
      } else {
        setStudents([])
        setStudentAttendance({})
        toast({
          title: "Error",
          description: studentsRes.error || "Failed to load students",
          variant: "destructive",
        })
      }
    })
  }

  useEffect(() => {
    handleSubjectLevelChange()
  }, [selectedSubject, selectedLevel])

  const handleSaveAttendance = () => {
    if (!selectedSubject || !selectedLevel || !subjectLevelId) {
      toast({
        title: "Validation Error",
        description: "Please select both subject and level",
        variant: "destructive",
      })
      return
    }

    if (!selectedTeacher) {
      toast({
        title: "Validation Error",
        description: "No teacher assigned to this subject-level combination",
        variant: "destructive",
      })
      return
    }

    if (!teacherPresent && !replacementTeacher) {
      toast({
        title: "Validation Error",
        description: "Please select a replacement teacher when the assigned teacher is absent",
        variant: "destructive",
      })
      return
    }

    if (students.length === 0) {
      toast({
        title: "Validation Error",
        description: "No students enrolled in this subject-level combination",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const studentAttendanceArray = students.map((student) => ({
        studentId: student.id,
        present: studentAttendance[student.id] ?? true,
      }))

      const result = await saveAttendance({
        subjectLevelId: subjectLevelId!,
        attendanceDate: attendanceDate,
        teacherId: selectedTeacher.id,
        teacherPresent: teacherPresent,
        replacementTeacherId: !teacherPresent ? replacementTeacher : null,
        studentAttendance: studentAttendanceArray,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Attendance recorded successfully",
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save attendance",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Daily Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="attendanceDate">Date</Label>
            <Input
              id="attendanceDate"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>

          {/* Subject and Level Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Grade Level *</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teacher Information */}
          {selectedTeacher && (
            <div className="space-y-4 p-4 border rounded-md">
              <div className="space-y-2">
                <Label>Assigned Teacher</Label>
                <p className="text-sm font-medium">{selectedTeacher.name}</p>
              </div>

              <div className="space-y-2">
                <Label>Teacher Attendance *</Label>
                <Select
                  value={teacherPresent ? "present" : "absent"}
                  onValueChange={(value) => {
                    setTeacherPresent(value === "present")
                    if (value === "present") {
                      setReplacementTeacher("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Teacher Present</SelectItem>
                    <SelectItem value="absent">Teacher Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!teacherPresent && (
                <div className="space-y-2">
                  <Label htmlFor="replacementTeacher">Replacement Teacher *</Label>
                  <Select value={replacementTeacher} onValueChange={setReplacementTeacher}>
                    <SelectTrigger id="replacementTeacher">
                      <SelectValue placeholder="Select replacement teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers
                        .filter((t) => t.id !== selectedTeacher.id)
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Students List */}
          {students.length > 0 && (
            <div className="space-y-4">
              <Label>Students Attendance</Label>
              <div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={studentAttendance[student.id] ?? true}
                      onCheckedChange={(checked) => {
                        setStudentAttendance({
                          ...studentAttendance,
                          [student.id]: checked === true,
                        })
                      }}
                    />
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {student.firstName} {student.lastName}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {studentAttendance[student.id] ? "Present" : "Absent"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSubject && selectedLevel && students.length === 0 && !isPending && (
            <div className="text-center py-4 text-muted-foreground">
              No students enrolled in this subject-level combination
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttendance} disabled={isPending || !selectedSubject || !selectedLevel || !selectedTeacher}>
              {isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
