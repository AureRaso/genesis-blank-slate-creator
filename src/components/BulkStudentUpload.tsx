import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminClubs } from "@/hooks/useClubs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkStudentUploadProps {
  onClose: () => void;
}

interface StudentRow {
  full_name: string;
  email: string;
  phone: string;
  level: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: StudentRow;
}

interface ProcessingResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

const BulkStudentUpload: React.FC<BulkStudentUploadProps> = ({ onClose }) => {
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<StudentRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isAdmin } = useAuth();
  const { data: adminClubs, isLoading: clubsLoading } = useAdminClubs();

  const downloadTemplate = () => {
    const headers = [
      'Nomre y Apellidos', 'Email', 'Telefono', 'Nivel de juego'
    ];
    
    const sampleData = [
      'Juan Pérez García', 'juan@email.com', '123456789', '3.5'
    ];

    const csvContent = [
      headers.join(';'),
      sampleData.join(';')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_alumnos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Plantilla descargada",
      description: "Completa la plantilla CSV con los datos de los alumnos",
    });
  };

  const parseCSV = (text: string): StudentRow[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      // Mapear los headers españoles a los campos internos
      const headerMapping: { [key: string]: string } = {
        'Nomre y Apellidos': 'full_name',
        'Email': 'email',
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
    }).filter(row => row.email); // Filter out empty rows
  };

  const validateRow = (row: StudentRow, index: number): ValidationResult => {
    const errors: string[] = [];
    
    if (!row.full_name || row.full_name.length < 2) {
      errors.push("Nombre debe tener al menos 2 caracteres");
    }
    
    if (!row.email || !/\S+@\S+\.\S+/.test(row.email)) {
      errors.push("Email inválido");
    }
    
    if (!row.phone || row.phone.length < 9) {
      errors.push("Teléfono inválido");
    }
    
    if (!row.level || row.level < 1 || row.level > 10) {
      errors.push("Nivel debe estar entre 1 y 10");
    }
    
    return {
      valid: errors.length === 0,
      errors,
      data: row
    };
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

  const processStudents = async () => {
    if (!selectedClubId || parsedData.length === 0) return;
    
    setProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      // Validate all rows first
      const validatedData = parsedData.map((row, index) => ({
        ...row,
        validation: validateRow(row, index)
      }));

      const validRows = validatedData.filter(row => row.validation.valid);
      const invalidRows = validatedData.filter(row => !row.validation.valid);

      if (validRows.length === 0) {
        toast({
          title: "No hay datos válidos",
          description: "Corrige los errores antes de continuar",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Prepare data for bulk processing
      const studentsData = validRows.map(row => ({
        ...row.validation.data!,
        club_id: selectedClubId,
        weekly_days: [], // Campo vacío por defecto
        preferred_times: [], // Campo vacío por defecto
        enrollment_period: 'mensual' // Valor por defecto
      }));

      // Call bulk processing edge function
      const { data: result, error } = await supabase.functions.invoke('bulk-create-students', {
        body: { students: studentsData }
      });

      if (error) throw error;

      setResults({
        success: result.success_count,
        failed: result.failed_count,
        errors: result.errors || []
      });

      if (result.success_count > 0) {
        toast({
          title: "Procesamiento completado",
          description: `${result.success_count} alumnos creados exitosamente`,
        });
      }

    } catch (error: any) {
      console.error('Error processing students:', error);
      toast({
        title: "Error en el procesamiento",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const validRows = parsedData.filter((row, index) => validateRow(row, index).valid);
  const invalidRows = parsedData.filter((row, index) => !validateRow(row, index).valid);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Subida Masiva de Alumnos</CardTitle>
            <CardDescription>Crea múltiples inscripciones desde un archivo CSV</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Club Selection */}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="club-select">Selecciona el club *</Label>
            <Select value={selectedClubId} onValueChange={setSelectedClubId} disabled={clubsLoading}>
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

        {/* Template Download */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium">Plantilla CSV</p>
              <p className="text-sm text-muted-foreground">Descarga la plantilla para completar con los datos</p>
            </div>
          </div>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Subir archivo CSV *</Label>
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

        {/* Data Preview */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{validRows.length}</p>
                  <p className="text-sm text-green-700">Registros válidos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">{invalidRows.length}</p>
                  <p className="text-sm text-red-700">Registros con errores</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{parsedData.length}</p>
                  <p className="text-sm text-blue-700">Total registros</p>
                </div>
              </div>
            </div>

            {/* Invalid Rows Display */}
            {invalidRows.length > 0 && (
              <div className="p-4 border-l-4 border-red-500 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Registros con errores:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {invalidRows.slice(0, 5).map((row, index) => {
                    const validation = validateRow(row, index);
                    return (
                      <p key={index} className="text-sm text-red-700">
                        Fila {parsedData.indexOf(row) + 2}: {row.email} - {validation.errors.join(', ')}
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
              <Label>Procesando alumnos...</Label>
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
                <p className="text-sm text-green-700">Alumnos creados correctamente</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-900 font-medium">{results.failed} Fallidos</p>
                <p className="text-sm text-red-700">Errores durante el procesamiento</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Errores de procesamiento:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      Fila {error.row}: {error.email} - {error.error}
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
            onClick={processStudents}
            disabled={!selectedClubId || validRows.length === 0 || processing}
            className="flex-1"
          >
            {processing ? "Procesando..." : `Crear ${validRows.length} Alumnos`}
          </Button>
          
          <Button variant="outline" onClick={onClose}>
            {results ? "Cerrar" : "Cancelar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkStudentUpload;