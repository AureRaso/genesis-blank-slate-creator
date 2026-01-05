import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Bell, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useTranslation } from "react-i18next";

// Número de WhatsApp de PadeLock
const PADELOCK_WHATSAPP_NUMBER = "34644658069";

interface WhatsAppActivationModalProps {
  userName: string;
  profileId: string;
  onCompleted: () => void;
  onDismissed: () => void;
}

export const WhatsAppActivationModal = ({
  userName,
  profileId,
  onCompleted,
  onDismissed
}: WhatsAppActivationModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Generar URL de WhatsApp con mensaje personalizado
  const generateWhatsAppUrl = () => {
    const message = t('playerDashboard.whatsappModal.helloMessage', { name: userName });
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${PADELOCK_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  };

  const handleActivateWhatsApp = async () => {
    setIsSubmitting(true);

    try {
      // Actualizar perfil marcando como completado
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_opt_in_completed: true,
          whatsapp_opt_in_date: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      // Abrir WhatsApp
      window.open(generateWhatsAppUrl(), '_blank');

      toast({
        title: t('playerDashboard.whatsappModal.perfect'),
        description: t('playerDashboard.whatsappModal.whatsappOpened'),
      });

      onCompleted();
    } catch (error) {
      console.error('Error updating whatsapp opt-in:', error);
      toast({
        title: t('playerDashboard.whatsappModal.error'),
        description: t('playerDashboard.whatsappModal.couldNotSave'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setIsSubmitting(true);

    try {
      // Actualizar perfil marcando como descartado
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_opt_in_dismissed: true,
          whatsapp_opt_in_date: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      onDismissed();
    } catch (error) {
      console.error('Error dismissing whatsapp opt-in:', error);
      toast({
        title: t('playerDashboard.whatsappModal.error'),
        description: t('playerDashboard.whatsappModal.couldNotSave'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">🎉</span>
            {t('playerDashboard.whatsappModal.welcome')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mensaje principal */}
          <div className="text-center">
            <p className="text-gray-700 leading-relaxed">
              {t('playerDashboard.whatsappModal.mainMessage')}
            </p>
          </div>

          {/* Ventajas */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-green-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('playerDashboard.whatsappModal.advantagesTitle')}
            </p>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('playerDashboard.whatsappModal.advantage1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>{t('playerDashboard.whatsappModal.advantage2')}</strong>{t('playerDashboard.whatsappModal.advantage2extra')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('playerDashboard.whatsappModal.advantage3')}</span>
              </li>
            </ul>
          </div>

          {/* Instrucción importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-sm text-amber-800 font-medium">
              {t('playerDashboard.whatsappModal.warningInstruction')} <strong>{t('playerDashboard.whatsappModal.sendMessage')}</strong> {t('playerDashboard.whatsappModal.openedInWhatsapp')}
              <br />
              <span className="text-amber-700">{t('playerDashboard.whatsappModal.untilSent')}</span>
            </p>
          </div>

          {/* Botón principal */}
          <Button
            onClick={handleActivateWhatsApp}
            disabled={isSubmitting}
            className="w-full h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('playerDashboard.whatsappModal.processing')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5" />
                {t('playerDashboard.whatsappModal.activateWhatsapp')}
              </div>
            )}
          </Button>

          {/* Enlace de descartar */}
          <div className="text-center">
            <button
              onClick={handleDismiss}
              disabled={isSubmitting}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              {t('playerDashboard.whatsappModal.dontShowAgain')}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              {t('playerDashboard.whatsappModal.wontReceiveReminders')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
