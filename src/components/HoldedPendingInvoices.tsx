import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useHoldedInvoices, useReprocessHoldedInvoice, useReprocessAllPending } from '@/hooks/useHoldedInvoices';

interface HoldedPendingInvoicesProps {
  clubId?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  synced: { label: 'Sincronizada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  error: { label: 'Error', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export const HoldedPendingInvoices = ({ clubId }: HoldedPendingInvoicesProps) => {
  const { data: invoices, isLoading } = useHoldedInvoices(clubId);
  const reprocessOne = useReprocessHoldedInvoice();
  const reprocessAll = useReprocessAllPending();

  const pendingCount = invoices?.filter(i => i.status === 'pending' || i.status === 'error').length || 0;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg rounded-xl bg-white">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl bg-white">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              Facturas Holded
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              {pendingCount > 0
                ? `${pendingCount} factura${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} de sincronizar`
                : 'Todas las facturas están sincronizadas'
              }
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Button
              onClick={() => reprocessAll.mutate(clubId)}
              disabled={reprocessAll.isPending}
              size="sm"
              className="w-fit"
            >
              {reprocessAll.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reprocesando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reprocesar todas ({pendingCount})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay facturas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_80px_100px_80px] gap-3 px-3 py-2 text-xs font-medium text-gray-500 border-b">
              <span>Club / Referencia Stripe</span>
              <span>Fecha</span>
              <span className="text-right">Importe</span>
              <span className="text-center">Estado</span>
              <span></span>
            </div>

            {/* Rows */}
            {invoices.map((invoice) => {
              const config = statusConfig[invoice.status] || statusConfig.pending;
              const date = new Date(invoice.created_at);
              const canReprocess = invoice.status === 'pending' || invoice.status === 'error';

              return (
                <div
                  key={invoice.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_80px] gap-2 sm:gap-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors items-center"
                >
                  {/* Club + Stripe ref */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{invoice.club_name}</p>
                    <p className="text-xs text-gray-400 truncate font-mono">
                      {invoice.stripe_invoice_id}
                    </p>
                    {invoice.holded_invoice_num && (
                      <p className="text-xs text-green-600">Holded: {invoice.holded_invoice_num}</p>
                    )}
                    {invoice.error_message && invoice.status === 'error' && (
                      <p className="text-xs text-red-500 truncate mt-0.5">{invoice.error_message}</p>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-xs text-gray-500">
                    {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>

                  {/* Amount */}
                  <span className="text-sm font-medium text-right">
                    {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                  </span>

                  {/* Status */}
                  <div className="flex justify-center">
                    <Badge variant={config.variant} className="text-xs flex items-center gap-1">
                      {config.icon}
                      {config.label}
                    </Badge>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    {canReprocess && (
                      <Button
                        onClick={() => reprocessOne.mutate(invoice.stripe_invoice_id)}
                        disabled={reprocessOne.isPending}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                      >
                        {reprocessOne.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};