'use client';

import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@mui/material';
import {
  MdDashboard,
  MdBusiness,
  MdAssignment,
  MdPendingActions,
  MdCheckCircle,
  MdHelp,
  MdLogout,
  MdPerson,
  MdWork,
  MdAddCircle,
  MdLock,
  MdBadge,
  MdChevronLeft,
  MdChevronRight,
  MdCloudUpload,
  MdExpandMore,
  MdExpandLess,
  MdList,
  MdAdd,
  MdDescription,
  MdSearch,
  MdPersonAdd,
  MdFactCheck,
  MdRule,
  MdSend,
  MdMenu,
  MdClose,
} from 'react-icons/md';
import StatusModal from '@/app/components/ui/StatusModal';

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Sidebar() {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width:1023.95px)');
  const [userId, setUserId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [message, setMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [modal, setModal] = useState({
    open: false,
    type: 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    const storedId = localStorage.getItem('loggedUserId');
    const storedCollapsed = localStorage.getItem('sidebarCollapsed');

    if (storedId) setUserId(storedId);
    if (storedCollapsed) setIsCollapsed(JSON.parse(storedCollapsed));
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, isMobileOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
      return;
    }

    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(nextCollapsed));
  };

  const closeMobileSidebar = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  const isExpanded = isMobile ? true : !isCollapsed;

  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  useEffect(() => {
    if (user?.profilePicture) setPreview(user.profilePicture);
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage('Invalid file type. Please upload a JPG, PNG, or similar image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setIsUploadingNewImage(true);
      setMessage('Preview ready. Confirm to save or cancel to discard.');
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = async () => {
    setUploading(true);
    setMessage('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, imageData: preview }),
      });

      const result = await res.json();
      setUploading(false);

      if (result.success) {
        setMessage('Profile picture updated successfully.');
        localStorage.setItem('profilePicture', preview);
        mutate(`/api/users/${userId}`);
        setIsUploadingNewImage(false);
        window.location.reload();
      } else {
        setMessage(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploading(false);
      setMessage(`Upload error: ${error.message}`);
    }
  };

  const cancelUpload = () => {
    setPreview(user?.profilePicture || null);
    setIsUploadingNewImage(false);
    setMessage('Upload canceled.');
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const showModal = (type, title, modalMessage) => {
    setModal({ open: true, type, title, message: modalMessage });
  };

  const notifyModal = (modalMessage) => {
    const text = String(modalMessage).replace(/^[^A-Za-z0-9]+/, '');
    showModal('error', 'Logout Failed', text);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('loggedUserId');
      localStorage.removeItem('loggedUserRole');
      localStorage.removeItem('profilePicture');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      notifyModal('Logout failed. Please try again.');
    }
  };

  const role = user?.role;
  let displayName = 'User';
  let displayRole = 'User';

  if (role === 'business') {
    displayName = user?.businessNickname || user?.name || 'Business Owner';
    displayRole = 'Business Account';
  } else if (role === 'officer') {
    displayName = user?.fullName || user?.name || 'Officer';
    displayRole = 'Sanitation Officer';
  } else if (role === 'admin') {
    displayName = user?.fullName || user?.name || 'Admin';
    displayRole = 'Administrator';
  }

  const roleConfigs = {
    admin: {
      base: '/admin',
      items: [
        { label: 'Dashboard', path: '' },
        {
          label: 'Officers',
          path: '/createofficer',
          submenu: [
            { label: 'Officers List', path: '/officers', icon: 'list' },
            {
              label: 'Create Officer Account',
              path: '/createofficer',
              icon: 'createofficer',
            },
          ],
        },
        { label: 'Businesses', path: '/businesses' },
        { label: 'Inspections', path: '/inspections' },
        { label: 'Pending Request', path: '/pending' },
        { label: 'Completed Request', path: '/completed' },
        { label: 'MSR Requirements', path: '/msr-requirements' },
      ],
    },
    officer: {
      base: '/officers',
      items: [
        { label: 'Dashboard', path: '' },
        {
          label: 'Workbench',
          path: '/workbench',
          submenu: [
            { label: 'Online Request', path: '/workbench/onlinerequest', icon: 'list' },
            { label: 'Verifications', path: '/workbench/verifications', icon: 'verification' },
            { label: 'Compliance', path: '/workbench/compliance', icon: 'compliance' },
            { label: 'Permit Approval', path: '/workbench/permitapproval', icon: 'approval' },
            { label: 'Release', path: '/workbench/release', icon: 'release' },
          ],
        },
        {
          label: 'Inspections',
          path: '/inspections',
          submenu: [
            { label: 'Inspect Business', path: '/inspections/createticketinspection', icon: 'add' },
            { label: 'Pending Inspection', path: '/inspections/pendinginspections', icon: 'list' },
          ],
        },
        { label: 'Businesses', path: '/businesses' },
        { label: 'Profile Settings', path: '/profile' },
      ],
    },
    business: {
      base: '/businessaccount',
      items: [
        { label: 'Dashboard', path: '' },
        {
          label: 'Businesses',
          path: '/businesses',
          submenu: [
            { label: 'My Business List', path: '/businesses/businesslist', icon: 'list' },
            { label: 'Add a Business', path: '/businesses/addbusiness', icon: 'add' },
          ],
        },
        {
          label: 'Make a Request',
          path: '/request',
          submenu: [
            { label: 'New Sanitation Permit Request', path: '/request/newbusiness', icon: 'newrequest' },
            { label: 'Draft Requests', path: '/request/draftrequests', icon: 'draftrequest' },
            { label: 'Check Your Request', path: '/request/requestsent', icon: 'checkrequest' },
          ],
        },
        { label: 'Completed Request', path: '/completed' },
        { label: 'Change Password', path: '/changepassword' },
      ],
    },
  };

  const navItems = [];
  if (role && roleConfigs[role]) {
    const config = roleConfigs[role];
    config.items.forEach((item) => {
      navItems.push({
        ...item,
        path: config.base + item.path,
        submenu: item.submenu?.map((sub) => ({
          ...sub,
          path: config.base + sub.path,
        })),
      });
    });
    navItems.push({ label: 'Help', path: `${config.base}/help` });
    navItems.push({ label: 'Logout', action: 'logout' });
  }

  const getIcon = (label, iconType) => {
    const subIcons = {
      list: <MdList size={20} />,
      add: <MdAdd size={20} />,
      newrequest: <MdDescription size={20} />,
      draftrequest: <MdDescription size={20} />,
      checkrequest: <MdSearch size={20} />,
      createofficer: <MdPersonAdd size={20} />,
      verification: <MdFactCheck size={20} />,
      compliance: <MdRule size={20} />,
      approval: <MdCheckCircle size={20} />,
      release: <MdSend size={20} />,
    };

    if (subIcons[iconType]) return subIcons[iconType];

    const mainIcons = {
      Dashboard: <MdDashboard size={24} />,
      Officers: <MdBadge size={24} />,
      Businesses: <MdBusiness size={24} />,
      Inspections: <MdAssignment size={24} />,
      'Pending Request': <MdPendingActions size={24} />,
      'Completed Request': <MdCheckCircle size={24} />,
      Help: <MdHelp size={24} />,
      Logout: <MdLogout size={24} />,
      'Make a Request': <MdAddCircle size={24} />,
      'Change Password': <MdLock size={24} />,
      'Profile Settings': <MdPerson size={24} />,
      Workbench: <MdWork size={24} />,
      'MSR Requirements': <MdAssignment size={24} />,
    };

    return mainIcons[label] || <MdDashboard size={24} />;
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenu((current) => (current === label ? null : label));
  };

  const profileSizeClass = isMobile ? 'w-16 h-16' : !isExpanded ? 'w-10 h-10' : 'w-24 h-24';
  const sidebarWidthClass = isMobile
    ? `fixed inset-y-0 left-0 z-[80] w-[17.5rem] max-w-[86vw] transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `relative z-50 min-h-screen ${isExpanded ? 'w-72' : 'w-20'}`;

  const renderMobileControls = isMobile ? (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        className={`fixed left-4 top-4 z-[90] flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-all duration-300 dark:bg-slate-800 ${isMobileOpen ? 'pointer-events-none opacity-0 -translate-x-2' : 'opacity-100'}`}
        aria-label="Open sidebar"
      >
        <MdMenu size={22} />
      </button>
      <button
        type="button"
        onClick={closeMobileSidebar}
        className={`fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-label="Close sidebar overlay"
      />
    </>
  ) : null;

  return (
    <>
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      {renderMobileControls}

      <aside
        className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-xl flex flex-col transition-all duration-300 ease-in-out ${sidebarWidthClass}`}
      >
        {isMobile ? (
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Close sidebar"
          >
            <MdClose size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3.5 top-8 z-50 flex h-7 w-7 items-center justify-center rounded-full border-[2px] border-white bg-blue-600 text-white shadow-md transition-all hover:scale-110 hover:bg-blue-700 dark:border-slate-800"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
        )}

        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            isMobile ? 'px-5 pb-5 pt-8' : !isExpanded ? 'px-2 pb-6 pt-10' : 'px-6 pb-6 pt-10'
          }`}
        >
          <label className="cursor-pointer relative group">
            {preview ? (
              <div
                className={`rounded-full overflow-hidden border-2 border-gray-100 dark:border-slate-700 shadow-md group-hover:opacity-90 transition-all duration-300 ${profileSizeClass}`}
              >
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className={`rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-all duration-300 ${profileSizeClass}`}
              >
                {!isExpanded ? <MdPerson size={20} /> : <span className="text-xs text-center px-2">Upload</span>}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="hidden"
            />

            {isExpanded && !uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <MdCloudUpload className="text-white drop-shadow-md" size={24} />
              </div>
            )}
          </label>

          {isUploadingNewImage && isExpanded && (
            <div className="mt-3 flex gap-2 animate-fade-in">
              <button
                type="button"
                onClick={confirmUpload}
                disabled={uploading}
                className={`rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm transition-transform hover:scale-105 ${
                  uploading ? 'cursor-not-allowed bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {uploading ? '...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={cancelUpload}
                disabled={uploading}
                className={`rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm transition-transform hover:scale-105 ${
                  uploading
                    ? 'cursor-not-allowed bg-gray-300 dark:bg-slate-700'
                    : 'bg-gray-400 hover:bg-gray-500 dark:bg-slate-600 dark:hover:bg-slate-500'
                }`}
              >
                Cancel
              </button>
            </div>
          )}

          {message && isExpanded && (
            <p className="mt-2 text-center text-xs text-red-500 dark:text-red-400">{message}</p>
          )}

          <div
            className={`mt-4 overflow-hidden whitespace-nowrap text-center transition-all duration-300 ${!isExpanded ? 'h-0 opacity-0' : 'opacity-100'}`}
          >
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</p>
            <div className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {displayRole}
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar w-full flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.submenu && item.submenu.some((sub) => pathname === sub.path));
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenu === item.label;
            const compactButton = !isExpanded;

            const itemClass = `
              group relative flex items-center rounded-xl transition-all duration-200
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
              }
              ${compactButton ? 'mx-auto h-12 w-12 justify-center px-0' : 'w-full gap-3 px-3 py-3'}
            `;

            const itemContent = (
              <>
                <span className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {getIcon(item.label)}
                </span>
                <span
                  className={`origin-left whitespace-nowrap text-left font-medium transition-all duration-300 ${
                    compactButton ? 'w-0 flex-none overflow-hidden opacity-0' : 'w-auto flex-1 opacity-100'
                  }`}
                >
                  {item.label}
                </span>
                {hasSubmenu && isExpanded && (
                  <span className="transition-transform duration-200">
                    {isSubmenuOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                  </span>
                )}
                {compactButton && isActive && (
                  <div className="absolute right-1.5 h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </>
            );

            return (
              <div key={item.label}>
                {item.action === 'logout' ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileSidebar();
                      handleLogout();
                    }}
                    className={`
                      group mt-4 flex items-center rounded-xl border border-transparent transition-all duration-300
                      text-red-500 hover:border-red-100 hover:bg-red-50 hover:shadow-md dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-900/20
                      ${compactButton ? 'mx-auto h-12 w-12 justify-center px-0' : 'w-full gap-3 px-3 py-3'}
                    `}
                  >
                    <span className="flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-20deg] group-hover:scale-110">
                      {getIcon(item.label)}
                    </span>
                    <span
                      className={`origin-left whitespace-nowrap text-left font-bold transition-all duration-300 ${
                        compactButton ? 'w-0 flex-none overflow-hidden opacity-0' : 'w-auto flex-1 opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ) : hasSubmenu ? (
                  <button type="button" onClick={() => toggleSubmenu(item.label)} className={itemClass}>
                    {itemContent}
                  </button>
                ) : (
                  <Link href={item.path} className={itemClass} title={compactButton ? item.label : ''} onClick={closeMobileSidebar}>
                    {itemContent}
                  </Link>
                )}

                {hasSubmenu && isSubmenuOpen && isExpanded && (
                  <div className="mt-1 ml-6 space-y-1 animate-fade-in">
                    {item.submenu.map((subItem) => {
                      const isSubActive = pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.label}
                          href={subItem.path}
                          onClick={closeMobileSidebar}
                          className={`
                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200
                            ${
                              isSubActive
                                ? 'bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                            }
                          `}
                        >
                          <span className={`transition-transform duration-200 ${isSubActive ? 'scale-110' : ''}`}>
                            {getIcon(subItem.label, subItem.icon)}
                          </span>
                          <span className="font-medium">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {isExpanded && (
          <div className="border-t p-4 text-center text-[10px] text-gray-400 dark:border-slate-800 dark:text-slate-600">
            &copy; {new Date().getFullYear()} Pasig Sanitation
          </div>
        )}
      </aside>
    </>
  );
}
