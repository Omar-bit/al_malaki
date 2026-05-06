import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/AdminLayout';
import { adminService } from '../../services';
import { useAuth } from '../../contexts';
import type { AdminTeamMember, TeamRole } from '../../types/admin';
import { validateEmailValue } from '../../utils/formValidation';
import { Logo } from '../../components';

const roleBadgeMap: Record<TeamRole, string> = {
  ADMIN: 'Super admin',
  VENDOR: 'Team member',
};

export function AdminManagementPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('ADMIN');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true);

      try {
        const members = await adminService.getAdminTeam();
        setTeamMembers(members);
        setSelectedMemberId((currentId) =>
          currentId && members.some((member) => member.id === currentId)
            ? currentId
            : (members[0]?.id ?? null),
        );
      } catch (error) {
        if (error instanceof Error && error.message) {
          toast.error(error.message);
        } else {
          toast.error('Unable to load admin team. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, []);

  const selectedMember = useMemo(
    () => teamMembers.find((member) => member.id === selectedMemberId) ?? null,
    [teamMembers, selectedMemberId],
  );

  const isSelectionProtected =
    !selectedMember || selectedMember.role === 'ADMIN';

  const handleInviteSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const emailValidation = validateEmailValue(inviteEmail, {
      required: 'Please enter an email address',
      invalid: 'Please enter a valid email address',
    });

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    setIsInviting(true);

    try {
      await adminService.createAdminInvitation({
        email: emailValidation.value,
        role: inviteRole,
      });

      toast.success('Invitation sent successfully.');
      setInviteEmail('');
      setInviteRole('ADMIN');
      setIsInviteOpen(false);
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('Unable to send invitation. Please try again.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <AdminLayout>
      <div className='min-h-full admin-management-container p-6 md:px-10'>
        <div className='mx-auto max-w-6xl'>
          <header className='text-center mb-5'>
            <Logo className='block mx-auto w-30!' />
            <h1 className='text-3xl md:text-4xl font-bona font-bold text-dark-red mt-2'>
              Admin management
            </h1>
            <p className='text-[#00000082] font-bold mt-2 font-bona'>
              Manage your admins, assign roles, and control access.
            </p>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='grid grid-cols-1 md:grid-cols-3 gap-6'
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className='rounded-[28px] border border-[#6a4c41]/40 bg-white/40 p-6 shadow-[0_16px_40px_rgba(60,12,12,0.16)] backdrop-blur'
                >
                  <div className='h-16 w-16 rounded-full bg-[#d7c1ab] mb-4' />
                  <div className='h-4 w-2/3 rounded-full bg-[#dbc6b2] mb-3' />
                  <div className='h-8 w-24 rounded-full bg-[#5b111a]' />
                </div>
              ))
            ) : teamMembers.length === 0 ? (
              <div className='col-span-full rounded-[28px] border border-[#6a4c41]/40 bg-white/55 p-6 text-center text-[#6d5a46] shadow-[0_16px_40px_rgba(60,12,12,0.16)] backdrop-blur'>
                No admins or vendors yet. Create a new invitation to get
                started.
              </div>
            ) : (
              teamMembers.map((member) => {
                const isSelected = member.id === selectedMemberId;
                const isOnline = member.id === user?.id;
                const displayName =
                  `${member.firstName} ${member.lastName}`.trim();

                return (
                  <button
                    key={member.id}
                    type='button'
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`text-left rounded-[28px] border-[1px] p-6 shadow-[0_16px_40px_rgba(60,12,12,0.16)] backdrop-blur transition-all ${
                      isSelected
                        ? 'border-dark-red border-2! bg-[#D9D9D92E]/50 '
                        : 'border-dark-red bg-[#D9D9D92E]/50 hover:-translate-y-1'
                    }`}
                  >
                    <div className='flex items-center justify-center mb-4'>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Admin')}&background=d5bd9d&color=3f060f`}
                        alt={displayName}
                        className='h-16 w-16 rounded-full border border-white/70 shadow-md'
                      />
                    </div>
                    <h3 className='text-xl capitalize font-bold tracking-wider text-white font-bona text-center'>
                      {displayName || 'Team member'}
                    </h3>
                    <div className='mt-3 flex items-center justify-center'>
                      <span className='rounded-full bg-[#5b111a] px-4 py-1 text-[12px] font-semibold uppercase tracking-wide text-white'>
                        {roleBadgeMap[member.role]}
                      </span>
                    </div>
                    <div className='mt-4 flex items-center justify-center gap-2 text-xs text-[#6d5a46]'>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOnline ? 'bg-[#3bb24a]' : 'bg-[#8b6a5c]'
                        }`}
                      />
                      <span className='text-white'>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='mt-8 rounded-[30px] border border-dark-red bg-[#D9D9D92E] p-6 shadow-[0_20px_50px_rgba(60,12,12,0.16)] backdrop-blur'
          >
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='text-xl font-bold text-[#F8E5C6] tracking-wide font-bona'>
                  Actions
                </h2>
                <p className='text-sm text-white mt-2'>
                  Block &amp; Delete are disabled for Super Admins.
                </p>
              </div>
              {selectedMember && (
                <div className='text-sm text-[#6d5a46]'>
                  Selected:{' '}
                  <span className='font-semibold'>
                    {selectedMember.firstName}
                  </span>
                </div>
              )}
            </div>

            <div className='mt-5 flex flex-wrap gap-3'>
              <button
                type='button'
                onClick={() => setIsInviteOpen((current) => !current)}
                className='rounded-lg bg-gold px-5 py-2 text-md font-bold text-white shadow-sm transition hover:bg-[#b99370]'
              >
                Create New Admin
              </button>
              <button
                type='button'
                disabled={isSelectionProtected}
                onClick={() =>
                  toast.success('Block admin flow will be available soon.')
                }
                className={`rounded-lg px-5 py-2 text-md font-bold shadow-sm transition bg-white text-black ${
                  isSelectionProtected
                    ? 'cursor-not-allowed '
                    : ' hover:bg-dark-red'
                }`}
              >
                Block Admin
              </button>
              <button
                type='button'
                disabled={isSelectionProtected}
                onClick={() =>
                  toast.success('Delete admin flow will be available soon.')
                }
                className={`rounded-lg px-5 py-2 text-md font-bold shadow-sm transition bg-dark-red text-white ${
                  isSelectionProtected ? 'cursor-not-allowed ' : ' '
                }`}
              >
                Delete Admin
              </button>
            </div>
            <p className='mt-3 text-xs text-[#D9D9D9]'>
              Select a Team Member admin to enable Block / Delete.
            </p>

            {isInviteOpen && (
              <form
                onSubmit={handleInviteSubmit}
                className='mt-6 grid gap-4 rounded-[22px] border border-[#6a4c41]/30 bg-white/60 p-4 md:grid-cols-[2fr_1fr_auto] md:items-end'
              >
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    Invitee email
                  </label>
                  <input
                    type='email'
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder='admin@almalaki.com'
                    className='w-full rounded-full border border-[#6a4c41]/40 bg-white/80 px-4 py-2 text-sm text-dark-red outline-none transition focus:border-dark-red'
                    required
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as TeamRole)
                    }
                    className='w-full rounded-full border border-[#6a4c41]/40 bg-white/80 px-4 py-2 text-sm text-dark-red outline-none transition focus:border-dark-red'
                  >
                    <option value='ADMIN'>Admin</option>
                    <option value='VENDOR'>Vendor (new)</option>
                  </select>
                </div>
                <button
                  type='submit'
                  disabled={isInviting}
                  className='rounded-full bg-dark-red px-6 py-2 text-sm font-semibold text-[#f6e7d1] shadow-sm transition hover:bg-[#2f050b] disabled:cursor-not-allowed disabled:opacity-70'
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
            )}
          </motion.section>
        </div>
      </div>
    </AdminLayout>
  );
}
