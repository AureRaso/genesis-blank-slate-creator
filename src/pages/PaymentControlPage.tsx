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
    paymentNotes: "",
    totalMonths: 1,
    monthsPaid: [] as number[],
    paymentType: "monthly",
    totalAmountDue: 0,
    amountPaid: 0
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

  const calculateMonthsBetweenDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff + 1);
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    const totalMonths = payment.total_months || calculateMonthsBetweenDates(
      payment.programmed_class.start_date, 
      payment.programmed_class.end_date
    );
    
    setEditForm({
      paymentStatus: payment.payment_status,
      paymentMethod: payment.payment_method || "",
      paymentNotes: payment.payment_notes || "",
      totalMonths,
      monthsPaid: payment.months_paid || [],
      paymentType: payment.payment_type || "monthly",
      totalAmountDue: payment.total_amount_due || (payment.programmed_class.monthly_price * totalMonths),
      amountPaid: payment.amount_paid || 0
    });
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;

    try {
      await updatePaymentMutation.mutateAsync({
        participantId: editingPayment.id,
        paymentStatus: editForm.paymentStatus,
        paymentMethod: editForm.paymentMethod,
        paymentNotes: editForm.paymentNotes,
        totalMonths: editForm.totalMonths,
        monthsPaid: editForm.monthsPaid,
        paymentType: editForm.paymentType,
        totalAmountDue: editForm.totalAmountDue,
        amountPaid: editForm.amountPaid
      });
      setEditingPayment(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handlePaymentTypeChange = (type: string) => {
    setEditForm(prev => {
      const newForm = { ...prev, paymentType: type };
      
      if (type === "full") {
        // Pago completo: marcar todos los meses como pagados
        newForm.monthsPaid = Array.from({ length: prev.totalMonths }, (_, i) => i + 1);
        newForm.amountPaid = prev.totalAmountDue;
        newForm.paymentStatus = "paid";
      } else {
        // Pago mensual: mantener los meses ya marcados
        newForm.amountPaid = prev.monthsPaid.length * (prev.totalAmountDue / prev.totalMonths);
      }
      
      return newForm;
    });
  };

  const handleMonthToggle = (month: number) => {
    setEditForm(prev => {
      const monthsPaid = prev.monthsPaid.includes(month)
        ? prev.monthsPaid.filter(m => m !== month)
        : [...prev.monthsPaid, month].sort((a, b) => a - b);
      
      const monthlyPrice = prev.totalAmountDue / prev.totalMonths;
      const amountPaid = monthsPaid.length * monthlyPrice;
      
      return {
        ...prev,
        monthsPaid,
        amountPaid,
        paymentStatus: monthsPaid.length > 0 ? "paid" : "pending"
      };
    });
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => 
    sum + (payment.total_amount_due || payment.programmed_class.monthly_price || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumno o clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Total: {filteredPayments.length} registros</span>
            </div>
          </div>
          
          {/* Total esperado integrado en la misma card */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Filtrando {filteredPayments.length} de {payments.length} registros
            </div>
            <div className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground">Total esperado:</span>
              <div className="flex items-center font-bold text-lg">
                <Euro className="h-4 w-4 mr-1" />
                {totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Pagos</CardTitle>
          <CardDescription>
            {filteredPayments.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
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
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No hay registros de pago</h3>
              <p className="text-muted-foreground">
                Los pagos de las clases aparecerán aquí cuando se registren
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{payment.student_enrollment.full_name}</h4>
                        {getStatusBadge(payment.payment_status)}
                        {payment.months_paid && payment.months_paid.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {payment.months_paid.length} mes{payment.months_paid.length > 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.student_enrollment.email}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-semibold">
                          {payment.amount_paid?.toFixed(2) || '0.00'}€ de {payment.total_amount_due?.toFixed(2) || payment.programmed_class.monthly_price}€
                        </div>
                        {payment.months_paid && payment.total_months && (
                          <div className="text-xs text-muted-foreground">
                            {payment.months_paid.length}/{payment.total_months} meses
                          </div>
                        )}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Pago</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Tipo de pago</Label>
                              <Select 
                                value={editForm.paymentType} 
                                onValueChange={handlePaymentTypeChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Pago mensual</SelectItem>
                                  <SelectItem value="full">Pago completo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {editForm.paymentType === "monthly" && (
                              <div>
                                <Label>Mensualidades pagadas</Label>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                  {Array.from({ length: editForm.totalMonths }, (_, i) => i + 1).map(month => (
                                    <div key={month} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={editForm.monthsPaid.includes(month)}
                                        onCheckedChange={() => handleMonthToggle(month)}
                                      />
                                      <Label className="text-sm">Mes {month}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Total esperado</Label>
                                <Input
                                  type="number"
                                  value={editForm.totalAmountDue}
                                  onChange={(e) => setEditForm({...editForm, totalAmountDue: parseFloat(e.target.value) || 0})}
                                />
                              </div>
                              <div>
                                <Label>Total pagado</Label>
                                <Input
                                  type="number"
                                  value={editForm.amountPaid}
                                  onChange={(e) => setEditForm({...editForm, amountPaid: parseFloat(e.target.value) || 0})}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Método de pago</Label>
                              <Select 
                                value={editForm.paymentMethod} 
                                onValueChange={(value) => setEditForm({...editForm, paymentMethod: value})}
                              >
                                <SelectTrigger>
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

                            <div>
                              <Label>Notas</Label>
                              <Textarea
                                value={editForm.paymentNotes}
                                onChange={(e) => setEditForm({...editForm, paymentNotes: e.target.value})}
                                placeholder="Notas adicionales sobre el pago..."
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setEditingPayment(null)}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                onClick={handleSavePayment}
                                disabled={updatePaymentMutation.isPending}
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{payment.programmed_class.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{payment.programmed_class.club.name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
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
                            } ({payment.programmed_class.duration_minutes}min)
                          </>
                        ) : 'Horario no definido'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {payment.programmed_class.days_of_week?.length > 0 
                          ? payment.programmed_class.days_of_week.join(', ')
                          : 'Días no definidos'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
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