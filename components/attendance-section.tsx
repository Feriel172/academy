"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, UserCheck, UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAttendanceRecords } from "@/lib/actions/attendance"
import { getSubjectsAndLevels } from "@/lib/actions/data"
import { getTeachers } from "@/lib/actions/teachers"
import { getStudents } from "@/lib/actions/students"

export default function AttendanceSection() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([])
  const [studentAttendance, setStudentAttendance] = useState<any[]>([])
  const [filteredTeacherAttendance, setFilteredTeacherAttendance] = useState<any[]>([])
  const [filteredStudentAttendance, setFilteredStudentAttendance] = useState<any[]>([])

  const [subjects, setSubjects] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    subjectId: "",
    levelId: "",
    teacherId: "",
    studentId: "",
    searchQuery: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [teacherAttendance, studentAttendance, filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [attendanceRes, subjectsLevelsRes, teachersRes, studentsRes] = await Promise.all([
        getAttendanceRecords(),
        getSubjectsAndLevels(),
        getTeachers(),
        getStudents(),
      ])

      if (attendanceRes.success) {
        setTeacherAttendance(attendanceRes.teacherAttendance || [])
        setStudentAttendance(attendanceRes.studentAttendance || [])
      }

      if (subjectsLevelsRes.success) {
        setSubjects(subjectsLevelsRes.subjects || [])
        setLevels(subjectsLevelsRes.levels || [])
      }

      if (teachersRes.success) {
        setTeachers(teachersRes.data || [])
      }

      if (studentsRes.success) {
        setStudents(studentsRes.data || [])
      }
    } catch (error) {
      console.error("[Attendance] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filteredTeachers = [...teacherAttendance]
    let filteredStudents = [...studentAttendance]

    // Date filters
    if (filters.startDate) {
      filteredTeachers = filteredTeachers.filter(
        (ta) => ta.attendance_date >= filters.startDate,
      )
      filteredStudents = filteredStudents.filter(
        (sa) => sa.attendance_date >= filters.startDate,
      )
    }
    if (filters.endDate) {
      filteredTeachers = filteredTeachers.filter(
        (ta) => ta.attendance_date <= filters.endDate,
      )
      filteredStudents = filteredStudents.filter(
        (sa) => sa.attendance_date <= filters.endDate,
      )
    }

    // Teacher filter
    if (filters.teacherId) {
      filteredTeachers = filteredTeachers.filter(
        (ta) => ta.teacher_id === filters.teacherId,
      )
    }

    // Student filter
    if (filters.studentId) {
      filteredStudents = filteredStudents.filter(
        (sa) => sa.student_id === filters.studentId,
      )
    }

    // Subject/Level filter for students
    if (filters.subjectId || filters.levelId) {
      filteredStudents = filteredStudents.filter((sa) => {
        const subjectLevel = sa.subject_levels
        if (!subjectLevel) return false
        if (filters.subjectId && subjectLevel.subjects?.id !== filters.subjectId) return false
        if (filters.levelId && subjectLevel.levels?.id !== filters.levelId) return false
        return true
      })
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filteredTeachers = filteredTeachers.filter((ta) => {
        const teacher = ta.teachers
        if (!teacher) return false
        const name = `${teacher.first_name} ${teacher.last_name}`.toLowerCase()
        return name.includes(query)
      })

      filteredStudents = filteredStudents.filter((sa) => {
        const student = sa.students
        if (!student) return false
        const name = `${student.first_name} ${student.last_name}`.toLowerCase()
        const subject = sa.subject_levels?.subjects?.name?.toLowerCase() || ""
        const level = sa.subject_levels?.levels?.name?.toLowerCase() || ""
        return name.includes(query) || subject.includes(query) || level.includes(query)
      })
    }

    setFilteredTeacherAttendance(filteredTeachers)
    setFilteredStudentAttendance(filteredStudents)
  }

  const handleRefresh = () => {
    startTransition(async () => {
      await loadData()
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance & Absences</h1>
          <p className="text-muted-foreground">View and manage attendance records</p>
        </div>
        <Button onClick={handleRefresh} disabled={isPending}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Attendance</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Attendance</TabsTrigger>
        </TabsList>

        {/* Student Attendance Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={filters.subjectId}
                      onValueChange={(value) => setFilters({ ...filters, subjectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All subjects</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select
                      value={filters.levelId}
                      onValueChange={(value) => setFilters({ ...filters, levelId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All levels</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select
                      value={filters.studentId}
                      onValueChange={(value) => setFilters({ ...filters, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, subject, or level..."
                        value={filters.searchQuery}
                        onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredStudentAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.attendance_date)}</TableCell>
                          <TableCell className="font-medium">
                            {record.students?.first_name} {record.students?.last_name}
                          </TableCell>
                          <TableCell>{record.subject_levels?.subjects?.name || "-"}</TableCell>
                          <TableCell>{record.subject_levels?.levels?.name || "-"}</TableCell>
                          <TableCell>
                            {record.present ? (
                              <span className="flex items-center text-green-600">
                                <UserCheck className="mr-1 h-4 w-4" />
                                Present
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600">
                                <UserX className="mr-1 h-4 w-4" />
                                Absent
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Attendance Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select
                      value={filters.teacherId}
                      onValueChange={(value) => setFilters({ ...filters, teacherId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All teachers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All teachers</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by teacher name..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredTeacherAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeacherAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.attendance_date)}</TableCell>
                          <TableCell className="font-medium">
                            {record.teachers?.first_name} {record.teachers?.last_name}
                          </TableCell>
                          <TableCell>
                            {record.present ? (
                              <span className="flex items-center text-green-600">
                                <UserCheck className="mr-1 h-4 w-4" />
                                Present
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600">
                                <UserX className="mr-1 h-4 w-4" />
                                Absent
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
