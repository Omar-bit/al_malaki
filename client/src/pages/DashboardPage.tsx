import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Camera, Loader2, Gift, Percent, Sparkles, Truck } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { POINTS_REDEMPTION_RATE, REWARD_UNLOCK_POINTS } from '../constants';
import { avatarUrl } from '../utils/url';
import {
  getRewardClaimedKey,
  getRewardPeriodKey,
  getWeeklyReward,
  type RewardCard,
} from '../utils/rewards';
import { authService, contactService, orderService } from '../services';

import { Hero } from '../components';
import Button from '../components/ui/Button';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatBirthDate(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0]; // YYYY-MM-DD for <input type="date">
}

function maskMatricule(id: string | undefined): string {
  if (!id) return '••••••';
  return '••••••';
}

// ─── Reward Modal ─────────────────────────────────────────────────────────────

function RewardModal({
  cards,
  onClose,
}: {
  cards: RewardCard[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const renderCard = (card: RewardCard, index: number) => {
    switch (card.type) {
      case 'cash':
        return (
          <div
            key={index}
            className='flex items-center gap-3 rounded-xl bg-[#EFE0C9]/22 px-4 py-3 border border-[#EFE0C9]'
          >
            <Sparkles className='w-8 h-8 shrink-0 text-[#EFE0C9]' />
            <div>
              <p className='font-bona text-base font-bold text-[#EFE0C9]'>
                {t('reward.cash_title')}
              </p>
              <p className='font-bona text-sm text-[#EFE0C9]'>
                {t('reward.cash_received', { amount: card.cashAmount })}
              </p>
            </div>
          </div>
        );
      case 'promo':
        return (
          <div
            key={index}
            className='flex items-center gap-3 rounded-xl bg-[#EFE0C9]/22 px-4 py-3 border border-[#EFE0C9]'
          >
            <Percent className='w-8 h-8 shrink-0 text-[#EFE0C9]' />
            <div className='flex-1 min-w-0'>
              <p className='font-bona text-base font-bold text-[#EFE0C9]'>
                {t('reward.promo_title')}{' '}
                <span className='font-abee text-sm text-[#EFE0C9]'>
                  −{card.promoPercent}%
                </span>
              </p>
              <p className='font-bona text-sm text-[#EFE0C9]'>
                {t('reward.promo_subtitle')}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(card.promoCode ?? '').catch(() => {});
                toast.success(t('reward.promo_copied_toast'));
              }}
              className='shrink-0 rounded-md bg-[#EFE0C9]/68 px-4 py-2 font-bona text-sm font-semibold text-[#3f060f] hover:bg-[#eedcca] transition-colors'
            >
              {card.promoCode}
            </button>
          </div>
        );
      case 'gift':
        return (
          <div
            key={index}
            className='flex items-center gap-3 rounded-xl bg-[#EFE0C9]/22 px-4 py-3 border border-[#EFE0C9]'
          >
            <Gift className='w-8 h-8 shrink-0 text-[#EFE0C9]' />
            <div>
              <p className='font-bona text-base font-bold text-[#EFE0C9]'>
                {t('reward.gift_title')}
              </p>
              <p className='font-bona text-sm text-[#EFE0C9]'>
                {t('reward.gift_subtitle')}
              </p>
            </div>
          </div>
        );
      case 'freeShipping':
        return (
          <div
            key={index}
            className='flex items-center gap-3 rounded-xl bg-[#EFE0C9]/22 px-4 py-3 border border-[#EFE0C9]'
          >
            <Truck className='w-8 h-8 shrink-0 text-[#EFE0C9]' />
            <div>
              <p className='font-bona text-base font-bold text-[#EFE0C9]'>
                {t('reward.free_shipping_title')}
              </p>
              <p className='font-bona text-sm text-[#EFE0C9]'>
                {t('reward.free_shipping_subtitle')}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className='fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/52 px-4'
      role='dialog'
      aria-modal='true'
      aria-label={t('reward.banner_title')}
    >
      <div className='relative w-full max-w-[55%] rounded-4xl bg-dark-red shadow-2xl overflow-hidden px-3'>
        {/* Close */}
        <button
          onClick={onClose}
          className='absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-xl font-light leading-none transition-colors'
          aria-label={t('reward.close')}
        >
          ✕
        </button>

        {/* Header */}
        <div className='flex flex-col items-center pt-8 pb-4 px-6'>
          {/* Gift icon */}
          <div className='w-20 h-20 rounded-full bg-[#EFE0C9] flex items-center justify-center mb-8'>
            <Gift className='w-9 h-9 text-[#461218]' />
          </div>
          <h2 className='text-center font-bona text-[18px] font-bold text-[#EFE0C9] leading-tight'>
            {t('reward.modal_title')}
          </h2>
          <p className='text-center font-bona text-[12px] text-[#EFE0C9] mt-4'>
            {t('reward.modal_subtitle')}
          </p>
        </div>

        {/* Rewards */}
        <div className='px-5 pb-2 space-y-4'>{cards.map(renderCard)}</div>

        {/* CTA */}
        <div className='px-5 py-4 mb-8'>
          <button
            onClick={onClose}
            className='w-full rounded-2xl bg-[#EFE0C9] py-2 font-bona text-base   text-dark-red hover:bg-[#5a0b18] transition-colors'
          >
            {t('reward.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { t } = useTranslation();
  const { user, isLoading, setUser } = useAuth();
  const navigate = useNavigate();
  useRequireAuth();

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Personal info form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    birthDate: '',
  });

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const loyaltyMax = 500;
  const loyaltyDT = (loyaltyPoints * POINTS_REDEMPTION_RATE).toFixed(2);

  const rewardUnlocked = loyaltyPoints >= REWARD_UNLOCK_POINTS;
  const rewardPeriodKey = useMemo(() => getRewardPeriodKey(), []);
  const rewardCards = useMemo(
    () => (user ? getWeeklyReward(user.id, rewardPeriodKey) : []),
    [user, rewardPeriodKey],
  );

  // Populate form from user
  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email ?? '',
      birthDate: formatBirthDate(user.birthDate),
    });
    orderService.getMyLoyalty().then((data) => setLoyaltyPoints(data.points)).catch(() => null);
  }, [user]);

  // Track whether this week's reward has already been claimed
  useEffect(() => {
    if (!user) return;
    const key = getRewardClaimedKey(user.id, rewardPeriodKey);
    setHasClaimedReward(!!localStorage.getItem(key));
  }, [user, rewardPeriodKey]);

  const handleOpenReward = () => {
    if (!rewardUnlocked) {
      toast(
        t('reward.locked_toast', {
          count: REWARD_UNLOCK_POINTS - loyaltyPoints,
        }),
      );
      return;
    }
    if (user) {
      localStorage.setItem(getRewardClaimedKey(user.id, rewardPeriodKey), 'true');
      setHasClaimedReward(true);
    }
    setShowRewardModal(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast.error(t('dashboard.fullname_required_toast'));
      return;
    }
    const parts = profileForm.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || '';

    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        firstName,
        lastName: lastName || undefined,
        birthDate: profileForm.birthDate || undefined,
      });
      setUser(updated);
      toast.success(t('dashboard.save_success_toast'));
    } catch {
      toast.error(t('dashboard.save_error_toast'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { url } = await authService.uploadProfilePicture(file);
      const updated = await authService.updateProfile({ profilePicture: url });
      setUser(updated);
      toast.success(t('dashboard.avatar_success_toast'));
    } catch {
      toast.error(t('dashboard.avatar_error_toast'));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || !user) {
      toast.error(t('dashboard.message_required_toast'));
      return;
    }
    setIsSendingMsg(true);
    try {
      await contactService.createContactMessage({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email,
        phoneNumber: user.phoneNumber ?? '',
        message: contactMessage,
      });
      toast.success(t('dashboard.message_success_toast'));
      setContactMessage('');
    } catch {
      toast.error(t('dashboard.message_error_toast'));
    } finally {
      setIsSendingMsg(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-cream flex items-center justify-center'>
        <div className='w-8 h-8 rounded-full border-2 border-[#3f060f] border-t-transparent animate-spin' />
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    t('dashboard.default_user');
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const rewardBannerTitle = t('reward.banner_title');
  const rewardBannerHeadline = rewardUnlocked
    ? t('reward.banner_unlocked')
    : t('reward.banner_locked');
  const rewardBannerSub = !rewardUnlocked
    ? t('reward.banner_locked_sub', {
        count: REWARD_UNLOCK_POINTS - loyaltyPoints,
      })
    : hasClaimedReward
      ? t('reward.banner_claimed_sub')
      : t('reward.banner_unlocked_sub');

  return (
    <div className='min-h-screen bg-[#fdf8f0]'>
      <Header withBackground={false} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Hero variant='client-dashboard' />

      {/* ── Two-column section ─────────────────────────────────────────────── */}
      <main className='mx-auto  px-4 py-8 lg:p-12   space-y-6 bg-[#fff9f1]'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-15 items-start'>
          {/* ── Essentiels panel ──────────────────────────────────────────── */}
          <section
            id='essentiels'
            className='rounded-4xl border border-dark-red  shadow-sm px-6 py-6'
          >
            <h2 className='font-bona text-2xl font-bold text-black mb-5'>
              {t('dashboard.essentials')}
            </h2>

            {/* Divider */}
            <hr className='border-[#ede0cc] mb-5' />
            {/* Order history */}
            <div className='mb-5 '>
              <p className='font-bona text-cl font-semibold text-black'>
                {t('dashboard.order_history')}
              </p>
              <p className='font-bona text-base text-[#918C8C] mt-0.5'>
                {t('dashboard.no_orders')}
              </p>
            </div>

            {/* Divider */}
            <hr className='border-[#ede0cc] mb-5' />

            {/* Order tracking */}
            <div className='mb-5'>
              <p className='font-bona text-cl font-semibold text-black'>
                {t('dashboard.order_tracking')}
              </p>
              <p className='font-bona text-base text-[#918C8C] mt-0.5'>
                {t('dashboard.no_tracking')}
              </p>
            </div>

            {/* Divider */}
            <hr className='border-[#ede0cc] mb-5' />

            {/* Personal info */}
            <div>
              <p className='font-bona text-base font-semibold text-black mb-4'>
                {t('dashboard.personal_info')}
              </p>

              {/* Avatar */}
              <div className='flex justify-center mb-5'>
                <div className='relative'>
                  <img
                    src={avatarUrl(
                      user.profilePicture,
                      user.firstName,
                      user.lastName,
                    )}
                    alt={t('dashboard.profile_picture_alt')}
                    className='w-20 h-20 rounded-full object-cover border-2 border-dark-red'
                  />
                  <button
                    type='button'
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-dark-red text-white flex items-center justify-center shadow hover:bg-dark-red/80 transition disabled:opacity-60'
                    aria-label={t('dashboard.change_photo')}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />
                    ) : (
                      <Camera className='w-3.5 h-3.5' />
                    )}
                  </button>
                  <input
                    ref={avatarFileRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className='space-y-3'>
                {/* Full name */}
                <div>
                  <label
                    htmlFor='dashboard-fullname'
                    className='block font-bona text-[13px] text-[#3f060f] mb-1'
                  >
                    {t('dashboard.full_name')}
                  </label>
                  <div className='relative'>
                    <input
                      id='dashboard-fullname'
                      type='text'
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm((f) => ({
                          ...f,
                          fullName: e.target.value,
                        }))
                      }
                      className='w-full rounded-lg border border-[#d4bfa8] bg-[#fdf8f0] px-3 py-2 font-bona text-[13px] text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-[#b09080]'>
                      ˅
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor='dashboard-email'
                    className='block font-bona text-[13px] text-[#3f060f] mb-1'
                  >
                    {t('dashboard.email')}
                  </label>
                  <div className='relative'>
                    <input
                      id='dashboard-email'
                      type='email'
                      value={profileForm.email}
                      readOnly
                      className='w-full rounded-lg border border-[#d4bfa8] bg-[#f0e8dc] px-3 py-2 font-bona text-[13px] text-[#3f060f] outline-none cursor-not-allowed opacity-70'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-[#b09080]'>
                      ˅
                    </span>
                  </div>
                </div>

                {/* Change password */}
                <div>
                  <label
                    htmlFor='dashboard-password'
                    className='block font-bona text-[13px] text-[#3f060f] mb-1'
                  >
                    {t('dashboard.change_password')}
                  </label>
                  <div className='relative'>
                    <input
                      id='dashboard-password'
                      type='password'
                      placeholder='••••••••'
                      className='w-full rounded-lg border border-[#d4bfa8] bg-[#fdf8f0] px-3 py-2 font-bona text-[13px] text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-[#b09080]'>
                      ˅
                    </span>
                  </div>
                </div>

                {/* Birth date */}
                <div>
                  <label
                    htmlFor='dashboard-birthdate'
                    className='block font-(--font-abee) text-[13px] text-[#3f060f] mb-1'
                  >
                    {t('dashboard.birth_date')}
                  </label>
                  <div className='relative'>
                    <input
                      id='dashboard-birthdate'
                      type='date'
                      value={profileForm.birthDate}
                      onChange={(e) =>
                        setProfileForm((f) => ({
                          ...f,
                          birthDate: e.target.value,
                        }))
                      }
                      className='w-full rounded-lg border border-[#d4bfa8] bg-[#fdf8f0] px-3 py-2 font-(--font-abee) text-[13px] text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-[#b09080] pointer-events-none'>
                      ˅
                    </span>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className='mt-5 flex justify-center'>
                <Button
                  // id='dashboard-save-btn'
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  classNames='text-dark-red! text-lg px-17 rounded-4xl! transition-colors disabled:opacity-60'
                >
                  {isSaving ? t('dashboard.saving') : t('dashboard.save')}
                </Button>
              </div>
            </div>
          </section>

          {/* ── Point de fidélité panel ────────────────────────────────────── */}
          <aside
            id='loyalty-card'
            className='h-full  bg-dark-red shadow-lg px-6 py-6 text-white rounded-4xl space-y-5'
          >
            <h3 className='font-bona text-2xl font-bold text-left pl-2 mb-1'>
              {t('dashboard.loyalty_title')}
            </h3>
            <hr className='border-[#8F8B8B] my-5' />

            <div className='text-center mb-5'>
              <p className='font-bona text-xl text-white'>{displayName}</p>
              <p className='font-bona text-xl text-white'>
                {t('dashboard.matricule')}&nbsp;: {maskMatricule(user.id)}
              </p>
            </div>

            {/* Points balance */}
            <div className='w-[80%] mx-auto rounded-3xl bg-[#FEF7ED] px-4 py-3 mb-3'>
              <p className='font-bona text-base  tracking-widest text-black uppercase mb-1'>
                {t('dashboard.points_balance')}
              </p>
              <p className='font-badoni text-lg font-bold  tracking-widest text-black uppercase mb-1  '>
                {loyaltyPoints}
              </p>
              <p className='font-abhaya text-sm font-semibold  tracking-widest text-black uppercase mb-1  '>
                /{loyaltyMax}
              </p>
            </div>

            {/* DT equivalent */}
            <div className='w-[80%] mx-auto rounded-3xl bg-[#FEF7ED] px-4 py-3 mb-3'>
              <p className='font-bona text-base  tracking-widest text-black uppercase mb-1'>
                {t('dashboard.dt_equivalent')}
              </p>
              <p className='font-badoni text-lg font-bold  tracking-widest text-black uppercase mb-1  '>
                {loyaltyDT}
              </p>
              <p className='font-abhaya text-sm font-semibold  tracking-widest text-black uppercase mb-1  '>
                DT
              </p>
            </div>

            {/* Fine print */}
            <ul className='space-y-1 list-disc mt-5 mx-auto block w-[80%] mr-0'>
              <li className='font-bona text-base text-white leading-snug  tracking-wider'>
                {t('dashboard.points_cap_note', { max: loyaltyMax })}
              </li>
              <li className='font-bona text-base text-white leading-snug  tracking-wider'>
                {t('dashboard.points_earn_note')}
              </li>
            </ul>
          </aside>
        </div>

        {/* ── Récompense surprise banner ─────────────────────────────────────── */}
        <button
          id='reward-banner'
          onClick={handleOpenReward}
          className='w-full flex items-center gap-4 rounded-3xl bg-dark-red px-5 py-4 text-left hover:bg-[#5a0b18] transition-colors shadow-sm group my-7'
        >
          {/* Gift icon */}
          <div className='shrink-0 w-10 h-10 rounded-full bg-[#EFE0C9] group-hover:bg-[#6e1020] flex items-center justify-center transition-colors'>
            <Gift
              className={`w-5 h-5 ${rewardUnlocked ? 'text-[#461218]' : 'text-[#461218]/50'}`}
            />
          </div>
          <div>
            <p className='font-bona text-base font-bold text-[#EFE0C9]'>
              {rewardBannerTitle}
            </p>
            <p className='font-bona text-base font-bold text-[#EFE0C9]'>
              {rewardBannerHeadline}
            </p>
            <p className='font-bona text-base text-[#EFE0C9] mt-0.5'>
              {rewardBannerSub}
            </p>
          </div>
        </button>

        {/* ── Contactez-nous ─────────────────────────────────────────────────── */}
        <section
          id='contact-section'
          className='w-[85%] mx-auto rounded-4xl border border-dark-red  shadow-sm px-6 py-5'
        >
          <h3 className='font-bona text-2xl font-bold text-[#3f060f] text-center mb-4'>
            {t('dashboard.contact_title')}
          </h3>

          <form onSubmit={handleSendMessage} className='space-y-3'>
            <textarea
              id='contact-message'
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
              placeholder={t('dashboard.contact_placeholder')}
              className='w-full rounded-xl border border-dark-red bg-[#fdf8f0] px-4 py-3 font-bona text-[15px] text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition resize-none'
            />
            <p className='font-bona text-base text-[#000000]/68 text-center'>
              {t('dashboard.contact_hint')}
            </p>
            <div className='flex justify-center'>
              <button
                id='contact-send-btn'
                type='submit'
                disabled={isSendingMsg}
                className='rounded-2xl mt-2 bg-dark-red px-12 py-3 font-bona text-[15px] font-semibold text-[#fdf8f0] hover:bg-[#5a0b18] transition-colors disabled:opacity-60'
              >
                {isSendingMsg ? t('dashboard.sending') : t('dashboard.send')}
              </button>
            </div>
          </form>
        </section>
      </main>
      <button
        onClick={handleLogout}
        className='flex items-center gap-3 px-3 py-2 w-full text-2xl text-center! justify-center text-[#6D5A46] hover:bg-[#D5BD9D] hover:text-dark-red rounded-xl transition-all duration-200'
      >
        {t('dashboard.logout')}
      </button>
      {/* ── Footer spacer ──────────────────────────────────────────────────── */}
      <div className='h-12' />

      {/* ── Reward Modal ───────────────────────────────────────────────────── */}
      {showRewardModal && (
        <RewardModal
          cards={rewardCards}
          onClose={() => setShowRewardModal(false)}
        />
      )}
    </div>
  );
}
