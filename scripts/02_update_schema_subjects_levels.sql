-- Drop old constraints and tables to rebuild with subject-level structure
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS teacher_classes CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS teacher_attendance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS student_classes CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create levels table
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subject_level combinations (a subject can be taught at multiple levels with different prices)
CREATE TABLE subject_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  price_per_month DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject_id, level_id)
);

-- Students table (removed grade_level, replaced with subject-level enrollments)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  parent_name VARCHAR(100),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollments in subject-level combinations
CREATE TABLE student_subject_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_level_id UUID NOT NULL REFERENCES subject_levels(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table (now references subject_level instead of class)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_level_id UUID NOT NULL REFERENCES subject_levels(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  month_paid_for VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
  payment_value DECIMAL(10, 2) NOT NULL, -- percentage (e.g., 40) or fixed amount
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher assignments to subject-level combinations
CREATE TABLE teacher_subject_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_level_id UUID NOT NULL REFERENCES subject_levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, subject_level_id)
);

-- Teacher attendance table
CREATE TABLE teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student attendance table
CREATE TABLE student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_level_id UUID NOT NULL REFERENCES subject_levels(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll table
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  payroll_month DATE NOT NULL,
  attendance_days INT DEFAULT 0,
  total_students INT DEFAULT 0,
  salary_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid'
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_students_name ON students(first_name, last_name);
CREATE INDEX idx_subject_level_subject ON subject_levels(subject_id);
CREATE INDEX idx_subject_level_level ON subject_levels(level_id);
CREATE INDEX idx_student_subject_levels_student ON student_subject_levels(student_id);
CREATE INDEX idx_student_subject_levels_subject_level ON student_subject_levels(subject_level_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_teacher_subject_levels_teacher ON teacher_subject_levels(teacher_id);
CREATE INDEX idx_teacher_attendance_teacher ON teacher_attendance(teacher_id, attendance_date);
CREATE INDEX idx_student_attendance_student ON student_attendance(student_id, attendance_date);
CREATE INDEX idx_payroll_teacher ON payroll(teacher_id);

-- Insert predefined levels
INSERT INTO levels (name, display_order) VALUES
('Preparatory', 1),
('1AP', 2),
('2AP', 3),
('3AP', 4),
('4AP', 5),
('5AP', 6),
('1AM', 7),
('2AM', 8),
('3AM', 9),
('4AM', 10),
('1AS', 11),
('2AS', 12),
('Final Year', 13);

-- Insert predefined subjects
INSERT INTO subjects (name, description) VALUES
('Arabic', 'Arabic Language'),
('Math', 'Mathematics'),
('Physics', 'Physics'),
('English', 'English Language'),
('French', 'French Language'),
('Writing Improvement', 'Writing and Composition');
