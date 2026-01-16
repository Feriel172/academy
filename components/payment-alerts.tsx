"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPaymentAlerts, recordPayment } from "@/lib/actions/payments"

type PaymentAlert = {
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
}

export default function PaymentAlerts() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<PaymentAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const result = await getPaymentAlerts()
      if (result.success) {
        setAlerts(result.alerts || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load payment alerts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[PaymentAlerts] Error loading alerts:", error)
      toast({
        title: "Error",
        description: "Failed to load payment alerts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPaid = (alert: PaymentAlert) => {
    const today = new Date()
    const paymentDate = today.toISOString().split("T")[0]
    const monthPaidFor = today.toISOString().slice(0, 7) // YYYY-MM

    startTransition(async () => {
      const result = await recordPayment({
        studentId: alert.studentId,
        subjectLevelId: alert.subjectLevelId,
        amount: alert.amount,
        paymentDate: paymentDate,
        monthPaidFor: monthPaidFor,
      })

      if (result.success) {
        toast({
          title: "Payment Recorded",
          description: `Payment of ${alert.amount.toLocaleString()} DZD recorded for ${alert.studentName}`,
        })
        // Remove the alert from the list
        setAlerts(alerts.filter((a) => a.id !== alert.id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record payment",
          variant: "destructive",
        })
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Payment Alerts
          </CardTitle>
          <CardDescription>No pending payments at this time</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Payment Alerts ({alerts.length})
        </CardTitle>
        <CardDescription>
          Students who have completed their monthly attendance and need to pay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="font-semibold">
                {alert.studentName} - {alert.subjectName} ({alert.levelName})
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div className="text-sm">
                  <p>
                    <strong>Attendance:</strong> {alert.attendanceCount} / {alert.expectedAttendance} classes
                    {alert.timesPerWeek > 0 && ` (${alert.timesPerWeek}x per week)`}
                  </p>
                  <p className="mt-1">
                    <strong>Amount Due:</strong>{" "}
                    <span className="text-lg font-bold text-orange-600">
                      {alert.amount.toLocaleString()} DZD
                    </span>
                  </p>
                </div>
                <Button
                  onClick={() => handleMarkAsPaid(alert)}
                  disabled={isPending}
                  className="mt-2"
                  size="sm"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {isPending ? "Recording..." : "Mark as Paid"}
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={loadAlerts} size="sm">
            Refresh Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
