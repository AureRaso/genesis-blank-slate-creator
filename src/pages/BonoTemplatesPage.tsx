import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Ticket, Loader2, Settings } from "lucide-react";
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
  useBonoTemplates,
  useCreateBonoTemplate,
  useUpdateBonoTemplate,
  useDeleteBonoTemplate,
  useToggleBonoTemplateActive,
  BonoTemplate,
  CreateBonoTemplateInput,
  BonoUsageType,
} from "@/hooks/useBonoTemplates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClubs } from "@/hooks/useClubs";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Link } from "react-router-dom";

const initialFormState: CreateBonoTemplateInput = {
  name: "",
  description: "",
  total_classes: 10,
  price: 0,
  validity_days: null,
  usage_type: 'both',
};

export default function BonoTemplatesPage() {
  const { t } = useTranslation();
  const { data: templates, isLoading } = useBonoTemplates();
  const { data: clubs } = useClubs();
  const createTemplate = useCreateBonoTemplate();
  const updateTemplate = useUpdateBonoTemplate();
  const deleteTemplate = useDeleteBonoTemplate();
  const toggleActive = useToggleBonoTemplateActive();

  const clubCurrency = clubs?.[0]?.currency || 'EUR';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BonoTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBonoTemplateInput>(initialFormState);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(initialFormState);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: BonoTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      total_classes: template.total_classes,
      price: template.price,
      validity_days: template.validity_days,
      usage_type: template.usage_type || 'both',
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingTemplateId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      await createTemplate.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormState);
  };

  const handleDelete = async () => {
    if (deletingTemplateId) {
      await deleteTemplate.mutateAsync(deletingTemplateId);
      setIsDeleteDialogOpen(false);
      setDeletingTemplateId(null);
    }
  };

  const handleToggleActive = async (template: BonoTemplate) => {
    await toggleActive.mutateAsync({
      id: template.id,
      is_active: !template.is_active,
    });
  };

  const formatPricePerClass = (template: BonoTemplate) => {
    const pricePerClass = template.price / template.total_classes;
    return formatCurrency(pricePerClass, clubCurrency);
  };

  const formatValidity = (days: number | null) => {
    if (!days) return t("bonoTemplates.table.noExpiry");
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} ${years === 1 ? t("bonoTemplates.table.year") : t("bonoTemplates.table.years")}`;
    }
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? t("bonoTemplates.table.month") : t("bonoTemplates.table.months")}`;
    }
    return `${days} ${t("bonoTemplates.table.days")}`;
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
          <h1 className="text-2xl font-bold text-gray-900">{t("bonoTemplates.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("bonoTemplates.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/bono-templates/assign">
              <Settings className="h-4 w-4 mr-2" />
              {t("bonoTemplates.assignBonos")}
            </Link>
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("bonoTemplates.newTemplate")}
          </Button>
        </div>
      </div>

      {/* Table */}
      {templates && templates.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bonoTemplates.table.name")}</TableHead>
                <TableHead className="text-center">{t("bonoTemplates.table.classes")}</TableHead>
                <TableHead className="text-right">{t("bonoTemplates.table.price")}</TableHead>
                <TableHead className="text-right">{t("bonoTemplates.table.pricePerClass")}</TableHead>
                <TableHead className="text-center">{t("bonoTemplates.table.validity")}</TableHead>
                <TableHead className="text-center">{t("bonoTemplates.table.usageType")}</TableHead>
                <TableHead className="text-center">{t("bonoTemplates.table.status")}</TableHead>
                <TableHead className="text-right">{t("bonoTemplates.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {template.total_classes} {t("bonoTemplates.table.classesUnit")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(template.price, clubCurrency)}
                  </TableCell>
                  <TableCell className="text-right text-gray-500 text-sm">
                    {formatPricePerClass(template)} / {t("bonoTemplates.table.classUnit")}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {formatValidity(template.validity_days)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {t(`bonoTemplates.usageTypes.${template.usage_type || 'both'}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className="inline-flex items-center justify-center"
                      title={template.is_active ? t("bonoTemplates.deactivate") : t("bonoTemplates.activate")}
                    >
                      {template.is_active ? (
                        <ToggleRight className="h-7 w-7 text-emerald-600 hover:text-emerald-700 transition-colors" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-gray-400 hover:text-gray-500 transition-colors" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(template.id)}
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
          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t("bonoTemplates.empty.title")}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {t("bonoTemplates.empty.description")}
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("bonoTemplates.empty.action")}
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? t("bonoTemplates.form.editTitle") : t("bonoTemplates.form.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? t("bonoTemplates.form.editDescription")
                  : t("bonoTemplates.form.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">{t("bonoTemplates.form.name")} *</Label>
                <Input
                  id="name"
                  placeholder={t("bonoTemplates.form.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">{t("bonoTemplates.form.description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("bonoTemplates.form.descriptionPlaceholder")}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {/* Total Classes & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_classes">{t("bonoTemplates.form.totalClasses")} *</Label>
                  <Input
                    id="total_classes"
                    type="number"
                    min="1"
                    max="999"
                    value={formData.total_classes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_classes: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price">{t("bonoTemplates.form.price")} ({getCurrencySymbol(clubCurrency)}) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Price per class preview */}
              {formData.total_classes > 0 && formData.price > 0 && (
                <p className="text-sm text-gray-500 -mt-2">
                  {t("bonoTemplates.form.pricePerClassPreview", {
                    price: formatCurrency(formData.price / formData.total_classes, clubCurrency),
                  })}
                </p>
              )}

              {/* Validity Days */}
              <div className="grid gap-2">
                <Label htmlFor="validity_days">{t("bonoTemplates.form.validityDays")}</Label>
                <Input
                  id="validity_days"
                  type="number"
                  min="1"
                  max="9999"
                  placeholder={t("bonoTemplates.form.validityDaysPlaceholder")}
                  value={formData.validity_days || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validity_days: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  {t("bonoTemplates.form.validityDaysHelp")}
                </p>
              </div>

              {/* Usage Type */}
              <div className="grid gap-2">
                <Label htmlFor="usage_type">{t("bonoTemplates.form.usageType")}</Label>
                <Select
                  value={formData.usage_type || 'both'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, usage_type: value as BonoUsageType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">{t("bonoTemplates.usageTypes.both")}</SelectItem>
                    <SelectItem value="fixed">{t("bonoTemplates.usageTypes.fixed")}</SelectItem>
                    <SelectItem value="waitlist">{t("bonoTemplates.usageTypes.waitlist")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {t("bonoTemplates.form.usageTypeHelp")}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t("bonoTemplates.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {createTemplate.isPending || updateTemplate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingTemplate ? t("bonoTemplates.form.save") : t("bonoTemplates.form.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bonoTemplates.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bonoTemplates.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bonoTemplates.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("bonoTemplates.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
