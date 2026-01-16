# Database Setup Guide

## Step 1: Verify Environment Variables

Your `.env.local` file should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://kwndtvfmnvlgfccedlgf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bmR0dmZtbnZsZ2ZjY2VkbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUwMzcsImV4cCI6MjA4MzkwMTAzN30.4qJFEFc52Jc99r0J24MlPDMMDDZ-bjQhWAsxVsFrz4M
```

✅ This file has been created in your project root.

## Step 2: Set Up Database Schema

You need to run the SQL migration scripts in your Supabase SQL Editor in order:

### 1. Create Initial Schema
Run `scripts/03_add_subjects_levels_migration.sql` - This creates all the tables with the subject-level structure.

### 2. Add Times Per Week Column
Run `scripts/04_add_times_per_week.sql` - This adds the `times_per_week` column to the `subject_levels` table.

## Step 3: Test Database Connection

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/test-connection`
3. Click "Test Connection" to verify the database connection

## Step 4: Verify Tables Exist

After running the migrations, you should have these tables:
- `subjects`
- `levels`
- `subject_levels`
- `students`
- `teachers`
- `student_subject_levels`
- `teacher_subject_levels`
- `payments`
- `payroll`
- `student_attendance`
- `teacher_attendance`

## Troubleshooting

### Connection Issues
- Make sure `.env.local` is in the project root
- Restart the dev server after creating/modifying `.env.local`
- Verify your Supabase project is active
- Check that your Supabase URL and key are correct

### Missing Tables
- Run the migration scripts in order
- Check Supabase SQL Editor for any errors
- Verify Row Level Security (RLS) policies allow access

### Environment Variables Not Loading
- Ensure the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Restart the Next.js dev server
- Clear `.next` cache: `rm -rf .next` (or delete the `.next` folder)
