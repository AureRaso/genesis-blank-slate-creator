import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Building2, CheckCircle, Loader2, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUpdateClub, type Club } from '@/hooks/useClubs';

const COUNTRIES = [
  'Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Antigua y Barbuda', 'Arabia Saudita',
  'Argelia', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés',
  'Barbados', 'Baréin', 'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Birmania', 'Bolivia',
  'Bosnia y Herzegovina', 'Botsuana', 'Brasil', 'Brunéi', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Bután', 'Cabo Verde', 'Camboya', 'Camerún', 'Canadá', 'Catar', 'Chad', 'Chile', 'China',
  'Chipre', 'Colombia', 'Comoras', 'Corea del Norte', 'Corea del Sur', 'Costa de Marfil',
  'Costa Rica', 'Croacia', 'Cuba', 'Dinamarca', 'Dominica', 'Ecuador', 'Egipto', 'El Salvador',
  'Emiratos Árabes Unidos', 'Eritrea', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos',
  'Estonia', 'Etiopía', 'Filipinas', 'Finlandia', 'Fiyi', 'Francia', 'Gabón', 'Gambia', 'Georgia',
  'Ghana', 'Granada', 'Grecia', 'Guatemala', 'Guinea', 'Guinea-Bisáu', 'Guinea Ecuatorial',
  'Guyana', 'Haití', 'Honduras', 'Hungría', 'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda',
  'Islandia', 'Islas Marshall', 'Islas Salomón', 'Israel', 'Italia', 'Jamaica', 'Japón',
  'Jordania', 'Kazajistán', 'Kenia', 'Kirguistán', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto',
  'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Luxemburgo',
  'Macedonia del Norte', 'Madagascar', 'Malasia', 'Malaui', 'Maldivas', 'Malí', 'Malta',
  'Marruecos', 'Mauricio', 'Mauritania', 'México', 'Micronesia', 'Moldavia', 'Mónaco',
  'Mongolia', 'Montenegro', 'Mozambique', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Níger',
  'Nigeria', 'Noruega', 'Nueva Zelanda', 'Omán', 'Países Bajos', 'Pakistán', 'Palaos', 'Panamá',
  'Papúa Nueva Guinea', 'Paraguay', 'Perú', 'Polonia', 'Portugal', 'Reino Unido',
  'República Centroafricana', 'República Checa', 'República del Congo',
  'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumanía', 'Rusia',
  'Samoa', 'San Cristóbal y Nieves', 'San Marino', 'San Vicente y las Granadinas',
  'Santa Lucía', 'Santo Tomé y Príncipe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leona',
  'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 'Suazilandia', 'Sudáfrica', 'Sudán',
  'Sudán del Sur', 'Suecia', 'Suiza', 'Surinam', 'Tailandia', 'Tanzania', 'Tayikistán',
  'Timor Oriental', 'Togo', 'Tonga', 'Trinidad y Tobago', 'Túnez', 'Turkmenistán', 'Turquía',
  'Tuvalu', 'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán', 'Vanuatu', 'Vaticano', 'Venezuela',
  'Vietnam', 'Yemen', 'Yibuti', 'Zambia', 'Zimbabue',
];

const EU_COUNTRIES = new Set([
  'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre', 'Croacia', 'Dinamarca',
  'Eslovaquia', 'Eslovenia', 'Estonia', 'Finlandia', 'Francia', 'Grecia', 'Hungría',
  'Irlanda', 'Italia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Países Bajos',
  'Polonia', 'Portugal', 'República Checa', 'Rumanía', 'Suecia',
]);

interface BillingDataFormProps {
  club: Club;
}

export const BillingDataForm = ({ club }: BillingDataFormProps) => {
  const updateClub = useUpdateClub();
  const [syncing, setSyncing] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: club.legal_name || '',
    tax_id: club.tax_id || '',
    legal_entity_type: club.legal_entity_type || 'empresa',
    billing_email: club.billing_email || '',
    billing_address: club.billing_address || '',
    billing_city: club.billing_city || '',
    billing_postal_code: club.billing_postal_code || '',
    billing_province: club.billing_province || '',
    billing_country: club.billing_country || 'España',
    vat_number: club.vat_number || '',
  });

  useEffect(() => {
    setFormData({
      legal_name: club.legal_name || '',
      tax_id: club.tax_id || '',
      legal_entity_type: club.legal_entity_type || 'empresa',
      billing_email: club.billing_email || '',
      billing_address: club.billing_address || '',
      billing_city: club.billing_city || '',
      billing_postal_code: club.billing_postal_code || '',
      billing_province: club.billing_province || '',
      billing_country: club.billing_country || 'España',
      vat_number: club.vat_number || '',
    });
  }, [club]);

  const showVatField = formData.billing_country !== 'España' && EU_COUNTRIES.has(formData.billing_country);

  const handleSave = async () => {
    if (!formData.legal_name.trim() || !formData.tax_id.trim()) {
      toast.error('La razón social y el NIF/CIF son obligatorios');
      return;
    }

    try {
      await updateClub.mutateAsync({
        id: club.id,
        ...formData,
      });
    } catch {
      // Error handled by useUpdateClub hook
      return;
    }

    // Auto-sync to Holded after saving
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('holded-sync-contact', {
        body: { clubId: club.id },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          data.isNew
            ? 'Datos guardados y contacto creado'
            : 'Datos guardados y contacto actualizado'
        );
      }
    } catch (error) {
      console.error('Error syncing to Holded:', error);
      const message = error instanceof Error ? error.message : 'Datos guardados, pero error al sincronizar con Holded';
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const isHoldedSynced = !!club.holded_contact_id;
  const hasRequiredFields = formData.legal_name.trim() && formData.tax_id.trim();

  return (
    <Card className="border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl bg-white">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              Datos de Facturación
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Datos fiscales para la facturación automática con Holded
            </CardDescription>
          </div>
          {isHoldedSynced && (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 w-fit">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sincronizado con Holded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Row 1: Legal name + Tax ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="legal_name" className="text-xs sm:text-sm font-medium">
              Razón Social *
            </Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="Ej: Club Padel Madrid S.L."
              className="text-sm h-9 sm:h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tax_id" className="text-xs sm:text-sm font-medium">
              NIF/CIF *
            </Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
              placeholder="Ej: B12345678"
              className="text-sm h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Row 2: Entity type + Billing email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="legal_entity_type" className="text-xs sm:text-sm font-medium">
              Tipo de Entidad
            </Label>
            <Select
              value={formData.legal_entity_type}
              onValueChange={(val) => setFormData({ ...formData, legal_entity_type: val })}
            >
              <SelectTrigger className="text-sm h-9 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa (S.L., S.A.)</SelectItem>
                <SelectItem value="asociacion">Asociación</SelectItem>
                <SelectItem value="autonomo">Autónomo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing_email" className="text-xs sm:text-sm font-medium">
              Email de Facturación
            </Label>
            <Input
              id="billing_email"
              type="email"
              value={formData.billing_email}
              onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
              placeholder="facturacion@tuclub.com"
              className="text-sm h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Row 3: Address */}
        <div className="space-y-1.5">
          <Label htmlFor="billing_address" className="text-xs sm:text-sm font-medium">
            Dirección Fiscal
          </Label>
          <Input
            id="billing_address"
            value={formData.billing_address}
            onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
            placeholder="Calle, número, piso..."
            className="text-sm h-9 sm:h-10"
          />
        </div>

        {/* Row 4: City + Postal Code + Province */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="billing_city" className="text-xs sm:text-sm font-medium">
              Ciudad
            </Label>
            <Input
              id="billing_city"
              value={formData.billing_city}
              onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
              placeholder="Madrid"
              className="text-sm h-9 sm:h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing_postal_code" className="text-xs sm:text-sm font-medium">
              Código Postal
            </Label>
            <Input
              id="billing_postal_code"
              value={formData.billing_postal_code}
              onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
              placeholder="28001"
              className="text-sm h-9 sm:h-10"
              maxLength={10}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing_province" className="text-xs sm:text-sm font-medium">
              Provincia
            </Label>
            <Input
              id="billing_province"
              value={formData.billing_province}
              onChange={(e) => setFormData({ ...formData, billing_province: e.target.value })}
              placeholder="Madrid"
              className="text-sm h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Row 5: Country + VAT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium">
              País
            </Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between text-sm h-9 sm:h-10 font-normal"
                >
                  {formData.billing_country || 'Selecciona un país'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar país..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún país.</CommandEmpty>
                    <CommandGroup>
                      {COUNTRIES.map((country) => (
                        <CommandItem
                          key={country}
                          value={country}
                          onSelect={() => {
                            setFormData({ ...formData, billing_country: country, vat_number: country === 'España' ? '' : formData.vat_number });
                            setCountryOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", formData.billing_country === country ? "opacity-100" : "opacity-0")} />
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {showVatField && (
            <div className="space-y-1.5">
              <Label htmlFor="vat_number" className="text-xs sm:text-sm font-medium">
                VAT Number
              </Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value.toUpperCase() })}
                placeholder="Ej: DE123456789"
                className="text-sm h-9 sm:h-10"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateClub.isPending || syncing}
            className="flex-1 sm:flex-none"
            size="sm"
          >
            {updateClub.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando con Holded...
              </>
            ) : (
              'Guardar datos fiscales'
            )}
          </Button>
        </div>

        {!hasRequiredFields && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Rellena al menos la razón social y el NIF/CIF para poder sincronizar con Holded.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};