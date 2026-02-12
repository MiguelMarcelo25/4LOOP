'use client';

import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  MdSend
} from 'react-icons/md';

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [message, setMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  useEffect(() => {
    const storedId = localStorage.getItem('loggedUserId');
    if (storedId) setUserId(storedId);
    
    // Load collapsed state from local storage
    const storedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (storedCollapsed) setIsCollapsed(JSON.parse(storedCollapsed));
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Determine if sidebar should be visually expanded
  const isExpanded = isHovered || !isCollapsed;

  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  useEffect(() => {
    if (user?.profilePicture) setPreview(user.profilePicture);
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('❌ Invalid file type. Please upload a JPG, PNG, or similar image.');
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
        setMessage('✅ Profile picture updated successfully.');
        localStorage.setItem('profilePicture', preview);
        mutate(`/api/users/${userId}`);
        setIsUploadingNewImage(false);
        window.location.reload();
      } else {
        setMessage('❌ Upload failed: ' + result.error);
      }
    } catch (error) {
      setUploading(false);
      setMessage('❌ Upload error: ' + error.message);
    }
  };

  const cancelUpload = () => {
    setPreview(user?.profilePicture || null);
    setIsUploadingNewImage(false);
    setMessage('Upload canceled.');
  };

  // 🚀 Direct Logout Helper
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      
      // Clear all local storage auth data
      localStorage.removeItem('loggedUserId');
      localStorage.removeItem('loggedUserRole');
      localStorage.removeItem('profilePicture');

      // Full reload and redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  // 🔹 Determine User Role & Display Name
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

  // 🔹 Define Navigation Config (Minimized Redundancy)
  const roleConfigs = {
    admin: {
      base: '/admin',
      items: [
        { label: 'Dashboard', path: '' }, // default to base
        { 
          label: 'Officers', 
          path: '/createofficer',
          submenu: [
            { label: 'Officers List', path: '/officers', icon: 'list' },
            { label: 'Create Officer Account', path: '/createofficer', icon: 'createofficer' }
          ]
        },
        { label: 'Businesses', path: '/businesses' },
        { label: 'Inspections', path: '/inspections' },
        { label: 'Pending Request', path: '/pending' },
        { label: 'Completed Request', path: '/completed' }
      ]
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
            { label: 'Release', path: '/workbench/release', icon: 'release' }
          ]
        },
        { 
          label: 'Inspections', 
          path: '/inspections',
          submenu: [
            { label: 'Inspect Business', path: '/inspections/createticketinspection', icon: 'add' },
            { label: 'Pending Inspection', path: '/inspections/pendinginspections', icon: 'list' }
          ]
        },
        { label: 'Businesses', path: '/businesses' },
        { label: 'Profile Settings', path: '/profile' }
      ]
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
            { label: 'Add a Business', path: '/businesses/addbusiness', icon: 'add' }
          ]
        },
        { 
          label: 'Make a Request', 
          path: '/request',
          submenu: [
            { label: 'New Sanitation Permit Request', path: '/request/newbusiness', icon: 'newrequest' },
            { label: 'Check Your Request', path: '/request/requestsent', icon: 'checkrequest' }
          ]
        },
        { label: 'Pending Request', path: '/pending' },
        { label: 'Completed Request', path: '/completed' },
        { label: 'Change Password', path: '/changepassword' }
      ]
    }
  };

  // Construct final navigation list
  const navItems = [];
  if (role && roleConfigs[role]) {
    const config = roleConfigs[role];
    // Map main items
    config.items.forEach(item => {
      navItems.push({
        ...item,
        path: config.base + item.path,
        submenu: item.submenu?.map(sub => ({ ...sub, path: config.base + sub.path }))
      });
    });
    // Append standard footers
    navItems.push({ label: 'Help', path: `${config.base}/help` });
    navItems.push({ label: 'Logout', action: 'logout' });
  }

  // 🔹 Icon Mapper
  const getIcon = (label, iconType) => {
    // Priority 1: Submenu Icons
    const subIcons = {
      list: <MdList size={20} />,
      add: <MdAdd size={20} />,
      newrequest: <MdDescription size={20} />,
      checkrequest: <MdSearch size={20} />,
      createofficer: <MdPersonAdd size={20} />,
      verification: <MdFactCheck size={20} />,
      compliance: <MdRule size={20} />,
      approval: <MdCheckCircle size={20} />,
      release: <MdSend size={20} />
    };
    if (subIcons[iconType]) return subIcons[iconType];

    // Priority 2: Main Menu Labels
    const mainIcons = {
      'Dashboard': <MdDashboard size={24} />,
      'Officers': <MdBadge size={24} />,
      'Businesses': <MdBusiness size={24} />,
      'Inspections': <MdAssignment size={24} />,
      'Pending Request': <MdPendingActions size={24} />,
      'Completed Request': <MdCheckCircle size={24} />,
      'Help': <MdHelp size={24} />,
      'Logout': <MdLogout size={24} />,
      'Make a Request': <MdAddCircle size={24} />,
      'Change Password': <MdLock size={24} />,
      'Profile Settings': <MdPerson size={24} />,
      'Workbench': <MdWork size={24} />
    };
    return mainIcons[label] || <MdDashboard size={24} />;
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  if (!user) {
    return (
      <aside className={`bg-white dark:bg-slate-900 border-r dark:border-slate-800 shadow-lg h-screen flex flex-col items-center transition-all duration-300 ${isExpanded ? 'w-72' : 'w-20'}`}>
        <p className="mt-10 text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </aside>
    );
  }

  return (
    <aside 
      className={`
        relative bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-xl min-h-screen flex flex-col 
        transition-all duration-300 ease-in-out z-50
        ${isExpanded ? 'w-72' : 'w-20'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        {/* Toggle Button */}
        <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-9 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all z-50 border-2 border-white dark:border-slate-800"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
        </button>

      {/* 👤 Profile Section */}
      <div className={`flex flex-col items-center py-8 transition-all duration-300 ${!isExpanded ? 'px-2' : 'px-6'}`}>
        <label className="cursor-pointer relative group">
          {preview ? (
            <div className={`
              rounded-full overflow-hidden border-2 border-gray-100 dark:border-slate-700 shadow-md group-hover:opacity-90 transition-all duration-300
              ${!isExpanded ? 'w-10 h-10' : 'w-24 h-24'}
            `}>
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`
              rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-all duration-300
              ${!isExpanded ? 'w-10 h-10' : 'w-24 h-24'}
            `}>
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
             <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MdCloudUpload className="text-white drop-shadow-md" size={24} />
             </div>
          )}
        </label>

        {isUploadingNewImage && isExpanded && (
          <div className="flex gap-2 mt-3 animate-fade-in">
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className={`px-3 py-1 rounded-full text-white text-xs font-medium shadow-sm transition transform hover:scale-105 ${
                uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? '...' : 'Save'}
            </button>

            <button
              onClick={cancelUpload}
              disabled={uploading}
              className={`px-3 py-1 rounded-full text-white text-xs font-medium shadow-sm transition transform hover:scale-105 ${
                uploading ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gray-400 dark:bg-slate-600 hover:bg-gray-500 dark:hover:bg-slate-500'
              }`}
            >
              Cancel
            </button>
          </div>
        )}

        {message && isExpanded && (
          <p className="text-xs mt-2 text-center text-red-500 dark:text-red-400 animate-pulse">{message}</p>
        )}

        <div className={`mt-4 text-center transition-all duration-300 overflow-hidden whitespace-nowrap ${!isExpanded ? 'opacity-0 h-0' : 'opacity-100'}`}>
            <p className="font-bold text-gray-800 dark:text-slate-100 text-lg">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                {displayRole}
            </div>
        </div>
      </div>

      {/* 🧭 Navigation */}
      <nav className="w-full flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
           const isActive = pathname === item.path || (item.submenu && item.submenu.some(sub => pathname === sub.path));
           const hasSubmenu = item.submenu && item.submenu.length > 0;
           const isSubmenuOpen = openSubmenu === item.label;
           
           // Common class for menu items
           const itemClass = `
            w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
            ${isActive 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
              : 'text-gray-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400'}
            ${!isExpanded ? 'justify-center' : ''}
           `;

           // Content inside the button/link
           const itemContent = (
             <>
               <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {getIcon(item.label)}
               </span>
               <span className={`
                 font-medium whitespace-nowrap transition-all duration-300 origin-left flex-1 text-left
                 ${!isExpanded ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
               `}>
                 {item.label}
               </span>
               {hasSubmenu && isExpanded && (
                 <span className="transition-transform duration-200">
                   {isSubmenuOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                 </span>
               )}
               {!isExpanded && isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
               )}
             </>
           );

           return (
            <div key={item.label}>
              {/* Logic to choose between Action Button, Submenu Toggle, or Link */}
              {item.action === 'logout' ? (
                <button 
                  onClick={handleLogout} 
                  className={`
                    w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 mt-4
                    text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 
                    hover:shadow-md border border-transparent hover:border-red-100 dark:hover:border-red-900
                    ${!isExpanded ? 'justify-center' : ''}
                  `}
                >
                   <span className="transition-transform duration-300 group-hover:rotate-[-20deg] group-hover:scale-110">
                      {getIcon(item.label)}
                   </span>
                   <span className={`
                     font-bold whitespace-nowrap transition-all duration-300 origin-left flex-1 text-left
                     ${!isExpanded ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
                   `}>
                     {item.label}
                   </span>
                </button>
              ) : hasSubmenu ? (
                <button onClick={() => toggleSubmenu(item.label)} className={itemClass}>
                  {itemContent}
                </button>
              ) : (
                <Link href={item.path} className={itemClass} title={!isExpanded ? item.label : ''}>
                  {itemContent}
                </Link>
              )}
              
              {/* Submenu Items */}
              {hasSubmenu && isSubmenuOpen && isExpanded && (
                <div className="ml-6 mt-1 space-y-1 animate-fade-in">
                  {item.submenu.map((subItem) => {
                    const isSubActive = pathname === subItem.path;
                    return (
                      <Link
                        key={subItem.label}
                        href={subItem.path}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                          ${isSubActive
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}
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
          <div className="p-4 text-center text-[10px] text-gray-400 dark:text-slate-600 border-t dark:border-slate-800">
              © {new Date().getFullYear()} Pasig Sanitation
          </div>
      )}
    </aside>
  );
}
