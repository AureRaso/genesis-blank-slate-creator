import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es, enUS, it } from "date-fns/locale";
import { History, CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  usePaymentGenerationLogs,
  PaymentGenerationLog,
} from "@/hooks/usePaymentGenerationLogs";

const LOCALE_MAP: Record<string, Locale> = {
  es: es,
  en: enUS,
  it: it,
};

interface LogItemProps {
  log: PaymentGenerationLog;
  locale: Locale;
}

function LogItem({ log, locale }: LogItemProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const hasDetails = (log.details?.length || 0) > 0 || (log.errors?.length || 0) > 0;

  const getTriggeredByLabel = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'cron':
        return t('paymentControl.autoGeneration.logs.cron');
      case 'manual':
        return t('paymentControl.autoGeneration.logs.manual');
      case 'test':
        return t('paymentControl.autoGeneration.logs.test');
      default:
        return triggeredBy;
    }
  };

  const getTriggeredByColor = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'cron':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manual':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'test':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3 mb-2">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              {hasDetails ? (
                isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )
              ) : (
                <div className="w-4" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {format(new Date(log.executed_at), "PPp", { locale })}
                  </span>
                  <Badge variant="outline" className={getTriggeredByColor(log.triggered_by)}>
                    {getTriggeredByLabel(log.triggered_by)}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {t('paymentControl.autoGeneration.logs.billingDay')}: {log.billing_day} |{" "}
                  {t('paymentControl.autoGeneration.logs.period')}: {log.target_month}/{log.target_year}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {log.payments_generated > 0 && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{log.payments_generated}</span>
                </div>
              )}
              {log.payments_skipped > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{log.payments_skipped}</span>
                </div>
              )}
              {log.errors_count > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{log.errors_count}</span>
                </div>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasDetails && (
            <div className="mt-3 pt-3 border-t">
              {log.execution_time_ms && (
                <p className="text-xs text-gray-500 mb-2">
                  {t('paymentControl.autoGeneration.logs.executionTime')}: {log.execution_time_ms}ms
                </p>
              )}

              {log.details && log.details.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {t('paymentControl.autoGeneration.logs.generated')} / {t('paymentControl.autoGeneration.logs.skipped')}:
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {log.details.map((detail, index) => (
                      <div
                        key={index}
                        className="text-xs py-1 flex items-center gap-2"
                      >
                        {detail.status === 'generated' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        )}
                        <span>{detail.student_name}</span>
                        {detail.reason && (
                          <span className="text-gray-400">({detail.reason})</span>
                        )}
                        {detail.classes_count !== null && detail.classes_count !== undefined && (
                          <span className="text-gray-400">({detail.classes_count} clases)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {log.errors && log.errors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">
                    {t('paymentControl.autoGeneration.logs.errors')}:
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {log.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-xs py-1 flex items-start gap-2 text-red-600"
                      >
                        <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{error.student_name}:</span>{" "}
                          <span className="text-red-500">{error.error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PaymentGenerationLogsDialog() {
  const { t, i18n } = useTranslation();
  const { data: logs, isLoading } = usePaymentGenerationLogs(20);

  const locale = LOCALE_MAP[i18n.language] || es;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          {t('paymentControl.autoGeneration.viewLogs')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('paymentControl.autoGeneration.logs.title')}</DialogTitle>
          <DialogDescription>
            {t('paymentControl.autoGeneration.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div>
              {logs.map((log) => (
                <LogItem key={log.id} log={log} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('paymentControl.autoGeneration.logs.noLogs')}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
