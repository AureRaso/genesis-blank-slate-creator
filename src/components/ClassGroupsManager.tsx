import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useClassGroups, useCreateClassGroup, useUpdateClassGroup, useDeleteClassGroup, useAddGroupMember, useRemoveGroupMember, type CreateClassGroupData, type ClassGroupWithMembers } from "@/hooks/useClassGroups";
import { useStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useMyTrainerProfile } from "@/hooks/useTrainers";

const CLASS_LEVELS = [
  { value: "principiante", label: "Principiante" },
  { value: "basico", label: "Básico" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
  { value: "experto", label: "Experto" }
];

interface ClassGroupFormProps {
  group?: ClassGroupWithMembers;
  onClose: () => void;
  clubId: string;
}

const ClassGroupForm = ({ group, onClose, clubId }: ClassGroupFormProps) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    group?.members.map(m => m.student_enrollment_id) || []
  );
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateClassGroupData>();
  const { toast } = useToast();
  const { data: students } = useStudentEnrollments();
  const createMutation = useCreateClassGroup();
  const updateMutation = useUpdateClassGroup();
  const addMemberMutation = useAddGroupMember();

  const availableStudents = students?.filter(s => s.status === 'active') || [];

  const onSubmit = async (data: CreateClassGroupData) => {
    try {
      if (group) {
        await updateMutation.mutateAsync({ id: group.id, data });
      } else {
        // Create group and add selected students
        const newGroup = await createMutation.mutateAsync({ ...data, club_id: clubId });
        
        // Add selected students to the group
        if (selectedStudents.length > 0) {
          for (const studentId of selectedStudents) {
            await addMemberMutation.mutateAsync({
              group_id: newGroup.id,
              student_enrollment_id: studentId
            });
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Grupo</Label>
        <Input
          id="name"
          {...register("name", { required: "El nombre es obligatorio" })}
          defaultValue={group?.name}
          placeholder="Ej: Grupo Intermedio Lunes"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="level">Nivel</Label>
        <Select onValueChange={(value) => setValue("level", value as any)} defaultValue={group?.level}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el nivel" />
          </SelectTrigger>
          <SelectContent>
            {CLASS_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          defaultValue={group?.description || ""}
          placeholder="Descripción del grupo..."
        />
      </div>

      {!group && (
        <div>
          <Label>Seleccionar Estudiantes</Label>
          <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
            {availableStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay estudiantes disponibles</p>
            ) : (
              availableStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`student-${student.id}`}
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="rounded border-gray-300"
                  />
                  <Label 
                    htmlFor={`student-${student.id}`} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {student.full_name} (Nivel {student.level})
                  </Label>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Seleccionados: {selectedStudents.length} estudiantes
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending || (!group && selectedStudents.length === 0)}
          className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
        >
          {group ? "Actualizar" : "Crear"} Grupo
        </Button>
      </div>
    </form>
  );
};

interface ManageGroupMembersProps {
  group: ClassGroupWithMembers;
  onClose: () => void;
}

const ManageGroupMembers = ({ group, onClose }: ManageGroupMembersProps) => {
  const { data: students } = useStudentEnrollments();
  const addMemberMutation = useAddGroupMember();
  const removeMemberMutation = useRemoveGroupMember();

  const currentMemberIds = group.members.map(m => m.student_enrollment_id);
  const availableStudents = students?.filter(s => 
    !currentMemberIds.includes(s.id) && s.status === 'active'
  ) || [];

  const handleAddMember = async (studentId: string) => {
    await addMemberMutation.mutateAsync({
      group_id: group.id,
      student_enrollment_id: studentId
    });
  };

  const handleRemoveMember = async (studentId: string) => {
    await removeMemberMutation.mutateAsync({
      groupId: group.id,
      studentId: studentId
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-3">Miembros Actuales ({group.members.length})</h3>
        {group.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay miembros en este grupo</p>
        ) : (
          <div className="space-y-2">
            {group.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="font-medium">{member.student_enrollment.full_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Nivel {member.student_enrollment.level})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.student_enrollment_id)}
                  disabled={removeMemberMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Estudiantes Disponibles</h3>
        {availableStudents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay estudiantes disponibles para agregar</p>
        ) : (
          <div className="space-y-2">
            {availableStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 bg-background border rounded">
                <div>
                  <span className="font-medium">{student.full_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Nivel {student.level})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddMember(student.id)}
                  disabled={addMemberMutation.isPending}
                  className="text-green-600 hover:text-green-700"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
};

export const ClassGroupsManager = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClassGroupWithMembers | undefined>();
  const [managingMembers, setManagingMembers] = useState<ClassGroupWithMembers | undefined>();
  
  const { data: trainerProfile } = useMyTrainerProfile();
  const clubId = trainerProfile?.trainer_clubs?.[0]?.club_id;
  
  const { data: groups, isLoading } = useClassGroups(clubId);
  const deleteMutation = useDeleteClassGroup();

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
      await deleteMutation.mutateAsync(groupId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
            <span className="ml-2 text-muted-foreground">Cargando grupos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Grupos de Alumnos</h2>
          <p className="text-muted-foreground">Organiza tus alumnos en grupos para facilitar la gestión de clases</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Grupo</DialogTitle>
            </DialogHeader>
            {clubId && (
              <ClassGroupForm 
                onClose={() => setShowCreateDialog(false)} 
                clubId={clubId}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {!groups || groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No tienes grupos creados</h3>
            <p className="text-muted-foreground mb-6">
              Crea grupos para organizar mejor tus alumnos y facilitar la asignación a clases
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>
                      {group.description || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setManagingMembers(group)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {group.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {group.members.length} miembros
                  </span>
                </div>

                {group.members.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Miembros:</div>
                    {group.members.slice(0, 3).map((member, index) => (
                      <div key={member.id}>
                        {member.student_enrollment.full_name}
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <div className="text-xs">
                        y {group.members.length - 3} más...
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          {editingGroup && clubId && (
            <ClassGroupForm 
              group={editingGroup}
              onClose={() => setEditingGroup(undefined)} 
              clubId={clubId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={!!managingMembers} onOpenChange={() => setManagingMembers(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Miembros - {managingMembers?.name}</DialogTitle>
          </DialogHeader>
          {managingMembers && (
            <ManageGroupMembers 
              group={managingMembers}
              onClose={() => setManagingMembers(undefined)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassGroupsManager;