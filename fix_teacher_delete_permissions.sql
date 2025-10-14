-- Fix RLS policies to allow trainers to delete/update their programmed classes
-- Execute this in your Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'programmed_classes';

-- Drop ALL existing UPDATE and DELETE policies
DROP POLICY IF EXISTS "Trainers can update their assigned classes" ON programmed_classes;
DROP POLICY IF EXISTS "Trainers can delete their assigned classes" ON programmed_classes;
DROP POLICY IF EXISTS "Users can update programmed_classes based on role" ON programmed_classes;
DROP POLICY IF EXISTS "Users can delete programmed_classes based on role" ON programmed_classes;
DROP POLICY IF EXISTS "Allow trainers to update their classes" ON programmed_classes;
DROP POLICY IF EXISTS "Allow trainers to delete their classes" ON programmed_classes;
DROP POLICY IF EXISTS "Allow UPDATE programmed_classes for trainers and admins" ON programmed_classes;
DROP POLICY IF EXISTS "Allow DELETE programmed_classes for trainers and admins" ON programmed_classes;

-- Create simple, permissive UPDATE policy
-- Allow ANY trainer or admin to update ANY class
CREATE POLICY "Allow UPDATE programmed_classes for trainers and admins"
ON programmed_classes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Create simple, permissive DELETE policy
-- Allow ANY trainer or admin to delete ANY class
CREATE POLICY "Allow DELETE programmed_classes for trainers and admins"
ON programmed_classes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Verify the new policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'programmed_classes'
AND cmd IN ('UPDATE', 'DELETE');
