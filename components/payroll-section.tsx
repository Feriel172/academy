"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export default function PayrollSection() {
  const [payroll, setPayroll] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    teacherName: "",
    month: new Date().toISOString().slice(0, 7),
    salary: "",
    status: "pending",
  })

  const handleAddPayroll = () => {
    if (formData.teacherName && formData.salary) {
      const newPayroll = {
        id: Date.now(),
        ...formData,
        salary: Number.parseFloat(formData.salary),
      }
      setPayroll([...payroll, newPayroll])
      setFormData({
        teacherName: "",
        month: new Date().toISOString().slice(0, 7),
        salary: "",
        status: "pending",
      })
      setIsDialogOpen(false)
    }
  }

  const handleMarkAsPaid = (id: number) => {
    setPayroll(payroll.map((p) => (p.id === id ? { ...p, status: "paid" } : p)))
  }

  const totalAmount = payroll.reduce((sum, p) => sum + p.salary, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Process Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Teacher Payroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teacherName">Teacher Name</Label>
                <Input
                  id="teacherName"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  placeholder="Enter teacher name"
                />
              </div>
              <div>
                <Label htmlFor="month">Payroll Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary Amount</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Enter salary amount"
                />
              </div>
              <Button onClick={handleAddPayroll} className="w-full">
                Add Payroll
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {payroll.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teachers</p>
                  <p className="text-2xl font-bold">{new Set(payroll.map((p) => p.teacherName)).size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold">
                    {payroll.filter((p) => p.status === "paid").length}/{payroll.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.teacherName}</TableCell>
                        <TableCell>{record.month}</TableCell>
                        <TableCell>${record.salary.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              record.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(record.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No payroll records yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
