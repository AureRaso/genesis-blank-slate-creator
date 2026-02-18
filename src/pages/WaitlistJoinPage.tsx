import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCanJoinWaitlist, useJoinWaitlist } from "@/hooks/useClassWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Calendar, User, UserPlus, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuardianWaitlistFlow } from "@/components/waitlist/GuardianWaitlistFlow";
import { supabase } from "@/integrations/supabase/client";

const WaitlistJoinPage = () => {
  const { classId, date } = useParams<{ classId: string; date: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();

  // Si es guardian, usar flujo específico para apuntar a sus hijos
  // Este condicional NO afecta al flujo de jugadores, entrenadores o admins
  if (!authLoading && profile?.role === 'guardian' && classId && date) {
    return <GuardianWaitlistFlow classId={classId} classDate={date} />;
  }
  const { data: canJoinData, isLoading: checkingEligibility } = useCanJoinWaitlist(classId || '', date || '');
  const { mutate: joinWaitlist, isPending: isJoining, isSuccess } = useJoinWaitlist();
  const [countdown, setCountdown] = useState(3);
  const [clubCode, setClubCode] = useState<string>('');

  // Fetch club_code so we can pre-fill it in the registration form
  useEffect(() => {
    const clubId = canJoinData?.classData?.club_id;
    if (!clubId) return;
    supabase
      .from('clubs')
      .select('club_code')
      .eq('id', clubId)
      .single()
      .then(({ data }) => { if (data?.club_code) setClubCode(data.club_code); });
  }, [canJoinData?.classData?.club_id]);

  // Don't redirect to auth - let users see the waitlist info first
  // Authentication will be required when they click "Join Waitlist"

  // Wait for auth to load before showing any content
  // If auth is loading, show spinner
  // If we have eligibility data OR we know user is not authenticated, we can show content
  const shouldShowContent = !authLoading && (canJoinData !== undefined || !user);
  const isLoading = !shouldShowContent;

  // DEBUG: Log state changes
  console.log('🔍 [WAITLIST_PAGE] Render state:', {
    classId,
    date,
    authLoading,
    checkingEligibility,
    hasUser: !!user,
    userId: user?.id,
    hasCanJoinData: canJoinData !== undefined,
    canJoinData,
    canJoinReason: canJoinData?.reason,
    canJoin: canJoinData?.canJoin,
    shouldShowContent,
    isLoading
  });

  // Redirect to dashboard after 3 seconds when successfully joined waitlist
  useEffect(() => {
    if (isSuccess) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Navigate after 3 seconds
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [isSuccess, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center mx-auto">
          <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange mx-auto mb-4" />
          <p className="text-muted-foreground">{t('waitlistJoin.checking')}</p>
        </div>
      </div>
    );
  }

  // Show success screen with countdown when successfully joined
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-white w-full">
        <Card className="w-full max-w-md border-green-300 mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">{t('waitlistJoin.success.title')}</h3>
            <p className="text-center text-muted-foreground mb-4">
              {t('waitlistJoin.success.message')}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('waitlistJoin.success.redirecting', { count: countdown })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classId || !date) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 w-full">
        <Card className="w-full max-w-md border-destructive mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">{t('waitlistJoin.invalidLink.title')}</CardTitle>
            <CardDescription>{t('waitlistJoin.invalidLink.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleJoinWaitlist = () => {
    if (canJoinData?.canJoin && canJoinData.enrollmentId) {
      joinWaitlist({
        classId,
        classDate: date,
        enrollmentId: canJoinData.enrollmentId
      });
    }
  };

  // Format date nicely using the current language locale
  const formattedDate = date ? format(new Date(date), "EEEE, d MMMM yyyy", { locale: getDateFnsLocale() }) : '';

  // Show error states (but not for not_authenticated - that should show the full page with login button)
  if (canJoinData && !canJoinData.canJoin && canJoinData.reason !== 'not_authenticated') {
    let icon = <AlertTriangle className="h-12 w-12 text-yellow-600" />;
    let title = t('waitlistJoin.states.notAvailable');
    let colorClass = "border-yellow-300";
    let bgClass = "bg-yellow-50";

    if (canJoinData.reason === 'class_started' || canJoinData.reason === 'class_not_found' || canJoinData.reason === 'class_ended') {
      icon = <XCircle className="h-12 w-12 text-destructive" />;
      colorClass = "border-destructive";
      bgClass = "bg-red-50";
      if (canJoinData.reason === 'class_ended') {
        title = t('waitlistJoin.states.classEnded');
      }
    } else if (canJoinData.reason === 'class_full') {
      icon = <XCircle className="h-12 w-12 text-orange-600" />;
      title = t('waitlistJoin.states.spotTaken');
      colorClass = "border-orange-300";
      bgClass = "bg-orange-50";
    } else if (canJoinData.reason === 'already_in_waitlist' || canJoinData.reason === 'already_accepted') {
      icon = <CheckCircle2 className="h-12 w-12 text-green-600" />;
      title = t('waitlistJoin.states.alreadyInList');
      colorClass = "border-green-300";
      bgClass = "bg-green-50";
    } else if (canJoinData.reason === 'already_enrolled') {
      icon = <CheckCircle2 className="h-12 w-12 text-green-600" />;
      title = t('waitlistJoin.states.alreadyEnrolled');
      colorClass = "border-green-300";
      bgClass = "bg-green-50";
    }

    return (
      <div className={`flex items-center justify-center min-h-screen p-4 w-full ${bgClass}`}>
        <Card className={`w-full max-w-md ${colorClass} mx-auto`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {icon}
            <h3 className="text-lg font-semibold mb-2 mt-4">{title}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {canJoinData.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success screen - can join waitlist
  const classData = canJoinData?.classData;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-white w-full">
      <Card className="w-full max-w-2xl border-blue-200 mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('waitlistJoin.main.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('waitlistJoin.main.subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Class Info */}
          {classData && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">{classData.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{classData.start_time} ({classData.duration_minutes} min)</span>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>{t('waitlistJoin.main.importantTitle')}</strong> {t('waitlistJoin.main.importantText')}
                </AlertDescription>
              </Alert>

              {/* Time limit info */}
              <div className="text-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                {t('waitlistJoin.main.closesInfo')}
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-3">
                {authLoading ? (
                  <Button size="lg" className="w-full" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('waitlistJoin.buttons.loading')}
                  </Button>
                ) : !user ? (
                  // Not authenticated - show login and register buttons
                  <>
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        const returnUrl = encodeURIComponent(`/waitlist/${classId}/${date}`);
                        navigate(`/auth?return=${returnUrl}`);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('waitlistJoin.buttons.loginToJoin')}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        const returnUrl = encodeURIComponent(`/waitlist/${classId}/${date}`);
                        const clubParam = clubCode ? `&club_code=${clubCode}` : '';
                        navigate(`/auth?tab=signup${clubParam}&return=${returnUrl}`);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('waitlistJoin.buttons.registerToJoin')}
                    </Button>
                  </>
                ) : (
                  // Authenticated - show join button
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleJoinWaitlist}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('waitlistJoin.buttons.joining')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('waitlistJoin.buttons.joinWaitlist')}
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {user
                    ? t('waitlistJoin.footer.loggedIn')
                    : t('waitlistJoin.footer.loggedOut')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitlistJoinPage;
