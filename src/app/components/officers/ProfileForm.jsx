'use client';
import { useState, useEffect } from 'react';

export default function ProfileForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('loggedUserId');
    if (userId) {
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setFormData((prev) => ({
              ...prev,
              fullName: data.user.fullName || '',
              email: data.user.email || '',
            }));
          }
        });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'newPassword') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    const lengthReq = password.length >= 8;
    const upperReq = /[A-Z]/.test(password);
    const lowerReq = /[a-z]/.test(password);
    const numReq = /[0-9]/.test(password);
    const specialReq = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passed = [lengthReq, upperReq, lowerReq, numReq, specialReq].filter(Boolean).length;

    if (password.length === 0) return setPasswordStrength('');
    if (passed <= 2) return setPasswordStrength('Weak');
    if (passed === 3 || passed === 4) return setPasswordStrength('Medium');
    if (passed === 5) return setPasswordStrength('Strong');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const userId = localStorage.getItem('loggedUserId');
    if (!userId) {
      setMessage('❌ No user found.');
      setLoading(false);
      return;
    }

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage('❌ Please fill in all password fields.');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('❌ New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('✅ Password updated successfully.');
        setShowPasswordForm(false);
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setMessage('❌ ' + (result.error || 'Failed to update password.'));
      }
    } catch (error) {
      setMessage('❌ Error updating password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 h-96  mx-auto p-6 bg-white dark:bg-slate-900 shadow rounded-lg border border-gray-200 dark:border-slate-700">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800 text-center dark:text-slate-200">Profile Settings</h1>

      <form className="space-y-4">
        {/* Full Name (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 cursor-not-allowed text-gray-700 dark:text-slate-300"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 cursor-not-allowed text-gray-700 dark:text-slate-300"
          />
        </div>

        <hr className="my-4 dark:border-slate-700" />

        {/* Change Password Button */}
        {!showPasswordForm && (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Change Password
          </button>
        )}

        {/* Change Password */}
        {showPasswordForm && (
          <div className="space-y-4 border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Change Password</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-200"
              />
              {passwordStrength && (
                <p
                  className={`text-sm mt-1 ${
                    passwordStrength === 'Weak'
                      ? 'text-red-500 dark:text-red-400'
                      : passwordStrength === 'Medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  Password Strength: {passwordStrength}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={handlePasswordUpdate}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setMessage('');
                  setPasswordStrength('');
                  setFormData((prev) => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  }));
                }}
                className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 py-2 rounded hover:bg-gray-400 dark:hover:bg-slate-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <p
            className={`text-center mt-3 text-sm ${
              message.includes('✅') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
