import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, FileText, Ghost, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminClubs } from "@/hooks/useClubs";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useCreateGhostEnrollments, CreateGhostEnrollmentData } from "@/hooks/useStudentEnrollments";
import { toast } from "@/hooks/use-toast";

interface GhostStudentUploadProps {
  onClose: () => void;
}

interface GhostRow {
  full_name: string;
  phone: string;
  level: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: GhostRow;
}

const GhostStudentUpload: React.FC<GhostStudentUploadProps> = ({ onClose }) => {
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<GhostRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: Array<{ name: string; error: string }> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const { isAdmin } = useAuth();
  const { data: adminClubs, isLoading: clubsLoading } = useAdminClubs();
  const { data: classes, isLoading: classesLoading } = useProgrammedClasses(selectedClubId || undefined);
  const createGhosts = useCreateGhostEnrollments();

  const downloadTemplate = () => {
    const headers = ['Nombre y Apellidos', 'Telefono', 'Nivel de juego'];
    const sampleData = ['Juan Pérez García', '612345678', '3.5'];

    const csvContent = [
      headers.join(';'),
      sampleData.join(';')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_alumnos_fantasma.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Plantilla descargada",
      description: "Completa la plantilla CSV con nombre, teléfono y nivel",
    });
  };

  const parseCSV = (text: string): GhostRow[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));

    return lines.slice(1).map((line) => {
      const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      const headerMapping: { [key: string]: string } = {
        'Nombre y Apellidos': 'full_name',
        'Telefono': 'phone',
        'Nivel de juego': 'level'
      };

      headers.forEach((header, i) => {
        const value = values[i] || '';
        const fieldName = headerMapping[header] || header.toLowerCase();

        if (fieldName === 'level') {
          row[fieldName] = value ? parseFloat(value) : undefined;
        } else {
          row[fieldName] = value || undefined;
        }
      });

      return row;
    }).filter(row => row.full_name && row.phone);
  };

  const validateRow = (row: GhostRow): ValidationResult => {
    const errors: string[] = [];

    if (!row.full_name || row.full_name.length < 2) {
      errors.push("Nombre debe tener al menos 2 caracteres");
    }

    if (!row.phone || row.phone.replace(/\D/g, '').length < 9) {
      errors.push("Teléfono inválido (mínimo 9 dígitos)");
    }

    if (!row.level || row.level < 1 || row.level > 10) {
      errors.push("Nivel debe estar entre 1 y 10");
    }

    return { valid: errors.length === 0, errors, data: row };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);

        toast({
          title: "Archivo cargado",
          description: `${parsed.length} registros encontrados`,
        });
      } catch (error) {
        toast({
          title: "Error al procesar archivo",
          description: "Verifica el formato del CSV",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const addManualEntry = () => {
    if (!manualName.trim() || !manualPhone.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Introduce nombre y teléfono",
        variant: "destructive",
      });
      return;
    }

    if (manualPhone.replace(/\D/g, '').length < 9) {
      toast({
        title: "Teléfono inválido",
        description: "El teléfono debe tener al menos 9 dígitos",
        variant: "destructive",
      });
      return;
    }

    const newRow: GhostRow = {
      full_name: manualName.trim(),
      phone: manualPhone.trim(),
      level: 5, // Default level
    };

    setParsedData(prev => [...prev, newRow]);
    setManualName("");
    setManualPhone("");
    setResults(null);
  };

  const removeEntry = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  const processGhosts = async () => {
    if (!selectedClubId || parsedData.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      const validatedData = parsedData.map((row) => ({
        ...row,
        validation: validateRow(row)
      }));

      const validRows = validatedData.filter(row => row.validation.valid);

      if (validRows.length === 0) {
        toast({
          title: "No hay datos válidos",
          description: "Corrige los errores antes de continuar",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      setProgress(30);

      const ghostsData: CreateGhostEnrollmentData[] = validRows.map(row => ({
        full_name: row.validation.data!.full_name,
        phone: row.validation.data!.phone,
        level: row.validation.data!.level,
        club_id: selectedClubId,
      }));

      const result = await createGhosts.mutateAsync({
        ghosts: ghostsData,
        classId: selectedClassId || undefined,
      });

      setProgress(100);
      setResults(result);

    } catch (error: any) {
      console.error('Error processing ghosts:', error);
      toast({
        title: "Error en el procesamiento",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const validRows = parsedData.filter((row) => validateRow(row).valid);
  const invalidRows = parsedData.filter((row) => !validateRow(row).valid);

  // Filter classes: only active, future classes for the selected club
  const availableClasses = (classes || []).filter(c => c.name);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              Pre-registro de Alumnos
            </CardTitle>
            <CardDescription>
              Registra alumnos que aún no tienen cuenta. Cuando se registren y su teléfono coincida, se vincularán automáticamente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Club Selection */}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="club-select">Selecciona el club *</Label>
            <Select value={selectedClubId} onValueChange={(val) => { setSelectedClubId(val); setSelectedClassId(""); }} disabled={clubsLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={clubsLoading ? "Cargando clubes..." : "Selecciona un club"} />
              </SelectTrigger>
              <SelectContent>
                {adminClubs?.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Class Selection */}
        {selectedClubId && (
          <div className="space-y-2">
            <Label htmlFor="class-select">Asignar a clase (opcional)</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={classesLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={classesLoading ? "Cargando clases..." : "Sin asignar a clase"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar a clase</SelectItem>
                {availableClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.start_time} ({cls.days_of_week?.join(', ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Input mode tabs */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileText className="h-4 w-4" />
              Archivo CSV
            </TabsTrigger>
          </TabsList>

          {/* Manual entry tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="manual-name">Nombre y Apellidos</Label>
                <Input
                  id="manual-name"
                  placeholder="Juan Pérez García"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualEntry(); } }}
                  disabled={!selectedClubId}
                />
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Label htmlFor="manual-phone">Teléfono</Label>
                <Input
                  id="manual-phone"
                  placeholder="612345678"
                  value={manualPhone}
                  inputMode="numeric"
                  maxLength={15}
                  onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualEntry(); } }}
                  disabled={!selectedClubId}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={addManualEntry}
                  disabled={!selectedClubId || !manualName.trim() || !manualPhone.trim()}
                  size="default"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Añadir
                </Button>
              </div>
            </div>
            {parsedData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Añade alumnos usando el formulario de arriba. Puedes añadir varios antes de pre-registrarlos.
              </p>
            )}
          </TabsContent>

          {/* CSV tab */}
          <TabsContent value="csv" className="space-y-4 mt-4">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Plantilla CSV</p>
                  <p className="text-sm text-muted-foreground">Solo necesitas: nombre, teléfono y nivel</p>
                </div>
              </div>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Subir archivo CSV</Label>
              <div className="flex items-center space-x-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={!selectedClubId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Data Preview (shared between both tabs) */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{parsedData.length} alumno{parsedData.length !== 1 ? 's' : ''} en la lista</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParsedData([])}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
              >
                Limpiar lista
              </Button>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Teléfono</th>
                    <th className="px-4 py-2 text-left">Nivel</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, index) => {
                    const validation = validateRow(row);
                    return (
                      <tr key={index} className={`border-t ${!validation.valid ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2">{row.full_name}</td>
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">{row.level}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(index)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Invalid Rows */}
            {invalidRows.length > 0 && (
              <div className="p-4 border-l-4 border-red-500 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Registros con errores:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {invalidRows.slice(0, 5).map((row, index) => {
                    const validation = validateRow(row);
                    return (
                      <p key={index} className="text-sm text-red-700">
                        {row.full_name || 'Sin nombre'} - {validation.errors.join(', ')}
                      </p>
                    );
                  })}
                  {invalidRows.length > 5 && (
                    <p className="text-sm text-red-600">... y {invalidRows.length - 5} errores más</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Creando perfiles fantasma...</Label>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-900 font-medium">{results.success} Exitosos</p>
                <p className="text-sm text-green-700">Alumnos fantasma creados</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-900 font-medium">{results.failed} Fallidos</p>
                <p className="text-sm text-red-700">Errores durante el procesamiento</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Errores:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      {error.name} - {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <Button
            onClick={processGhosts}
            disabled={!selectedClubId || validRows.length === 0 || processing}
            className="flex-1"
          >
            {processing ? "Procesando..." : `Pre-registrar ${validRows.length} Alumnos`}
          </Button>

          <Button variant="outline" onClick={onClose}>
            {results ? "Cerrar" : "Cancelar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GhostStudentUpload;