"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testDatabaseConnection } from "@/lib/test-connection"

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to test the connection to your Supabase database.
            </p>
            <Button onClick={handleTest} disabled={loading}>
              {loading ? "Testing..." : "Test Connection"}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                {result.success ? "✓ Connection Successful" : "✗ Connection Failed"}
              </h3>
              {result.message && (
                <p className="text-sm mb-2">{result.message}</p>
              )}
              {result.error && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{result.error}</p>
              )}
              {result.details && (
                <div className="mt-2 text-sm">
                  <p><strong>Environment Variables:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    <li>NEXT_PUBLIC_SUPABASE_URL: {result.details.url}</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {result.details.key}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Environment Variables Check:</h4>
            <div className="text-sm space-y-1">
              <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}</p>
              <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
