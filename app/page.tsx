"use client"

import { useState } from "react"
import StudentSection from "@/components/student-section"
import TeacherSection from "@/components/teacher-section"
import PayrollSection from "@/components/payroll-section"
import SettingsSection from "@/components/settings-section"
import Navigation from "@/components/navigation"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<"students" | "teachers" | "payroll" | "settings">("students")

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === "students" && <StudentSection />}
        {activeSection === "teachers" && <TeacherSection />}
        {activeSection === "payroll" && <PayrollSection />}
        {activeSection === "settings" && <SettingsSection />}
      </main>
    </div>
  )
}
