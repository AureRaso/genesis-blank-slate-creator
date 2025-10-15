import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CreditCard, 
  Search, 
  Banknote, 
  CheckCircle, 
  Clock, 
  Euro,
  Edit,
  Calendar,
  User,
  Building,
  AlertCircle
} from "lucide-react";
import { usePaymentRecords, useUpdatePaymentStatus } from "@/hooks/usePaymentControl";
import { useAdminClubs } from "@/hooks/useClubs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PaymentControlPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    paymentStatus: "",
    paymentMethod: "",
    paymentVerified: false,
    paymentNotes: ""
  });

  const { data: clubs = [] } = useAdminClubs();
  const { data: payments = [], isLoading } = usePaymentRecords({
    clubId: selectedClub,
    paymentStatus: statusFilter,
    paymentMethod: methodFilter
  });
  const updatePaymentMutation = useUpdatePaymentStatus();
  const { toast } = useToast();

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.student_enrollment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.student_enrollment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.programmed_class.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>;
      case "verified":
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method?: string) => {
    if (!method) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    return method === "efectivo" ? 
      <Banknote className="h-4 w-4 text-green-600" /> : 
      <CreditCard className="h-4 w-4 text-blue-600" />;
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setEditForm({
      paymentStatus: payment.payment_status,
      paymentMethod: payment.payment_method || "",
      paymentVerified: payment.payment_verified,
      paymentNotes: payment.payment_notes || ""
    });
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;

    try {
      await updatePaymentMutation.mutateAsync({
        participantId: editingPayment.id,
        paymentStatus: editForm.paymentStatus,
        paymentMethod: editForm.paymentMethod,
        paymentVerified: editForm.paymentVerified,
        paymentNotes: editForm.paymentNotes
      });
      setEditingPayment(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => 
    sum + (payment.programmed_class.monthly_price || 0), 0
  );

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Control de Pagos
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Gestiona los pagos de las clases programadas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumno o clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 text-sm"
              />
            </div>

            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clubes</SelectItem>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="verified">Verificado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground sm:col-span-2 lg:col-span-1">
              <span>Total: {filteredPayments.length} registros</span>
            </div>
          </div>

          {/* Total esperado integrado en la misma card */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Filtrando {filteredPayments.length} de {payments.length} registros
            </div>
            <div className="flex items-center space-x-2 bg-muted px-3 sm:px-4 py-2 rounded-lg">
              <span className="text-xs sm:text-sm text-muted-foreground">Total esperado:</span>
              <div className="flex items-center font-bold text-base sm:text-lg">
                <Euro className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader className="p-2 sm:p-4">
          <CardTitle className="text-base sm:text-lg">Registros de Pagos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredPayments.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-3 sm:p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-xl font-medium mb-2">No hay registros de pago</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Los pagos de las clases aparecerán aquí cuando se registren
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm sm:text-base truncate">{payment.student_enrollment.full_name}</h4>
                        {getStatusBadge(payment.payment_status)}
                        {payment.payment_verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Verificado</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{payment.student_enrollment.email}</p>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="font-semibold text-sm sm:text-base">{payment.programmed_class.monthly_price}€</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:w-full max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Editar Pago</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <Label className="text-xs sm:text-sm">Estado del pago</Label>
                              <Select
                                value={editForm.paymentStatus}
                                onValueChange={(value) => setEditForm({...editForm, paymentStatus: value})}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendiente</SelectItem>
                                  <SelectItem value="paid">Pagado</SelectItem>
                                  <SelectItem value="verified">Verificado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs sm:text-sm">Método de pago</Label>
                              <Select
                                value={editForm.paymentMethod}
                                onValueChange={(value) => setEditForm({...editForm, paymentMethod: value})}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="efectivo">
                                    <div className="flex items-center">
                                      <Banknote className="h-4 w-4 mr-2" />
                                      Efectivo
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="tarjeta">
                                    <div className="flex items-center">
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Tarjeta
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={editForm.paymentVerified}
                                onCheckedChange={(checked) => setEditForm({...editForm, paymentVerified: !!checked})}
                              />
                              <Label className="text-xs sm:text-sm">Pago verificado</Label>
                            </div>

                            <div>
                              <Label className="text-xs sm:text-sm">Notas</Label>
                              <Textarea
                                value={editForm.paymentNotes}
                                onChange={(e) => setEditForm({...editForm, paymentNotes: e.target.value})}
                                placeholder="Notas adicionales sobre el pago..."
                                className="text-sm min-h-[80px]"
                              />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setEditingPayment(null)}
                                className="w-full sm:w-auto text-sm"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleSavePayment}
                                disabled={updatePaymentMutation.isPending}
                                className="w-full sm:w-auto text-sm"
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{payment.programmed_class.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 min-w-0">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{payment.programmed_class.club.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 min-w-0">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {payment.programmed_class.start_time ? (
                          <>
                            {payment.programmed_class.start_time.slice(0, 5)} - {
                              (() => {
                                const [hours, minutes] = payment.programmed_class.start_time.split(':').map(Number);
                                const totalMinutes = hours * 60 + minutes + payment.programmed_class.duration_minutes;
                                const endHours = Math.floor(totalMinutes / 60);
                                const endMins = totalMinutes % 60;
                                return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                              })()
                            } <span className="hidden sm:inline">({payment.programmed_class.duration_minutes}min)</span>
                          </>
                        ) : 'Horario no definido'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 min-w-0">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {payment.programmed_class.days_of_week?.length > 0
                          ? payment.programmed_class.days_of_week.join(', ')
                          : 'Días no definidos'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs sm:text-sm">
                    {getMethodIcon(payment.payment_method)}
                    <span>{payment.payment_method || 'No especificado'}</span>
                  </div>

                  {payment.payment_date && (
                    <div className="text-sm text-muted-foreground">
                      Fecha de pago: {format(new Date(payment.payment_date), "dd 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  )}

                  {payment.payment_notes && (
                    <div className="bg-muted p-3 rounded text-sm">
                      <strong>Notas:</strong> {payment.payment_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentControlPage;