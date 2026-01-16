"use client"

import { Button } from "@/components/ui/button"

interface NavigationProps {
  activeSection: "students" | "teachers" | "payroll"
  onSectionChange: (section: "students" | "teachers" | "payroll") => void
}

export default function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
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
      </div>
    </nav>
  )
}
