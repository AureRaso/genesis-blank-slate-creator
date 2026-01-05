import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PasswordChangeSectionProps {
  canChangePassword: boolean;
  authProviderMessage: string;
}

export const PasswordChangeSection = ({ canChangePassword, authProviderMessage }: PasswordChangeSectionProps) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!newPassword || !confirmPassword) {
      toast.error(t('settings.passwordChange.errorFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordChange.errorPasswordsMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.passwordChange.errorMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(t('settings.passwordChange.passwordUpdated'));

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || t('settings.passwordChange.errorUpdating'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error(t('common.error'));
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(t('settings.passwordChange.passwordUpdated'));
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      toast.error(t('settings.passwordChange.errorUpdating'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!canChangePassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('settings.passwordChange.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.passwordChange.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-medium mb-2">{authProviderMessage}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.passwordChange.googleMessage')}
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {t('settings.passwordChange.titleChange')}
        </CardTitle>
        <CardDescription>
          {authProviderMessage}. {t('settings.passwordChange.descriptionChange')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="ml-2 text-blue-800">
              <p className="text-sm">
                {t('settings.passwordChange.requirements')}
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs sm:text-sm">{t('settings.passwordChange.newPassword')}</Label>
              <div className="relative max-w-md">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.passwordChange.newPasswordPlaceholder')}
                  className="pr-10 text-sm h-9 sm:h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs sm:text-sm">{t('settings.passwordChange.confirmPassword')}</Label>
              <div className="relative max-w-md">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.passwordChange.confirmPasswordPlaceholder')}
                  className="pr-10 text-sm h-9 sm:h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-auto"
              size="sm"
            >
              {isLoading ? t('settings.passwordChange.updating') : t('settings.passwordChange.changePassword')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
