import { Navigate } from 'react-router-dom';
import { useGuardianChildren } from '@/hooks/useGuardianChildren';
import { Loader2 } from 'lucide-react';

interface GuardianRouterProps {
  hasChildrenDestination: string;
  noChildrenDestination: string;
}

/**
 * Router component for guardians that redirects based on whether they have children
 * - If they have children: redirect to hasChildrenDestination (usually /dashboard)
 * - If they don't have children: redirect to noChildrenDestination (usually /guardian)
 */
export const GuardianRouter = ({ hasChildrenDestination, noChildrenDestination }: GuardianRouterProps) => {
  const { children, isLoading } = useGuardianChildren();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const hasChildren = children && children.length > 0;

  if (hasChildren) {
    return <Navigate to={hasChildrenDestination} replace />;
  }

  return <Navigate to={noChildrenDestination} replace />;
};
