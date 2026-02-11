'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiBell } from 'react-icons/hi';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function DashboardForm() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const open = Boolean(anchorEl);

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    pending: 'Verifying',
    pending2: 'Compliance',
    pending3: 'Approval',
    completed: 'Approved',
  };

  useEffect(() => {
    const userId =
      sessionStorage.getItem('userId') ||
      localStorage.getItem('loggedUserId');
    const userRole =
      sessionStorage.getItem('userRole') ||
      localStorage.getItem('loggedUserRole');

    if (!userId || !userRole) {
      setError('No user session found.');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to fetch user');
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const userId =
      sessionStorage.getItem('userId') ||
      localStorage.getItem('loggedUserId');

    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/notifications`);
        const data = await res.json();

        if (res.ok) {
          const sorted = (data.notifications || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setNotifications(sorted);
        } else {
          console.error('Notification fetch error:', data.error);
        }
      } catch (err) {
        console.error('Notification fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotificationClick = (notif) => {
    handleMenuClose();

    if (notif.link) {
      router.push(notif.link);
      return;
    }

    if (!notif.status) return;

    const status = notif.status.toLowerCase();

    switch (status) {
      case 'pending':
      case 'pending2':
      case 'pending3':
        router.push('/businessaccount/pending');
        break;
      case 'completed':
        router.push('/businessaccount/completed');
        break;
      default:
        router.push('/businessaccount');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      } else {
        console.error('Delete failed:', data.error);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-2xl font-semibold dark:text-white">Welcome to Your Dashboard</h1>

        <div className="relative mr-4">
          <IconButton
            color="primary"
            onClick={handleBellClick}
            sx={{
              transform: 'scale(1.3)',
              '& .MuiBadge-badge': { top: 6, right: 6 },
            }}
            className="dark:text-blue-400"
          >
            <Badge badgeContent={notifications.length} color="error">
              <HiBell size={34} />
            </Badge>
          </IconButton>

          <Menu
            id="notification-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            PaperProps={{
              className: "dark:bg-slate-800 dark:text-slate-200",
              style: {
                width: 360,
                maxHeight: 420,
                padding: '0.5rem 0',
              },
            }}
          >
            {loading ? (
              <MenuItem className="dark:text-slate-200">
                <CircularProgress size={20} sx={{ mr: 2 }} /> Loading...
              </MenuItem>
            ) : notifications.length === 0 ? (
              <MenuItem className="dark:text-slate-200">No new notifications</MenuItem>
            ) : (
              notifications.map((notif, i) => (
                <MenuItem
                  key={i}
                  sx={{
                    whiteSpace: 'normal',
                    lineHeight: 1.5,
                    fontSize: '1rem',
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                     {notif.business?.businessName && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {notif.business.businessName}
                      </div>
                    )}


                    </div>

                    <strong className="block mb-1 text-gray-800 dark:text-gray-200">
                      {statusLabels[notif.status] || 'Notification'}
                    </strong>

                    <span className="text-gray-700 dark:text-gray-300">
                      {notif.message || 'New update available'}
                    </span>
                  </div>

                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNotification(notif._id)}
                    sx={{ ml: 1 }}
                    className="dark:text-gray-400 dark:hover:text-white"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))
            )}
          </Menu>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
    </div>
  );
}
