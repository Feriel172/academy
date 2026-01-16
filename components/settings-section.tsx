"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getSubjectsAndLevels } from "@/lib/actions/data"
import {
  addSubject,
  updateSubject,
  deleteSubject,
  addLevel,
  updateLevel,
  deleteLevel,
  createSubjectLevel,
  updateSubjectLevel,
  deleteSubjectLevel,
  getSubjectLevelsWithTeachers,
} from "@/lib/actions/settings"
import { getTeachers } from "@/lib/actions/teachers"

type Subject = { id: string; name: string; description?: string }
type Level = { id: string; name: string; display_order: number }
type Teacher = { id: string; first_name: string; last_name: string }
type SubjectLevel = {
  id: string
  subjectId: string
  levelId: string
  subjectName: string
  levelName: string
  pricePerMonth: number
  timesPerWeek: number
  teacherId: string | null
  teacherName: string | null
}

export default function SettingsSection() {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")

  // Subject-Level Dialog State
  const [isSubjectLevelDialogOpen, setIsSubjectLevelDialogOpen] = useState(false)
  const [editingSubjectLevel, setEditingSubjectLevel] = useState<SubjectLevel | null>(null)
  const [subjectLevelForm, setSubjectLevelForm] = useState({
    subjectId: "",
    levelId: "",
    teacherId: "",
    pricePerMonth: "",
    timesPerWeek: "1",
  })

  // Subject Dialog State
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "" })

  // Level Dialog State
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [levelForm, setLevelForm] = useState({ name: "", displayOrder: "" })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [subjectsLevelsRes, teachersRes, subjectLevelsRes] = await Promise.all([
        getSubjectsAndLevels(),
        getTeachers(),
        getSubjectLevelsWithTeachers(),
      ])

      if (subjectsLevelsRes.success) {
        setSubjects(subjectsLevelsRes.subjects || [])
        setLevels(subjectsLevelsRes.levels || [])
      }

      if (teachersRes.success) {
        setTeachers(teachersRes.data || [])
      }

      if (subjectLevelsRes.success) {
        setSubjectLevels(subjectLevelsRes.data || [])
      }
    } catch (error) {
      console.error("[Settings] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSubjectLevelDialog = (item?: SubjectLevel) => {
    if (item) {
      setEditingSubjectLevel(item)
      setSubjectLevelForm({
        subjectId: item.subjectId,
        levelId: item.levelId,
        teacherId: item.teacherId || "",
        pricePerMonth: item.pricePerMonth.toString(),
        timesPerWeek: item.timesPerWeek.toString(),
      })
    } else {
      setEditingSubjectLevel(null)
      setSubjectLevelForm({
        subjectId: "",
        levelId: "",
        teacherId: "",
        pricePerMonth: "",
        timesPerWeek: "1",
      })
    }
    setIsSubjectLevelDialogOpen(true)
  }

  const handleSaveSubjectLevel = () => {
    if (!subjectLevelForm.subjectId || !subjectLevelForm.levelId || !subjectLevelForm.teacherId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const price = parseFloat(subjectLevelForm.pricePerMonth)
    const timesPerWeek = parseInt(subjectLevelForm.timesPerWeek)

    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    if (isNaN(timesPerWeek) || timesPerWeek < 1) {
      toast({
        title: "Validation Error",
        description: "Times per week must be at least 1",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = editingSubjectLevel
        ? await updateSubjectLevel(editingSubjectLevel.id, {
            teacherId: subjectLevelForm.teacherId,
            pricePerMonth: price,
            timesPerWeek: timesPerWeek,
          })
        : await createSubjectLevel({
            subjectId: subjectLevelForm.subjectId,
            levelId: subjectLevelForm.levelId,
            teacherId: subjectLevelForm.teacherId,
            pricePerMonth: price,
            timesPerWeek: timesPerWeek,
          })

      if (result.success) {
        toast({
          title: "Success",
          description: editingSubjectLevel
            ? "Subject-Level combination updated successfully"
            : "Subject-Level combination created successfully",
        })
        setIsSubjectLevelDialogOpen(false)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteSubjectLevel = (id: string) => {
    if (!confirm("Are you sure you want to delete this subject-level combination?")) return

    startTransition(async () => {
      const result = await deleteSubjectLevel(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Subject-Level combination deleted successfully",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete",
          variant: "destructive",
        })
      }
    })
  }

  const handleOpenSubjectDialog = (item?: Subject) => {
    if (item) {
      setEditingSubject(item)
      setSubjectForm({ name: item.name, description: item.description || "" })
    } else {
      setEditingSubject(null)
      setSubjectForm({ name: "", description: "" })
    }
    setIsSubjectDialogOpen(true)
  }

  const handleSaveSubject = () => {
    if (!subjectForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject name is required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = editingSubject
        ? await updateSubject(editingSubject.id, subjectForm.name, subjectForm.description)
        : await addSubject(subjectForm.name, subjectForm.description)

      if (result.success) {
        toast({
          title: "Success",
          description: editingSubject ? "Subject updated successfully" : "Subject added successfully",
        })
        setIsSubjectDialogOpen(false)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteSubject = (id: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will also delete all related subject-level combinations."))
      return

    startTransition(async () => {
      const result = await deleteSubject(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete",
          variant: "destructive",
        })
      }
    })
  }

  const handleOpenLevelDialog = (item?: Level) => {
    if (item) {
      setEditingLevel(item)
      setLevelForm({ name: item.name, displayOrder: item.display_order.toString() })
    } else {
      setEditingLevel(null)
      setLevelForm({ name: "", displayOrder: "" })
    }
    setIsLevelDialogOpen(true)
  }

  const handleSaveLevel = () => {
    if (!levelForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Level name is required",
        variant: "destructive",
      })
      return
    }

    const displayOrder = parseInt(levelForm.displayOrder)
    if (isNaN(displayOrder) || displayOrder < 1) {
      toast({
        title: "Validation Error",
        description: "Display order must be a positive number",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = editingLevel
        ? await updateLevel(editingLevel.id, levelForm.name, displayOrder)
        : await addLevel(levelForm.name, displayOrder)

      if (result.success) {
        toast({
          title: "Success",
          description: editingLevel ? "Level updated successfully" : "Level added successfully",
        })
        setIsLevelDialogOpen(false)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteLevel = (id: string) => {
    if (!confirm("Are you sure you want to delete this level? This will also delete all related subject-level combinations."))
      return

    startTransition(async () => {
      const result = await deleteLevel(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Level deleted successfully",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete",
          variant: "destructive",
        })
      }
    })
  }

  const filteredSubjectLevels = subjectLevels.filter(
    (sl) =>
      sl.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sl.levelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sl.teacherName && sl.teacherName.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage subjects, levels, and course configurations</p>
        </div>
      </div>

      <Tabs defaultValue="subject-levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subject-levels">Subject-Level Combinations</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
        </TabsList>

        {/* Subject-Level Combinations Tab */}
        <TabsContent value="subject-levels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subject-Level Combinations</CardTitle>
                <Dialog open={isSubjectLevelDialogOpen} onOpenChange={setIsSubjectLevelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenSubjectLevelDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Combination
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSubjectLevel ? "Edit Subject-Level Combination" : "Add Subject-Level Combination"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Select value={subjectLevelForm.subjectId} onValueChange={(value) => setSubjectLevelForm({ ...subjectLevelForm, subjectId: value })}>
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

                      <div className="space-y-2">
                        <Label htmlFor="level">Level *</Label>
                        <Select value={subjectLevelForm.levelId} onValueChange={(value) => setSubjectLevelForm({ ...subjectLevelForm, levelId: value })}>
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
                        <Label htmlFor="teacher">Teacher *</Label>
                        <Select value={subjectLevelForm.teacherId} onValueChange={(value) => setSubjectLevelForm({ ...subjectLevelForm, teacherId: value })}>
                          <SelectTrigger id="teacher">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timesPerWeek">Times per Week *</Label>
                        <Input
                          id="timesPerWeek"
                          type="number"
                          min="1"
                          value={subjectLevelForm.timesPerWeek}
                          onChange={(e) => setSubjectLevelForm({ ...subjectLevelForm, timesPerWeek: e.target.value })}
                          placeholder="e.g., 2"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pricePerMonth">Price per Month (DZD) *</Label>
                        <Input
                          id="pricePerMonth"
                          type="number"
                          min="0"
                          step="0.01"
                          value={subjectLevelForm.pricePerMonth}
                          onChange={(e) => setSubjectLevelForm({ ...subjectLevelForm, pricePerMonth: e.target.value })}
                          placeholder="e.g., 5000"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsSubjectLevelDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSubjectLevel} disabled={isPending}>
                          {isPending ? "Saving..." : editingSubjectLevel ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject, level, or teacher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredSubjectLevels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No subject-level combinations found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Times/Week</TableHead>
                        <TableHead>Price (DZD)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjectLevels.map((sl) => (
                        <TableRow key={sl.id}>
                          <TableCell className="font-medium">{sl.subjectName}</TableCell>
                          <TableCell>{sl.levelName}</TableCell>
                          <TableCell>{sl.teacherName || "Not assigned"}</TableCell>
                          <TableCell>{sl.timesPerWeek}</TableCell>
                          <TableCell>{sl.pricePerMonth.toLocaleString()} DZD</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenSubjectLevelDialog(sl)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSubjectLevel(sl.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subjects</CardTitle>
                <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenSubjectDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjectName">Name *</Label>
                        <Input
                          id="subjectName"
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subjectDescription">Description</Label>
                        <Input
                          id="subjectDescription"
                          value={subjectForm.description}
                          onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSubject} disabled={isPending}>
                          {isPending ? "Saving..." : editingSubject ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No subjects found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenSubjectDialog(subject)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Levels Tab */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Levels</CardTitle>
                <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenLevelDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Level
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingLevel ? "Edit Level" : "Add Level"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="levelName">Name *</Label>
                        <Input
                          id="levelName"
                          value={levelForm.name}
                          onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                          placeholder="e.g., 1AP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="displayOrder">Display Order *</Label>
                        <Input
                          id="displayOrder"
                          type="number"
                          min="1"
                          value={levelForm.displayOrder}
                          onChange={(e) => setLevelForm({ ...levelForm, displayOrder: e.target.value })}
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsLevelDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveLevel} disabled={isPending}>
                          {isPending ? "Saving..." : editingLevel ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : levels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No levels found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levels.map((level) => (
                        <TableRow key={level.id}>
                          <TableCell className="font-medium">{level.name}</TableCell>
                          <TableCell>{level.display_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenLevelDialog(level)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteLevel(level.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
