/*
  # Create Recruiter Feature Schema

  ## Overview
  This migration adds recruiter functionality to the platform, including:
  - User role management (worker vs recruiter)
  - Trade categories for resume classification
  - Resume approval workflow
  - Analytics tracking

  ## New Tables

  ### 1. `user_roles`
  Defines user roles in the system
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `role` (text) - 'worker' or 'recruiter'
  - `created_at` (timestamptz)

  ### 2. `trade_categories`
  Defines trade classifications for blue collar work
  - `id` (uuid, primary key)
  - `name` (text) - Trade name (Plumbing, Electrical, HVAC, etc.)
  - `description` (text) - Trade description
  - `created_at` (timestamptz)

  ### 3. `resume_approvals`
  Tracks resume approval workflow by recruiters
  - `id` (uuid, primary key)
  - `resume_id` (uuid) - References resumes table
  - `recruiter_id` (uuid) - References user_profiles (recruiter)
  - `status` (text) - 'pending', 'approved', 'rejected'
  - `trade_category_id` (uuid) - References trade_categories
  - `notes` (text) - Recruiter notes/feedback
  - `reviewed_at` (timestamptz) - When review was completed
  - `created_at` (timestamptz)

  ### 4. `engagement_analytics`
  Tracks resume engagement metrics by trade
  - `id` (uuid, primary key)
  - `trade_category_id` (uuid) - References trade_categories
  - `resume_count` (integer) - Number of resumes in this trade
  - `pending_count` (integer) - Number pending approval
  - `approved_count` (integer) - Number approved
  - `rejected_count` (integer) - Number rejected
  - `last_updated` (timestamptz)

  ## Table Updates

  ### Updates to `resumes` table
  - Add `trade_category_id` column for classification
  - Add `approval_status` column for workflow tracking

  ## Security
  - Enable RLS on all new tables
  - Workers can only view their own data
  - Recruiters can view all resumes for approval
  - Recruiters can update approval status
  - Analytics accessible to authenticated recruiters only

  ## Important Notes
  - Default role for new users is 'worker'
  - Trade categories are pre-populated with common trades
  - Resume approval status defaults to 'pending'
  - Analytics are updated via triggers (not included here)
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'recruiter')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create trade_categories table
CREATE TABLE IF NOT EXISTS trade_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create resume_approvals table
CREATE TABLE IF NOT EXISTS resume_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  recruiter_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  trade_category_id uuid REFERENCES trade_categories(id) ON DELETE SET NULL,
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resume_id)
);

-- Create engagement_analytics table
CREATE TABLE IF NOT EXISTS engagement_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_category_id uuid NOT NULL REFERENCES trade_categories(id) ON DELETE CASCADE,
  resume_count integer DEFAULT 0,
  pending_count integer DEFAULT 0,
  approved_count integer DEFAULT 0,
  rejected_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(trade_category_id)
);

-- Add columns to resumes table
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS trade_category_id uuid REFERENCES trade_categories(id) ON DELETE SET NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Insert common trade categories
INSERT INTO trade_categories (name, description) VALUES
  ('Plumbing', 'Installation and repair of water, sewage, and drainage systems'),
  ('Electrical', 'Installation and maintenance of electrical systems and wiring'),
  ('HVAC', 'Heating, Ventilation, and Air Conditioning services'),
  ('Carpentry', 'Construction and repair of building frameworks and structures'),
  ('Welding', 'Joining metal parts using heat and pressure'),
  ('Masonry', 'Construction with brick, stone, and concrete'),
  ('Roofing', 'Installation and repair of roofing systems'),
  ('Painting', 'Interior and exterior painting and finishing'),
  ('Landscaping', 'Grounds maintenance and outdoor design'),
  ('Automotive', 'Vehicle maintenance and repair')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trade_categories (public read)
CREATE POLICY "Anyone can view trade categories"
  ON trade_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for resume_approvals
CREATE POLICY "Workers can view own resume approvals"
  ON resume_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resumes
      WHERE resumes.id = resume_approvals.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view all resume approvals"
  ON resume_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  );

CREATE POLICY "Recruiters can insert resume approvals"
  ON resume_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  );

CREATE POLICY "Recruiters can update resume approvals"
  ON resume_approvals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  );

-- RLS Policies for engagement_analytics
CREATE POLICY "Recruiters can view engagement analytics"
  ON engagement_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  );

-- RLS Policy for recruiters to view all resumes
CREATE POLICY "Recruiters can view all resumes"
  ON resumes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'recruiter'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_resume_approvals_resume_id ON resume_approvals(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_approvals_recruiter_id ON resume_approvals(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_resume_approvals_status ON resume_approvals(status);
CREATE INDEX IF NOT EXISTS idx_resume_approvals_trade_category_id ON resume_approvals(trade_category_id);
CREATE INDEX IF NOT EXISTS idx_resumes_trade_category_id ON resumes(trade_category_id);
CREATE INDEX IF NOT EXISTS idx_resumes_approval_status ON resumes(approval_status);
