'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MdPersonAdd } from 'react-icons/md';
import FormInput from '@/app/components/ui/FormInput';
import FormButton from '@/app/components/ui/FormButton';
import StatusModal from '@/app/components/ui/StatusModal';

export default function CreateOfficerForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState([]);

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  // Fetch officers
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const res = await fetch('/api/users?role=officer');
        const data = await res.json();
        if (res.ok) {
          setOfficers(data.users || []);
        } else {
          console.error('Failed to fetch officers:', data.error);
        }
      } catch (err) {
        console.error('Error fetching officers:', err);
      }
    };
    fetchOfficers();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Create officer account
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showModal('error', 'Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'officer',
          verify: true,
          status: 'active',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        showModal('error', 'Creation Failed', data.error || 'Something went wrong. Please try again.');
        return;
      }

      showModal('success', 'Officer Created', `${formData.fullName}'s account has been created successfully.`);

      if (data.user) {
        setOfficers((prev) => [...prev, data.user]);
      } else {
        const refreshRes = await fetch('/api/users?role=officer');
        const updated = await refreshRes.json();
        setOfficers(updated.users || []);
      }

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setLoading(false);
      showModal('error', 'Network Error', err.message);
    }
  };

  // Disable or Re-enable officer
  const handleStatusChange = async (id, fullName, action) => {
    const label = action === 'disable' ? 'disable' : 're-enable';
    const confirm = window.confirm(
      `Are you sure you want to ${label} ${fullName}'s account?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/users/${id}/${action}`, { method: 'PUT' });
      const data = await res.json();

      if (!res.ok) {
        showModal('error', 'Action Failed', data.error || 'Unknown error');
        return;
      }

      showModal(
        'success',
        action === 'disable' ? 'Account Disabled' : 'Account Re-enabled',
        `${fullName}'s account has been ${action === 'disable' ? 'disabled' : 're-enabled'} successfully.`
      );

      setOfficers((prev) =>
        prev.map((o) =>
          o._id === id
            ? { ...o, status: data.user.status, verify: data.user.verify }
            : o
        )
      );
    } catch (err) {
      showModal('error', 'Error', err.message);
    }
  };

  return (
    <>
      {/* Status Modal */}
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      <div className="w-full max-w-lg mx-auto mt-6 md:mt-10 px-4">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">

          {/* Header */}
          <div className="bg-blue-900 dark:bg-blue-950 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <MdPersonAdd className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Create Officer Account
                </h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  Add a new sanitation officer to the system
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <FormInput
              id="fullName"
              name="fullName"
              label="Full Name"
              placeholder="e.g. Juan Dela Cruz"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <FormInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="officer@pasigsanitation.gov.ph"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <FormInput
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
            />

            <FormButton
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
              icon={<MdPersonAdd size={18} />}
            >
              {loading ? 'Creating Account...' : 'Create Officer'}
            </FormButton>
          </form>

          {/* Footer note */}
          <div className="px-6 pb-5">
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center leading-relaxed">
              The officer will be automatically verified and can log in immediately after creation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
