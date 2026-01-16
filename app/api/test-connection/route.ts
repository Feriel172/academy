import { testDatabaseConnection } from "@/lib/test-connection"
import { NextResponse } from "next/server"

export async function GET() {
  const result = await testDatabaseConnection()
  return NextResponse.json(result)
}
