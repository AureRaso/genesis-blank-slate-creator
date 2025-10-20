/**
 * OwnerSystemPage
 *
 * Página de información del sistema para el owner.
 * Muestra estado de la base de datos, tablas, estadísticas de rendimiento.
 */

import { useState } from "react";
import { OwnerLayout } from "@/components/OwnerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, Table as TableIcon, Activity, Server, HardDrive, CheckCircle, AlertCircle } from "lucide-react";

interface TableInfo {
  table_name: string;
  row_count: number;
}

export const OwnerSystemPage = () => {
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "checking">("checking");

  // Verificar estado de la base de datos
  const { data: dbHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["db-health"],
    queryFn: async () => {
      try {
        const { error } = await supabase.from("profiles").select("id").limit(1);
        if (error) {
          setDbStatus("offline");
          return { status: "offline", message: error.message };
        }
        setDbStatus("online");
        return { status: "online", message: "Database is healthy" };
      } catch (error: any) {
        setDbStatus("offline");
        return { status: "offline", message: error.message || "Unknown error" };
      }
    },
    refetchInterval: 30000, // Verificar cada 30 segundos
  });

  // Obtener conteo de registros por tabla
  const { data: tableCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["table-counts"],
    queryFn: async (): Promise<TableInfo[]> => {
      const tables = [
        "profiles",
        "clubs",
        "student_enrollments",
        "programmed_classes",
        "class_participants",
        "leagues",
        "league_enrollments",
      ];

      const counts = await Promise.all(
        tables.map(async (table) => {
          try {
            const { count, error } = await supabase
              .from(table)
              .select("*", { count: "exact", head: true });

            if (error) {
              console.warn(`Error counting ${table}:`, error);
              return { table_name: table, row_count: 0 };
            }

            return { table_name: table, row_count: count || 0 };
          } catch (error) {
            console.warn(`Error counting ${table}:`, error);
            return { table_name: table, row_count: 0 };
          }
        })
      );

      return counts;
    },
    retry: false,
  });

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      profiles: "Perfiles",
      clubs: "Clubes",
      student_enrollments: "Inscripciones",
      programmed_classes: "Clases Programadas",
      class_participants: "Participantes",
      leagues: "Ligas",
      league_enrollments: "Inscripciones a Ligas",
    };
    return names[tableName] || tableName;
  };

  const totalRecords = tableCounts?.reduce((sum, table) => sum + table.row_count, 0) || 0;

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Estado del Sistema</h1>
          <p className="text-slate-500 mt-1">
            Información técnica y estado de la infraestructura
          </p>
        </div>

        {/* Estado de la base de datos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Estado DB</p>
                  <div className="flex items-center gap-2 mt-2">
                    {dbStatus === "online" ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Badge className="bg-green-500">Online</Badge>
                      </>
                    ) : dbStatus === "offline" ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <Badge className="bg-red-500">Offline</Badge>
                      </>
                    ) : (
                      <>
                        <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />
                        <Badge className="bg-yellow-500">Verificando...</Badge>
                      </>
                    )}
                  </div>
                </div>
                <Database className="h-10 w-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Registros</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {totalRecords.toLocaleString()}
                  </p>
                </div>
                <HardDrive className="h-10 w-10 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Tablas Activas</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {tableCounts?.length || 0}
                  </p>
                </div>
                <TableIcon className="h-10 w-10 text-purple-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información de tablas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Estadísticas de Tablas</CardTitle>
            <CardDescription>
              Conteo de registros por tabla en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                <span className="ml-3 text-slate-500">Cargando estadísticas...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableCounts?.map((table) => (
                  <Card key={table.table_name} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">
                            {getTableDisplayName(table.table_name)}
                          </p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {table.row_count.toLocaleString()}
                          </p>
                        </div>
                        <TableIcon className="h-8 w-8 text-playtomic-orange/30" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información técnica del stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Stack Tecnológico</CardTitle>
            <CardDescription>
              Tecnologías utilizadas en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Server className="h-8 w-8 text-playtomic-orange" />
                <div>
                  <p className="font-semibold text-slate-800">Backend</p>
                  <p className="text-sm text-slate-600">Supabase</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-800">Database</p>
                  <p className="text-sm text-slate-600">PostgreSQL</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Activity className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-slate-800">Frontend</p>
                  <p className="text-sm text-slate-600">React + TypeScript</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold text-slate-800">Deploy</p>
                  <p className="text-sm text-slate-600">Vercel</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Información de la Plataforma</CardTitle>
            <CardDescription>
              Detalles sobre la versión y configuración actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Versión</span>
                <span className="text-slate-800">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Entorno</span>
                <Badge className="bg-green-500">Production</Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Región</span>
                <span className="text-slate-800">EU West</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-600">Última actualización</span>
                <span className="text-slate-800">{new Date().toLocaleDateString("es-ES")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota técnica */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Uso Técnico</p>
                <p>
                  Esta vista te permite monitorear el estado de tu infraestructura en tiempo real.
                  Ideal para presentaciones técnicas a inversores mostrando la robustez del stack
                  y la escalabilidad de la plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSystemPage;
