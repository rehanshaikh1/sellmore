import { TeamMember, UserRole } from '../types';

/**
 * Single source of truth for the Manager ↔ Sales Rep relationship.
 *
 *   TeamMember.managerId  (on a sales_rep)  →  id of that rep's one primary manager
 *
 * Everything else (a manager's team, who may see which meeting / deal / task)
 * is DERIVED from that one field. Nothing else stores an assignment.
 *
 * NOTE: this is client-side filtering for the prototype. It is not authorization.
 * A real backend must enforce the same rules on every query and mutation.
 */
export interface AccessContext {
  role: UserRole;
  userId: string;
  teamMembers: TeamMember[];
}

/** Sales reps whose primary manager is `managerId`. */
export const getAssignedReps = (teamMembers: TeamMember[], managerId: string): TeamMember[] =>
  teamMembers.filter(m => m.role === 'sales_rep' && m.managerId === managerId);

/** The manager a rep reports to, if any. */
export const getManagerOf = (teamMembers: TeamMember[], repId: string): TeamMember | undefined => {
  const rep = teamMembers.find(m => m.id === repId && m.role === 'sales_rep');
  if (!rep?.managerId) return undefined;
  return teamMembers.find(m => m.id === rep.managerId && m.role === 'manager');
};

/** Sales reps that have no manager yet. */
export const getUnassignedReps = (teamMembers: TeamMember[]): TeamMember[] =>
  teamMembers.filter(m => m.role === 'sales_rep' && !getManagerOf(teamMembers, m.id));

/**
 * Owner ids whose records this user may see.
 *   client_admin → 'all' (company-wide)
 *   manager      → their own id + the reps currently assigned to them
 *   sales_rep    → only themself
 *   super_admin  → none (platform role, no tenant records)
 */
export const getVisibleOwnerIds = ({ role, userId, teamMembers }: AccessContext): Set<string> | 'all' => {
  switch (role) {
    case 'client_admin':
      return 'all';
    case 'manager':
      return new Set([userId, ...getAssignedReps(teamMembers, userId).map(r => r.id)]);
    case 'sales_rep':
      return new Set([userId]);
    default:
      return new Set();
  }
};

export const canAccessOwner = (ctx: AccessContext, ownerId: string | undefined | null): boolean => {
  const visible = getVisibleOwnerIds(ctx);
  if (visible === 'all') return true;
  return !!ownerId && visible.has(String(ownerId));
};

export const scopeByOwner = <T,>(items: T[], ctx: AccessContext, getOwnerId: (item: T) => string | undefined | null): T[] => {
  const visible = getVisibleOwnerIds(ctx);
  if (visible === 'all') return items;
  return items.filter(item => {
    const owner = getOwnerId(item);
    return !!owner && visible.has(String(owner));
  });
};
