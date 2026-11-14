import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  MoreVertical,
  X,
  UserCheck,
  UserX
} from 'lucide-react';
import { getAssignedReps, getUnassignedReps } from '../../lib/access';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const TeamManagement: React.FC = () => {
  const { teamMembers, currentPlan, inviteTeamMember, toggleMemberStatus, resendInvite, assignManager } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'sales_rep'>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'sales_rep'>('sales_rep');
  const [inviteManagerId, setInviteManagerId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const managers = teamMembers.filter(m => m.role === 'manager');
  const assignableManagers = managers.filter(m => m.status === 'active');
  const unassignedReps = getUnassignedReps(teamMembers);

  const handleAssign = (repId: string, managerId: string) => {
    setAssignError('');
    const result = assignManager(repId, managerId || null);
    if (!result.success) setAssignError(result.error || 'Could not update the assignment.');
  };

  const seatLimit = currentPlan === 'free' ? 5 : 25;
  const activeCount = teamMembers.filter(m => m.status === 'active' || m.invitationStatus === 'pending').length;

  const filteredMembers = teamMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and Business Email are required.');
      return;
    }

    const result = inviteTeamMember(inviteName.trim(), inviteEmail.trim(), inviteRole, inviteRole === 'sales_rep' && inviteManagerId ? inviteManagerId : undefined);
    if (!result.success) {
      setInviteError(result.error || 'Failed to send invite.');
      if (result.error?.includes('Seat limit')) {
        setUpgradeModalOpen(true);
      }
      return;
    }

    setInviteSuccess(`Invitation sent to ${inviteEmail}. Link expires in 48 hours.`);
    setTimeout(() => {
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteManagerId('');
      setInviteSuccess('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>

        </div>

        <button
          onClick={() => {
            if (activeCount >= seatLimit) {
              setUpgradeModalOpen(true);
            } else {
              setIsInviteModalOpen(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Seat Allocation Meter Banner */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <span>Seat Allocation on {currentPlan.toUpperCase()} Plan</span>
            <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
              {activeCount} / {seatLimit} Seats Allocated
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeCount >= seatLimit ? (
              <span className="text-rose-600 font-medium">Seat limit reached. Upgrade plan to invite additional team members.</span>
            ) : (
              <span>{seatLimit - activeCount} seats remaining for Managers and Sales Representatives.</span>
            )}
          </div>
        </div>

        {activeCount >= seatLimit && (
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            Upgrade Plan for More Seats
          </button>
        )}
      </div>

      {assignError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {assignError}
        </div>
      )}
      {unassignedReps.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>{unassignedReps.length} sales representative{unassignedReps.length === 1 ? ' has' : 's have'} no manager:</strong>{' '}
            {unassignedReps.map(r => r.name).join(', ')}. Their meetings and deals are visible to you but not to any manager until you assign one below.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg self-stretch sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${roleFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Roles
          </button>
          <button
            onClick={() => setRoleFilter('manager')}
            className={`px-3 py-1.5 rounded-md transition-all ${roleFilter === 'manager' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Managers
          </button>
          <button
            onClick={() => setRoleFilter('sales_rep')}
            className={`px-3 py-1.5 rounded-md transition-all ${roleFilter === 'sales_rep' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Sales Reps
          </button>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Name & Title</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Business Email</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Role</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Manager / Team</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Account Status</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Invitation</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Date Joined</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 tracking-tight">{member.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">{member.role.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {member.email}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${member.role === 'manager' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      {member.role === 'manager' ? 'Sales Manager' : 'Sales Representative'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {member.role === 'sales_rep' ? (
                      <select
                        value={member.managerId ?? ''}
                        onChange={e => handleAssign(member.id, e.target.value)}
                        aria-label={`Manager for ${member.name}`}
                        className={`px-2 py-1.5 border rounded-lg text-[11px] bg-white ${member.managerId ? 'border-slate-300 text-slate-800' : 'border-amber-300 text-amber-800 bg-amber-50'}`}
                      >
                        <option value="">Unassigned</option>
                        {managers.map(m => (
                          <option key={m.id} value={m.id} disabled={m.status !== 'active' && m.id !== member.managerId}>
                            {m.name}{m.status !== 'active' ? ' (inactive)' : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-slate-600">
                        {getAssignedReps(teamMembers, member.id).length} assigned rep{getAssignedReps(teamMembers, member.id).length === 1 ? '' : 's'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {member.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {member.invitationStatus === 'accepted' ? (
                      <span className="text-slate-600 text-[11px] font-medium">Accepted</span>
                    ) : member.invitationStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-amber-200/80">
                        <Clock className="w-3 h-3 text-amber-600" /> 48h Pending
                      </span>
                    ) : (
                      <span className="text-rose-600 text-[11px] font-semibold">Expired</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {member.dateJoined}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.invitationStatus === 'pending' && (
                        <button
                          onClick={() => resendInvite(member.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Resend invitation email"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" /> Resend
                        </button>
                      )}

                      <button
                        onClick={() => toggleMemberStatus(member.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${member.status === 'active'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        title={member.status === 'active' ? 'Deactivate seat' : 'Reactivate seat'}
                      >
                        {member.status === 'active' ? (
                          <>
                            <UserX className="w-3 h-3" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" /> Reactivate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Invite Team Member</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Available seats: {seatLimit - activeCount} on {currentPlan.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
              {inviteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Anderson"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="liam.anderson@apexengineering.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Role Assignment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'manager' | 'sales_rep')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="sales_rep">Sales Representative (Personal deals & calls)</option>
                  <option value="manager">Sales Manager (Assigned team pipeline)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Role is strictly restricted to Manager or Sales Representative per PRD Section 7.3.
                </p>
              </div>

              {inviteRole === 'sales_rep' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reports to (Manager)</label>
                  <select
                    value={inviteManagerId}
                    onChange={e => setInviteManagerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Assign later (unassigned)</option>
                    {assignableManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Each representative has one primary manager. You can change it at any time.</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  The invitation link expires automatically after <strong>48 hours</strong>. The user will be prompted to set their password upon clicking.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-xs"
                >
                  Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Seat Limit Reached"
        featureDescription={`Your ${currentPlan.toUpperCase()} plan has reached its ${seatLimit}-seat allocation limit.`}
      />
    </div>
  );
};
