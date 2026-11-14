import { useMemo } from 'react';
import { useStore } from './useStore';
import {
  AccessContext,
  canAccessOwner,
  getAssignedReps,
  getVisibleOwnerIds,
  scopeByOwner
} from '../lib/access';

/** Role-aware access helpers for pages. Re-evaluates when assignments change. */
export const useAccess = () => {
  const currentRole = useStore(s => s.currentRole);
  const currentUser = useStore(s => s.currentUser);
  const teamMembers = useStore(s => s.teamMembers);

  return useMemo(() => {
    const ctx: AccessContext = { role: currentRole, userId: currentUser.id, teamMembers };
    return {
      ctx,
      assignedReps: currentRole === 'manager' ? getAssignedReps(teamMembers, currentUser.id) : [],
      visibleOwnerIds: getVisibleOwnerIds(ctx),
      canAccess: (ownerId?: string | null) => canAccessOwner(ctx, ownerId),
      scope: <T,>(items: T[], getOwnerId: (item: T) => string | undefined | null) => scopeByOwner(items, ctx, getOwnerId)
    };
  }, [currentRole, currentUser.id, teamMembers]);
};
