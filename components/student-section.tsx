"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectsAndLevels } from "@/lib/actions/data"
import { addStudent, getStudents } from "@/lib/actions/students"

type Subject = { id: string; name: string }
type Level = { id: string; name: string }
type SubjectLevel = { subjectId: string; levelId: string }

export default function StudentSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    enrollments: [] as Array<SubjectLevel>,
  })
  const [currentSubject, setCurrentSubject] = useState("")
  const [currentLevel, setCurrentLevel] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const { success: dataSuccess, subjects: subs, levels: levs } = await getSubjectsAndLevels()
        if (dataSuccess) {
          setSubjects(subs || [])
          setLevels(levs || [])
        }

        const { success: studentsSuccess, data: studentsData } = await getStudents()
        if (studentsSuccess) {
          // Format students for display
          const formattedStudents = (studentsData || []).map((student: any) => ({
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            parentName: student.parent_name,
            parentPhone: student.parent_phone,
            parentEmail: student.parent_email,
            enrollments: student.student_subject_levels || [],
          }))
          setStudents(formattedStudents)
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddEnrollment = () => {
    if (currentSubject && currentLevel) {
      // Check if enrollment already exists
      const exists = formData.enrollments.some((e) => e.subjectId === currentSubject && e.levelId === currentLevel)

      if (!exists) {
        setFormData({
          ...formData,
          enrollments: [...formData.enrollments, { subjectId: currentSubject, levelId: currentLevel }],
        })
        setCurrentSubject("")
        setCurrentLevel("")
      }
    }
  }

  const handleRemoveEnrollment = (index: number) => {
    setFormData({
      ...formData,
      enrollments: formData.enrollments.filter((_, i) => i !== index),
    })
  }

  const handleAddStudent = () => {
    if (formData.firstName && formData.lastName && formData.enrollments.length > 0) {
      startTransition(async () => {
        const result = await addStudent({
          firstName: formData.firstName,
          lastName: formData.lastName,
          parentName: formData.parentName,
          parentPhone: formData.parentPhone,
          parentEmail: formData.parentEmail,
          subjectLevels: formData.enrollments,
        })

        if (result.success) {
          // Reload students list
          const { success, data } = await getStudents()
          if (success) {
            const formattedStudents = (data || []).map((student: any) => ({
              id: student.id,
              firstName: student.first_name,
              lastName: student.last_name,
              parentName: student.parent_name,
              parentPhone: student.parent_phone,
              parentEmail: student.parent_email,
              enrollments: student.student_subject_levels || [],
            }))
            setStudents(formattedStudents)
          }

          setFormData({
            firstName: "",
            lastName: "",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            enrollments: [],
          })
          setIsAddDialogOpen(false)
        } else {
          console.error("[v0] Error:", result.error)
          alert("Failed to add student: " + result.error)
        }
      })
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id
  const getLevelName = (id: string) => levels.find((l) => l.id === id)?.name || id

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Enter parent name"
                />
              </div>
              <div>
                <Label htmlFor="parentPhone">Parent Phone</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="parentEmail">Parent Email</Label>
                <Input
                  id="parentEmail"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Enroll in Subjects & Levels</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={currentSubject} onValueChange={setCurrentSubject}>
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
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select value={currentLevel} onValueChange={setCurrentLevel}>
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
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEnrollment}
                    className="w-full bg-transparent"
                    disabled={!currentSubject || !currentLevel}
                  >
                    Add Enrollment
                  </Button>
                </div>

                {formData.enrollments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Selected Enrollments:</h4>
                    {formData.enrollments.map((enrollment, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <span className="text-sm">
                          {getSubjectName(enrollment.subjectId)} - {getLevelName(enrollment.levelId)}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveEnrollment(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddStudent}
                className="w-full"
                disabled={formData.enrollments.length === 0 || isPending}
              >
                {isPending ? "Saving..." : "Add Student"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by first or last name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedStudent(student)}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  {student.firstName} {student.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Parent:</span> {student.parentName}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {student.parentPhone}
                </p>
                <p>
                  <span className="font-medium">Enrollments:</span> {student.enrollments.length}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center py-8">
            {isLoading ? "Loading..." : "No students found"}
          </p>
        )}
      </div>

      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStudent.firstName} {selectedStudent.lastName} - Student File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{selectedStudent.parentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedStudent.parentPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedStudent.parentEmail}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Enrolled Subjects & Levels</h3>
              {selectedStudent.enrollments.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudent.enrollments.map((enrollment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                      <span>{enrollment.subject_levels?.subjects?.name}</span>
                      <span className="text-sm font-medium">{enrollment.subject_levels?.levels?.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No enrollments recorded</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Payment History</h3>
              <p className="text-muted-foreground">No payments recorded yet</p>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Attendance</h3>
              <p className="text-muted-foreground">No attendance records yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
