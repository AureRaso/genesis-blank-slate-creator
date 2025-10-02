import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const TestEnrollmentInsertion = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testInsertion = async () => {
    setTesting(true);
    setResult(null);

    console.log('🧪 [TEST] Starting test insertion...');

    try {
      // Test auth state
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🔐 [TEST] Auth state:', { authData, authError });

      // Test simple query first
      console.log('📋 [TEST] Testing simple read from student_enrollments...');
      const { data: readTest, error: readError } = await supabase
        .from('student_enrollments')
        .select('id, full_name')
        .limit(1);

      console.log('📋 [TEST] Read test result:', { readTest, readError });

      // Test insertion with minimal data
      const testPayload = {
        trainer_profile_id: 'test-trainer-id',
        club_id: 'test-club-id',
        created_by_profile_id: 'test-trainer-id',
        full_name: 'Test User',
        email: 'test@test.com',
        phone: '123456789',
        level: 3,
        weekly_days: [],
        preferred_times: [],
        enrollment_period: 'mensual',
        status: 'active'
      };

      console.log('📝 [TEST] Test payload:', testPayload);
      console.log('📥 [TEST] Attempting test insertion...');

      const { data: insertData, error: insertError } = await supabase
        .from('student_enrollments')
        .insert(testPayload)
        .select()
        .single();

      console.log('📤 [TEST] Insert result:', { insertData, insertError });

      setResult({
        authData,
        authError,
        readTest,
        readError,
        insertData,
        insertError,
        success: !insertError
      });

    } catch (error) {
      console.error('💥 [TEST] Unexpected error:', error);
      setResult({
        unexpectedError: error,
        success: false
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🧪 Test de Inserción en student_enrollments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testInsertion}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Probando...' : 'Probar Inserción'}
        </Button>

        {result && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">
              {result.success ? '✅ Resultado' : '❌ Resultado'}
            </h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestEnrollmentInsertion;