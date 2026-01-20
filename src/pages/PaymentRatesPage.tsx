import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Calendar, Euro, Loader2, Settings, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePaymentRates,
  useCreatePaymentRate,
  useUpdatePaymentRate,
  useDeletePaymentRate,
  useTogglePaymentRateActive,
  PaymentRate,
  CreatePaymentRateInput,
} from "@/hooks/usePaymentRates";
import { Link } from "react-router-dom";


const initialFormState: CreatePaymentRateInput = {
  name: "",
  description: "",
  rate_type: "fija",
  periodicity: "mensual",
  fixed_price: undefined,
  price_per_class: undefined,
  billing_day: 1,
  due_days: 30,
  grace_days: 7,
};

export default function PaymentRatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rates, isLoading } = usePaymentRates();
  const createRate = useCreatePaymentRate();
  const updateRate = useUpdatePaymentRate();
  const deleteRate = useDeletePaymentRate();
  const toggleActive = useTogglePaymentRateActive();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<PaymentRate | null>(null);
  const [deletingRateId, setDeletingRateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePaymentRateInput>(initialFormState);

  const handleOpenCreate = () => {
    setEditingRate(null);
    setFormData(initialFormState);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rate: PaymentRate) => {
    setEditingRate(rate);
    setFormData({
      name: rate.name,
      description: rate.description || "",
      rate_type: rate.rate_type,
      periodicity: rate.periodicity,
      fixed_price: rate.fixed_price || undefined,
      price_per_class: rate.price_per_class || undefined,
      billing_day: rate.billing_day,
      due_days: rate.due_days,
      grace_days: rate.grace_days,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingRateId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRate) {
      await updateRate.mutateAsync({
        id: editingRate.id,
        ...formData,
      });
    } else {
      await createRate.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingRate(null);
    setFormData(initialFormState);
  };

  const handleDelete = async () => {
    if (deletingRateId) {
      await deleteRate.mutateAsync(deletingRateId);
      setIsDeleteDialogOpen(false);
      setDeletingRateId(null);
    }
  };

  const handleToggleActive = async (rate: PaymentRate) => {
    await toggleActive.mutateAsync({
      id: rate.id,
      is_active: !rate.is_active,
    });
  };

  const formatPrice = (rate: PaymentRate) => {
    if (rate.rate_type === "fija" && rate.fixed_price) {
      return `${rate.fixed_price.toFixed(2)} €`;
    }
    if (rate.rate_type === "por_clase" && rate.price_per_class) {
      return `${rate.price_per_class.toFixed(2)} € / ${t("paymentRates.detail.overview.perClass")}`;
    }
    return "-";
  };

  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      mensual: t("paymentRates.periodicity.monthly"),
      trimestral: t("paymentRates.periodicity.quarterly"),
      semestral: t("paymentRates.periodicity.semiannual"),
      anual: t("paymentRates.periodicity.annual"),
    };
    return labels[periodicity] || periodicity;
  };

  const getRateTypeLabel = (rateType: string) => {
    const labels: Record<string, string> = {
      fija: t("paymentRates.rateTypes.fixed"),
      por_clase: t("paymentRates.rateTypes.perClass"),
    };
    return labels[rateType] || rateType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("paymentRates.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("paymentRates.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/payment-rates/assign">
              <Settings className="h-4 w-4 mr-2" />
              {t("paymentRates.assignRates")}
            </Link>
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("paymentRates.newRate")}
          </Button>
        </div>
      </div>

      {/* Table */}
      {rates && rates.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("paymentRates.table.name")}</TableHead>
                <TableHead>{t("paymentRates.table.type")}</TableHead>
                <TableHead>{t("paymentRates.table.periodicity")}</TableHead>
                <TableHead className="text-right">{t("paymentRates.table.price")}</TableHead>
                <TableHead className="text-center">{t("paymentRates.table.billingDay")}</TableHead>
                <TableHead className="text-center">{t("paymentRates.table.status")}</TableHead>
                <TableHead className="text-right">{t("paymentRates.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow
                  key={rate.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/dashboard/payment-rates/${rate.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{rate.name}</p>
                        {rate.description && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {rate.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRateTypeLabel(rate.rate_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPeriodicityLabel(rate.periodicity)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(rate)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{t("paymentRates.table.day")} {rate.billing_day}</Badge>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(rate)}
                      className="inline-flex items-center justify-center"
                      title={rate.is_active ? t("paymentRates.deactivateRate") : t("paymentRates.activateRate")}
                    >
                      {rate.is_active ? (
                        <ToggleRight className="h-7 w-7 text-emerald-600 hover:text-emerald-700 transition-colors" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-gray-400 hover:text-gray-500 transition-colors" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(rate.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <Euro className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t("paymentRates.empty.title")}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {t("paymentRates.empty.description")}
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("paymentRates.empty.action")}
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? t("paymentRates.form.editTitle") : t("paymentRates.form.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingRate
                  ? t("paymentRates.form.editDescription")
                  : t("paymentRates.form.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">{t("paymentRates.form.name")} *</Label>
                <Input
                  id="name"
                  placeholder={t("paymentRates.form.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">{t("paymentRates.form.description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("paymentRates.form.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {/* Rate Type & Periodicity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("paymentRates.form.rateType")} *</Label>
                  <Select
                    value={formData.rate_type}
                    onValueChange={(value: "fija" | "por_clase") =>
                      setFormData({ ...formData, rate_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fija">{t("paymentRates.rateTypes.fixed")}</SelectItem>
                      <SelectItem value="por_clase">{t("paymentRates.rateTypes.perClass")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t("paymentRates.form.periodicity")} *</Label>
                  <Select
                    value={formData.periodicity}
                    onValueChange={(
                      value: "mensual" | "trimestral" | "semestral" | "anual"
                    ) => setFormData({ ...formData, periodicity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">{t("paymentRates.periodicity.monthly")}</SelectItem>
                      <SelectItem value="trimestral">{t("paymentRates.periodicity.quarterly")}</SelectItem>
                      <SelectItem value="semestral">{t("paymentRates.periodicity.semiannual")}</SelectItem>
                      <SelectItem value="anual">{t("paymentRates.periodicity.annual")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price */}
              <div className="grid gap-2">
                <Label htmlFor="price">
                  {formData.rate_type === "fija"
                    ? `${t("paymentRates.form.fixedPrice")} (€) *`
                    : `${t("paymentRates.form.pricePerClass")} (€) *`}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={
                    formData.rate_type === "fija"
                      ? formData.fixed_price || ""
                      : formData.price_per_class || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    if (formData.rate_type === "fija") {
                      setFormData({ ...formData, fixed_price: value });
                    } else {
                      setFormData({ ...formData, price_per_class: value });
                    }
                  }}
                  required
                />
              </div>

              {/* Billing Day */}
              <div className="grid gap-2">
                <Label htmlFor="billing_day">{t("paymentRates.form.billingDay")} (1-28) *</Label>
                <Input
                  id="billing_day"
                  type="number"
                  min="1"
                  max="28"
                  value={formData.billing_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billing_day: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  {t("paymentRates.form.billingDayHelp")}
                </p>
              </div>

              {/* Due Days & Grace Days */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="due_days">{t("paymentRates.form.dueDays")}</Label>
                  <Input
                    id="due_days"
                    type="number"
                    min="1"
                    max="90"
                    value={formData.due_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        due_days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">{t("paymentRates.form.dueDaysHelp")}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="grace_days">{t("paymentRates.form.graceDays")}</Label>
                  <Input
                    id="grace_days"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.grace_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grace_days: parseInt(e.target.value) || 7,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {t("paymentRates.form.graceDaysHelp")}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t("paymentRates.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createRate.isPending || updateRate.isPending}
              >
                {createRate.isPending || updateRate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingRate ? t("paymentRates.form.save") : t("paymentRates.form.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("paymentRates.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("paymentRates.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("paymentRates.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteRate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("paymentRates.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
