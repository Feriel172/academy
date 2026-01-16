"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectsAndLevels } from "@/lib/actions/data"
import { addTeacher, getTeachers } from "@/lib/actions/teachers"

type Subject = { id: string; name: string }
type Level = { id: string; name: string }
type SubjectLevelAssignment = { subjectId: string; levelId: string; subjectLevelId: string }

export default function TeacherSection() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [subjectLevelMap, setSubjectLevelMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    paymentType: "percentage",
    paymentValue: "40",
    assignments: [] as SubjectLevelAssignment[],
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

          // Build map of subject-level combinations to their IDs
          if (subs && levs) {
            const map: Record<string, string> = {}
            // This would need to be fetched from subject_levels table
            // For now, we'll build it as we go
            setSubjectLevelMap(map)
          }
        }

        const { success: teachersSuccess, data: teachersData } = await getTeachers()
        if (teachersSuccess) {
          // Format teachers for display
          const formattedTeachers = (teachersData || []).map((teacher: any) => ({
            id: teacher.id,
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            paymentType: teacher.payment_type,
            paymentValue: teacher.payment_value,
            assignments: teacher.teacher_subject_levels || [],
          }))
          setTeachers(formattedTeachers)
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddAssignment = () => {
    if (currentSubject && currentLevel) {
      // Check if assignment already exists
      const exists = formData.assignments.some((a) => a.subjectId === currentSubject && a.levelId === currentLevel)

      if (!exists) {
        // For now, use a temporary ID - in real scenario, query for actual subject_level_id
        const tempId = `${currentSubject}-${currentLevel}`
        setFormData({
          ...formData,
          assignments: [
            ...formData.assignments,
            { subjectId: currentSubject, levelId: currentLevel, subjectLevelId: tempId },
          ],
        })
        setCurrentSubject("")
        setCurrentLevel("")
      }
    }
  }

  const handleRemoveAssignment = (index: number) => {
    setFormData({
      ...formData,
      assignments: formData.assignments.filter((_, i) => i !== index),
    })
  }

  const handleAddTeacher = () => {
    if (formData.firstName && formData.lastName && formData.assignments.length > 0) {
      startTransition(async () => {
        const result = await addTeacher({
          firstName: formData.firstName,
          lastName: formData.lastName,
          paymentType: formData.paymentType as "percentage" | "fixed",
          paymentValue: Number.parseFloat(formData.paymentValue),
          subjectLevelAssignments: formData.assignments.map((a) => ({
            subjectLevelId: a.subjectLevelId,
          })),
        })

        if (result.success) {
          // Reload teachers list
          const { success, data } = await getTeachers()
          if (success) {
            const formattedTeachers = (data || []).map((teacher: any) => ({
              id: teacher.id,
              firstName: teacher.first_name,
              lastName: teacher.last_name,
              paymentType: teacher.payment_type,
              paymentValue: teacher.payment_value,
              assignments: teacher.teacher_subject_levels || [],
            }))
            setTeachers(formattedTeachers)
          }

          setFormData({
            firstName: "",
            lastName: "",
            paymentType: "percentage",
            paymentValue: "40",
            assignments: [],
          })
          setIsAddDialogOpen(false)
        } else {
          console.error("[v0] Error:", result.error)
          alert("Failed to add teacher: " + result.error)
        }
      })
    }
  }

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id
  const getLevelName = (id: string) => levels.find((l) => l.id === id)?.name || id

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teacher Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
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
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                >
                  <SelectTrigger id="paymentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage of Revenue</SelectItem>
                    <SelectItem value="fixed">Fixed Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentValue">
                  {formData.paymentType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                </Label>
                <Input
                  id="paymentValue"
                  type="number"
                  value={formData.paymentValue}
                  onChange={(e) => setFormData({ ...formData, paymentValue: e.target.value })}
                  placeholder={formData.paymentType === "percentage" ? "e.g., 40" : "e.g., 2000"}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Assign Subjects & Levels</h3>
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
                    onClick={handleAddAssignment}
                    className="w-full bg-transparent"
                    disabled={!currentSubject || !currentLevel}
                  >
                    Add Assignment
                  </Button>
                </div>

                {formData.assignments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Teacher Assignments:</h4>
                    {formData.assignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <span className="text-sm">
                          {getSubjectName(assignment.subjectId)} - {getLevelName(assignment.levelId)}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAssignment(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddTeacher}
                className="w-full"
                disabled={formData.assignments.length === 0 || isPending}
              >
                {isPending ? "Saving..." : "Add Teacher"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTeacher(teacher)}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  {teacher.firstName} {teacher.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Payment:</span>{" "}
                  {teacher.paymentType === "percentage"
                    ? `${teacher.paymentValue}% of revenue`
                    : `$${teacher.paymentValue}/month`}
                </p>
                <p>
                  <span className="font-medium">Assignments:</span> {teacher.assignments.length}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center py-8">
            {isLoading ? "Loading..." : "No teachers added yet"}
          </p>
        )}
      </div>

      {selectedTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTeacher.firstName} {selectedTeacher.lastName} - Teacher File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment Type</p>
                <p className="font-medium">{selectedTeacher.paymentType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Value</p>
                <p className="font-medium">
                  {selectedTeacher.paymentType === "percentage"
                    ? `${selectedTeacher.paymentValue}%`
                    : `$${selectedTeacher.paymentValue}`}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Assigned Subjects & Levels</h3>
              {selectedTeacher.assignments.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeacher.assignments.map((assignment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                      <span>{assignment.subject_levels?.subjects?.name}</span>
                      <span className="text-sm font-medium">{assignment.subject_levels?.levels?.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No assignments recorded</p>
              )}
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
