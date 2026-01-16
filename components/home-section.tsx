"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, ClipboardCheck } from "lucide-react"
import AttendanceDialog from "./attendance-dialog"
import PaymentAlerts from "./payment-alerts"

export default function HomeSection() {
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academy Management System</h1>
        <p className="text-muted-foreground">Welcome to your school management dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={() => setIsAttendanceDialogOpen(true)}
                className="w-full"
                size="lg"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Record Daily Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Manage student enrollments and information</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Manage teacher assignments and information</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>Configure subjects, levels, and pricing</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Payment Alerts */}
      <PaymentAlerts />

      <AttendanceDialog
        open={isAttendanceDialogOpen}
        onOpenChange={setIsAttendanceDialogOpen}
      />
    </div>
  )
}
