"use client"

import { Button } from "@/components/ui/button"

interface NavigationProps {
  activeSection: "home" | "students" | "teachers" | "payroll" | "attendance" | "settings"
  onSectionChange: (section: "home" | "students" | "teachers" | "payroll" | "attendance" | "settings") => void
}

export default function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
        <Button
          onClick={() => onSectionChange("home")}
          variant={activeSection === "home" ? "default" : "ghost"}
          className="font-medium"
        >
          Home
        </Button>
        <Button
          onClick={() => onSectionChange("attendance")}
          variant={activeSection === "attendance" ? "default" : "ghost"}
          className="font-medium"
        >
          Attendance
        </Button>
        <Button
          onClick={() => onSectionChange("students")}
          variant={activeSection === "students" ? "default" : "ghost"}
          className="font-medium"
        >
          Students
        </Button>
        <Button
          onClick={() => onSectionChange("teachers")}
          variant={activeSection === "teachers" ? "default" : "ghost"}
          className="font-medium"
        >
          Teachers
        </Button>
        <Button
          onClick={() => onSectionChange("payroll")}
          variant={activeSection === "payroll" ? "default" : "ghost"}
          className="font-medium"
        >
          Payroll
        </Button>
        <Button
          onClick={() => onSectionChange("settings")}
          variant={activeSection === "settings" ? "default" : "ghost"}
          className="font-medium"
        >
          Settings
        </Button>
      </div>
    </nav>
  )
}
