"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export async function testDatabaseConnection() {
  try {
    const supabase = await getSupabaseServer()
    
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .limit(1)
    
    if (error) {
      // If subjects table doesn't exist, try levels
      const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("*")
        .limit(1)
      
      if (levelsError) {
        return {
          success: false,
          error: `Database connection failed: ${levelsError.message}`,
          details: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
          }
        }
      }
    }
    
    return {
      success: true,
      message: "Database connection successful!",
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Connection error: ${error.message}`,
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
      }
    }
  }
}
