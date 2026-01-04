// import React, { useState, useEffect } from 'react';
// import { io } from "socket.io-client";
// import {
//   Monitor, Plus, Trash2, Edit, Wifi, WifiOff, Calendar,
//   Play, Users, X, Check, Clock, AlertTriangle
// } from 'lucide-react';
// import { getAllScreens, saveScreen, deleteScreen, deploySchedule, ScreenData } from '../services/screenService';
// import { getAllPlaylists } from '../services/playlistService';
// import { useAuth } from '../contexts/AuthContext';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// const ScreenPage: React.FC = () => {
//   const { user } = useAuth();

//   // Data State
//   const [screens, setScreens] = useState<ScreenData[]>([]);
//   const [playlists, setPlaylists] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Modals State
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

//   // Selection State
//   const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
//   const [editingScreen, setEditingScreen] = useState<Partial<ScreenData>>({});

//   // Deploy Form State
//   const [deployConfig, setDeployConfig] = useState({
//     playlistId: '',
//     mode: 'NOW' as 'NOW' | 'SCHEDULE',
//     startDate: '',
//     startTime: '',
//     endDate: '',
//     endTime: '',
//   });

//   // --- Initial Load ---
//   useEffect(() => {

//     loadData();
//     // Refresh status every 10s
//     const interval = setInterval(loadData, 10000);
//     const socket = io(API_URL, { transports: ['websocket'] });
//     socket.on('connect', () => {
//       console.log("Web Socket Connected");
//       socket.emit('join_dashboard');
//     });
//     return () => { socket.disconnect(); };
//     return () => clearInterval(interval);
//   }, []);

//   const loadData = async () => {
//     try {
//       const [screenRes, playlistRes] = await Promise.all([
//         getAllScreens(),
//         getAllPlaylists()
//       ]);

//       if (screenRes.success) setScreens(screenRes.data || []);

//       if (playlistRes.success) {
//         // Handle various return structures (array vs object)
//         let list = [];
//         if (Array.isArray(playlistRes.data)) {
//           list = playlistRes.data;
//         } else if (playlistRes.data && Array.isArray(playlistRes.data.playlists)) {
//           list = playlistRes.data.playlists;
//         } else if (playlistRes.data && Array.isArray(playlistRes.data.tblplaylists)) {
//           list = playlistRes.data.tblplaylists;
//         }
//         setPlaylists(list);
//       }
//     } catch (e) {
//       console.error("Failed to load data", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Handlers ---

//   const handleSelectScreen = (id: string) => {
//     setSelectedScreens(prev =>
//       prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
//     );
//   };

//   const handleSaveScreen = async () => {
//     // 1. Validate Name
//     if (!editingScreen.screenName || editingScreen.screenName.trim() === "") {
//       return alert("Please enter a screen name.");
//     }

//     // 2. Validate Custom ID Length
//     // It's optional, but IF entered, it must be >= 6 chars
//     if (editingScreen.screenCustomId && editingScreen.screenCustomId.length < 6) {
//       return alert("Custom Connection ID must be at least 6 characters long.");
//     }

//     const payload = {
//       id: editingScreen.id,
//       screenName: editingScreen.screenName,
//       screenLocation: editingScreen.screenLocation,
//       screenCustomId: editingScreen.screenCustomId,
//       userID: user?.id
//     };

//     await saveScreen(payload);
//     setIsEditModalOpen(false);
//     loadData();
//   };

//   const handleDelete = async (id: string) => {
//     if (window.confirm('Are you sure? This will stop all schedules for this screen.')) {
//       await deleteScreen(id);
//       loadData();
//     }
//   };

//   const handleDeploy = async () => {
//     if (!deployConfig.playlistId) return alert('Please select a playlist');
//     if (selectedScreens.length === 0) return alert('Select at least one screen');

//     let startISO, endISO;
//     if (deployConfig.mode === 'SCHEDULE') {
//       if (!deployConfig.startDate || !deployConfig.startTime || !deployConfig.endDate || !deployConfig.endTime) {
//         return alert('Please fill in all date and time fields');
//       }
//       startISO = new Date(`${deployConfig.startDate}T${deployConfig.startTime}`).toISOString();
//       endISO = new Date(`${deployConfig.endDate}T${deployConfig.endTime}`).toISOString();

//       if (new Date(startISO) >= new Date(endISO)) return alert('End time must be after start time');
//     }

//     const res = await deploySchedule({
//       screenIds: selectedScreens,
//       playlistId: deployConfig.playlistId,
//       mode: deployConfig.mode,
//       startTime: startISO,
//       endTime: endISO
//     });

//     if (res.success) {
//       alert('Podcast successful! Content is syncing to screens.');
//       setIsDeployModalOpen(false);
//       setSelectedScreens([]);
//     } else {
//       alert('Podcast failed: ' + (res.msg || 'Unknown error'));
//     }
//   };

//   // --- Render ---

//   if (loading) return <div className="p-10 text-center text-gray-500">Loading Screens...</div>;

//   return (
//     <div className="min-h-screen bg-ivory p-8">
//       <div className="max-w-7xl mx-auto">

//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
//               <Monitor size={32} /> Screen Management
//             </h1>
//             <p className="text-gray-500 mt-1">Manage physical displays, connections, and broadcast schedules.</p>
//           </div>
//           <div className="flex gap-3">
//             {selectedScreens.length > 0 && (
//               <button
//                 onClick={() => setIsDeployModalOpen(true)}
//                 className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all animate-in fade-in"
//               >
//                 <Play size={18} /> Podcast ({selectedScreens.length})
//               </button>
//             )}
//             <button
//               onClick={() => { setEditingScreen({}); setIsEditModalOpen(true); }}
//               className="bg-primary hover:bg-primaryLight text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors"
//             >
//               <Plus size={18} /> Add Screen
//             </button>
//           </div>
//         </div>

//         {/* Screen Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {screens.length === 0 && (
//             <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
//               <Monitor className="mx-auto text-gray-300 mb-4" size={48} />
//               <p className="text-gray-500">No screens added yet.</p>
//             </div>
//           )}

//           {screens.map(screen => (
//             <div
//               key={screen.id}
//               onClick={() => handleSelectScreen(screen.id)}
//               className={`relative bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer group overflow-hidden
//                 ${selectedScreens.includes(screen.id) ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-gray-200'}
//               `}
//             >
//               {/* Selection Checkmark */}
//               {selectedScreens.includes(screen.id) && (
//                 <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1 z-10">
//                   <Check size={12} />
//                 </div>
//               )}

//               <div className="p-5">
//                 <div className="flex justify-between items-start mb-4">
//                   {/* Connection Status Badge */}
//                   <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${screen.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
//                     }`}>
//                     {screen.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
//                     {screen.status === 'online' ? 'ONLINE' : 'OFFLINE'}
//                   </div>

//                   {/* Screen Code (Android ID) */}
//                   <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
//                     ID: {screen.screenCustomId}
//                   </div>
//                 </div>

//                 <h3 className="text-xl font-bold text-gray-800 truncate">{screen.screenName}</h3>
//                 <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
//                   <Monitor size={14} /> {screen.screenLocation || 'No Location'}
//                 </p>

//                 {/* Info Grid */}
//                 <div className="grid grid-cols-2 gap-2 text-sm border-t pt-4">
//                   <div>
//                     <span className="text-gray-400 text-xs block uppercase tracking-wider">Devices</span>
//                     <div className="flex items-center gap-1 font-medium text-gray-700">
//                       <Users size={14} /> {screen.connectedDevices} Linked
//                     </div>
//                   </div>
//                   <div>
//                     <span className="text-gray-400 text-xs block uppercase tracking-wider">Playing</span>
//                     <div className="font-medium text-primary truncate">
//                       {screen.tblplaylist?.name || 'Nothing'}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Actions Footer */}
//               <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t border-gray-100">
//                 <div className="text-xs text-gray-400">
//                   Added {new Date(screen.createdAt).toLocaleDateString()}
//                 </div>
//                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <button
//                     onClick={(e) => { e.stopPropagation(); setEditingScreen(screen); setIsEditModalOpen(true); }}
//                     className="p-1.5 hover:bg-white rounded text-blue-600 transition-colors"
//                   >
//                     <Edit size={16} />
//                   </button>
//                   <button
//                     onClick={(e) => { e.stopPropagation(); handleDelete(screen.id); }}
//                     className="p-1.5 hover:bg-white rounded text-red-500 transition-colors"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* --- EDIT / CREATE MODAL --- */}
//         {isEditModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
//               <div className="bg-primary text-white p-4 flex justify-between items-center">
//                 <h3 className="font-bold">{editingScreen.id ? 'Edit Screen' : 'New Screen'}</h3>
//                 <button onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
//               </div>
//               <div className="p-6 space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Screen Name</label>
//                   <input
//                     className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
//                     value={editingScreen.screenName || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenName: e.target.value })}
//                     placeholder="e.g. Lobby Display 1"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
//                   <input
//                     className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
//                     value={editingScreen.screenLocation || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenLocation: e.target.value })}
//                     placeholder="e.g. Main Entrance"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Custom Connection ID (Optional)</label>
//                   <input
//                     className="w-full border rounded-lg p-2 bg-gray-50 font-mono text-sm"
//                     value={editingScreen.screenCustomId || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenCustomId: e.target.value })}
//                     placeholder="Auto-generated if empty"
//                   />
//                   <p className="text-xs text-gray-400 mt-1">
//                     Enter this ID in the Android App to connect. <br />
//                     <span className="text-orange-500 font-bold">Must be at least 6 characters.</span>
//                   </p>
//                 </div>
//                 <button
//                   onClick={handleSaveScreen}
//                   className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primaryLight mt-4"
//                 >
//                   Save Screen
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* --- DEPLOY / PODCAST MODAL --- */}
//         {isDeployModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
//               <div className="bg-purple-700 text-white p-5 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-lg flex items-center gap-2"><Play size={20} /> Podcast Content</h3>
//                   <p className="text-purple-200 text-xs">Deploying to {selectedScreens.length} selected screens</p>
//                 </div>
//                 <button onClick={() => setIsDeployModalOpen(false)}><X size={24} /></button>
//               </div>

//               <div className="p-6 space-y-6">
//                 {/* 1. Select Content */}
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">Select Playlist</label>
//                   <select
//                     className="w-full border-2 border-gray-200 rounded-lg p-3 bg-white focus:border-purple-500 outline-none transition-colors"
//                     value={deployConfig.playlistId}
//                     onChange={e => setDeployConfig({ ...deployConfig, playlistId: e.target.value })}
//                   >
//                     <option value="">-- Choose Content --</option>
//                     {playlists.map(p => (
//                       <option key={p.id} value={p.id}>{p.name}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* 2. Select Mode */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <button
//                     onClick={() => setDeployConfig({ ...deployConfig, mode: 'NOW' })}
//                     className={`p-4 rounded-xl border-2 text-center transition-all ${deployConfig.mode === 'NOW'
//                       ? 'border-purple-500 bg-purple-50 text-purple-700'
//                       : 'border-gray-200 hover:border-purple-200'
//                       }`}
//                   >
//                     <ZapIcon active={deployConfig.mode === 'NOW'} />
//                     <div className="font-bold mt-2">Podcast Now</div>
//                     <div className="text-xs text-gray-500">Plays immediately</div>
//                   </button>
//                   <button
//                     onClick={() => setDeployConfig({ ...deployConfig, mode: 'SCHEDULE' })}
//                     className={`p-4 rounded-xl border-2 text-center transition-all ${deployConfig.mode === 'SCHEDULE'
//                       ? 'border-purple-500 bg-purple-50 text-purple-700'
//                       : 'border-gray-200 hover:border-purple-200'
//                       }`}
//                   >
//                     <CalendarIcon active={deployConfig.mode === 'SCHEDULE'} />
//                     <div className="font-bold mt-2">Schedule</div>
//                     <div className="text-xs text-gray-500">Set Date & Time</div>
//                   </button>
//                 </div>

//                 {/* 3. Schedule Inputs */}
//                 {deployConfig.mode === 'SCHEDULE' && (
//                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-in slide-in-from-top-2">
//                     <div className="flex items-center gap-2 text-orange-600 text-xs font-bold mb-2">
//                       <AlertTriangle size={14} />
//                       Content will download now but play only during this window.
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="text-xs font-bold text-gray-500">Start</label>
//                         <input type="date" className="w-full border rounded p-1.5" onChange={e => setDeployConfig({ ...deployConfig, startDate: e.target.value })} />
//                         <input type="time" className="w-full border rounded p-1.5 mt-1" onChange={e => setDeployConfig({ ...deployConfig, startTime: e.target.value })} />
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-gray-500">End</label>
//                         <input type="date" className="w-full border rounded p-1.5" onChange={e => setDeployConfig({ ...deployConfig, endDate: e.target.value })} />
//                         <input type="time" className="w-full border rounded p-1.5 mt-1" onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })} />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   onClick={handleDeploy}
//                   className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
//                 >
//                   Confirm Podcast
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// // Simple Icons
// const ZapIcon = ({ active }: { active: boolean }) => (
//   <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
//     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
//   </div>
// );

// const CalendarIcon = ({ active }: { active: boolean }) => (
//   <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
//     <Calendar size={20} />
//   </div>
// );

// export default ScreenPage;

import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import {
  Monitor, Plus, Trash2, Edit, Wifi, WifiOff, Calendar,
  Play, Users, X, Check, Clock, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import { getAllScreens, saveScreen, deleteScreen, deploySchedule, ScreenData } from '../services/screenService';
import { getAllPlaylists } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- CUSTOM ALERT MODAL COMPONENT ---
interface StatusModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  const styles = {
    success: { bg: 'bg-green-600', icon: <CheckCircle size={32} /> },
    error: { bg: 'bg-red-600', icon: <AlertTriangle size={32} /> },
    info: { bg: 'bg-slate-800', icon: <Info size={32} /> },
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
        <div className={`${currentStyle.bg} text-white p-6 flex flex-col items-center justify-center`}>
          <div className="bg-white/20 p-3 rounded-full mb-2">
            {currentStyle.icon}
          </div>
          <h3 className="text-xl font-bold uppercase tracking-wider">{type}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-700 font-medium text-lg leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 ${currentStyle.bg} hover:opacity-90`}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const ScreenPage: React.FC = () => {
  const { user } = useAuth();

  // Data State
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [statusState, setStatusState] = useState<{ open: boolean; type: 'success' | 'error' | 'info'; msg: string }>({
    open: false, type: 'info', msg: ''
  });

  // Selection State
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [editingScreen, setEditingScreen] = useState<Partial<ScreenData>>({});

  // Deploy Form State
  const [deployConfig, setDeployConfig] = useState({
    playlistId: '',
    mode: 'NOW' as 'NOW' | 'SCHEDULE',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '', // Used for "Until" in NOW mode and "End Time" in SCHEDULE mode
  });

  // --- Initial Load & Socket ---
  useEffect(() => {
    loadData();

    // Polling
    const interval = setInterval(loadData, 10000);

    // Socket for Dashboard Updates
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      console.log("💻 Web Dashboard Connected via Socket");
      socket.emit('join_dashboard');
    });

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [screenRes, playlistRes] = await Promise.all([
        getAllScreens(),
        getAllPlaylists()
      ]);

      if (screenRes.success) setScreens(screenRes.data || []);

      if (playlistRes.success) {
        let list = [];
        if (Array.isArray(playlistRes.data)) {
          list = playlistRes.data;
        } else if (playlistRes.data && Array.isArray(playlistRes.data.playlists)) {
          list = playlistRes.data.playlists;
        } else if (playlistRes.data && Array.isArray(playlistRes.data.tblplaylists)) {
          list = playlistRes.data.tblplaylists;
        }
        setPlaylists(list);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
    setStatusState({ open: true, type, msg });
  };

  const closeAlert = () => {
    setStatusState({ ...statusState, open: false });
  };

  const handleSelectScreen = (id: string) => {
    setSelectedScreens(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // --- Actions ---

  const handleSaveScreen = async () => {
    if (!editingScreen.screenName || editingScreen.screenName.trim() === "") {
      return showAlert('error', "Please enter a screen name.");
    }

    if (editingScreen.screenCustomId && editingScreen.screenCustomId.length < 6) {
      return showAlert('error', "Custom Connection ID must be at least 6 characters long.");
    }

    const payload = {
      id: editingScreen.id,
      screenName: editingScreen.screenName,
      screenLocation: editingScreen.screenLocation,
      screenCustomId: editingScreen.screenCustomId,
      userID: user?.id
    };

    const res = await saveScreen(payload);
    if (res.success) {
      setIsEditModalOpen(false);
      loadData();
      showAlert('success', 'Screen saved successfully!');
    } else {
      showAlert('error', res.msg || 'Failed to save screen');
    }
  };

  const handleDelete = async (id: string) => {
    // We use a browser confirm here as it's a destructive action, 
    // but you could replace this with another modal if desired.
    if (window.confirm('Are you sure? This will delete the screen and stop all schedules.')) {
      const res = await deleteScreen(id);
      if (res.success) {
        loadData();
        showAlert('success', 'Screen deleted successfully.');
      } else {
        showAlert('error', 'Failed to delete screen.');
      }
    }
  };

  const handleDeploy = async () => {
    if (!deployConfig.playlistId) return showAlert('error', 'Please select a playlist.');
    if (selectedScreens.length === 0) return showAlert('error', 'Select at least one screen.');

    let startISO, endISO;

    if (deployConfig.mode === 'SCHEDULE') {
      if (!deployConfig.startDate || !deployConfig.startTime || !deployConfig.endDate || !deployConfig.endTime) {
        return showAlert('error', 'Please fill in all date and time fields.');
      }
      startISO = new Date(`${deployConfig.startDate}T${deployConfig.startTime}`).toISOString();
      endISO = new Date(`${deployConfig.endDate}T${deployConfig.endTime}`).toISOString();

      if (new Date(startISO) >= new Date(endISO)) return showAlert('error', 'End time must be after start time.');
    } else {
      // NOW MODE
      // If user provided an End Time, construct the date
      // Default to today
      if (deployConfig.endTime) {
        // Create a date object for "Today + Time"
        // Logic handles crossing midnight in backend usually, but basic is today
        // We just send the Time String, backend controller logic handles the Date construction
        // OR we construct it here:
      }
    }

    const res = await deploySchedule({
      screenIds: selectedScreens,
      playlistId: deployConfig.playlistId,
      mode: deployConfig.mode,
      startTime: startISO,
      endTime: deployConfig.endTime, // Backend logic expects this for NOW mode "Until"
    });

    if (res.success) {
      setIsDeployModalOpen(false);
      setSelectedScreens([]);
      showAlert('success', 'Content broadcasted successfully! Screens will update shortly.');
    } else {
      showAlert('error', res.msg || 'Podcast failed. Ensure designs are exported to video.');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-ivory text-slate-500 font-bold">Loading Screens...</div>;

  return (
    <div className="min-h-screen bg-ivory p-8">
      <div className="max-w-7xl mx-auto">

        {/* --- Custom Status Modal --- */}
        <StatusModal
          isOpen={statusState.open}
          type={statusState.type}
          message={statusState.msg}
          onClose={closeAlert}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Monitor className="text-slate-900" size={32} /> Screen Management
            </h1>
            <p className="text-slate-500 mt-1">Monitor, manage, and schedule content for your displays.</p>
          </div>
          <div className="flex gap-3">
            {selectedScreens.length > 0 && (
              <button
                onClick={() => setIsDeployModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all animate-in fade-in hover:scale-105"
              >
                <Play size={20} /> Podcast ({selectedScreens.length})
              </button>
            )}
            <button
              onClick={() => { setEditingScreen({}); setIsEditModalOpen(true); }}
              className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors"
            >
              <Plus size={20} /> Add Screen
            </button>
          </div>
        </div>

        {/* Screen Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Monitor className="text-slate-400" size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Screens Added</h3>
              <p className="text-slate-500 mb-6">Link your first device to get started.</p>
              <button
                onClick={() => { setEditingScreen({}); setIsEditModalOpen(true); }}
                className="text-slate-900 font-bold underline hover:text-blue-600"
              >
                Add a Screen Now
              </button>
            </div>
          )}

          {screens.map(screen => (
            <div
              key={screen.id}
              onClick={() => handleSelectScreen(screen.id)}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all cursor-pointer group overflow-hidden hover:shadow-md
                ${selectedScreens.includes(screen.id) ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-300'}
              `}
            >
              {/* Selection Checkmark */}
              {selectedScreens.includes(screen.id) && (
                <div className="absolute top-3 right-3 bg-slate-900 text-white rounded-full p-1.5 z-10 shadow-sm animate-in zoom-in">
                  <Check size={14} />
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Connection Status Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${screen.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {screen.status === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {screen.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 truncate mb-1">{screen.screenName}</h3>
                <p className="text-slate-500 text-sm mb-6 flex items-center gap-1.5">
                  <Monitor size={16} /> {screen.screenLocation || 'Unknown Location'}
                </p>

                {/* Info Grid */}
                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Status</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Users size={14} /> {screen.connectedDevices} Connected
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Playing</span>
                    <div className="font-semibold text-slate-900 truncate" title={screen.tblplaylist?.name}>
                      {screen.tblplaylist?.name || '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
                    ID: {screen.screenCustomId}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingScreen(screen); setIsEditModalOpen(true); }}
                      className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(screen.id); }}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- EDIT / CREATE MODAL --- */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <h3 className="font-bold text-lg">{editingScreen.id ? 'Edit Screen Settings' : 'Add New Screen'}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Screen Name</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-slate-900 focus:ring-0 outline-none transition-colors"
                    value={editingScreen.screenName || ''}
                    onChange={e => setEditingScreen({ ...editingScreen, screenName: e.target.value })}
                    placeholder="e.g. Lobby Reception TV"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Location</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-slate-900 focus:ring-0 outline-none transition-colors"
                    value={editingScreen.screenLocation || ''}
                    onChange={e => setEditingScreen({ ...editingScreen, screenLocation: e.target.value })}
                    placeholder="e.g. Building A, Floor 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Connection ID (Optional)</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 font-mono text-sm focus:border-slate-900 outline-none"
                    value={editingScreen.screenCustomId || ''}
                    onChange={e => setEditingScreen({ ...editingScreen, screenCustomId: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Info size={12} /> Enter this ID in the Android App to link the device. (Min 6 chars)
                  </p>
                </div>
                <button
                  onClick={handleSaveScreen}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-lg mt-2 transition-transform active:scale-95"
                >
                  Save Screen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DEPLOY / PODCAST MODAL --- */}
        {isDeployModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2"><Play size={24} className="text-green-400" /> Podcast Content</h3>
                  <p className="text-slate-300 text-sm mt-1">Deploying to <span className="font-bold text-white">{selectedScreens.length}</span> selected screens</p>
                </div>
                <button onClick={() => setIsDeployModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-8">
                {/* 1. Select Content */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Playlist</label>
                  <div className="relative">
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl p-3 pl-4 bg-white focus:border-slate-900 outline-none appearance-none font-medium text-slate-700 cursor-pointer"
                      value={deployConfig.playlistId}
                      onChange={e => setDeployConfig({ ...deployConfig, playlistId: e.target.value })}
                    >
                      <option value="">-- Choose Content to Play --</option>
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.itemCount || 0} items)</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-500">▼</div>
                  </div>
                </div>

                {/* 2. Select Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeployConfig({ ...deployConfig, mode: 'NOW' })}
                    className={`p-4 rounded-2xl border-2 text-center transition-all group ${deployConfig.mode === 'NOW'
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-gray-200 hover:border-slate-300 text-gray-500'
                      }`}
                  >
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${deployConfig.mode === 'NOW' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                      <Play size={24} fill="currentColor" />
                    </div>
                    <div className="font-bold">Play Now</div>
                    <div className="text-xs opacity-70 mt-1">Starts immediately</div>
                  </button>
                  <button
                    onClick={() => setDeployConfig({ ...deployConfig, mode: 'SCHEDULE' })}
                    className={`p-4 rounded-2xl border-2 text-center transition-all group ${deployConfig.mode === 'SCHEDULE'
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-gray-200 hover:border-slate-300 text-gray-500'
                      }`}
                  >
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${deployConfig.mode === 'SCHEDULE' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                      <Calendar size={24} />
                    </div>
                    <div className="font-bold">Schedule</div>
                    <div className="text-xs opacity-70 mt-1">Set Date & Time</div>
                  </button>
                </div>

                {/* 3. Dynamic Inputs */}
                {deployConfig.mode === 'NOW' ? (
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Play Until (Optional)</label>
                    <input
                      type="time"
                      className="w-full border-2 border-blue-100 rounded-lg p-2.5 focus:border-slate-900 outline-none"
                      value={deployConfig.endTime}
                      onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Info size={12} /> If left blank, it will play for 24 hours.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 p-2 rounded-lg border border-orange-100">
                      <AlertTriangle size={14} />
                      Content downloads now, but plays ONLY during this window.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
                        <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, startDate: e.target.value })} />
                        <input type="time" className="w-full border rounded-lg p-2 mt-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, startTime: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
                        <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, endDate: e.target.value })} />
                        <input type="time" className="w-full border rounded-lg p-2 mt-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDeploy}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Wifi size={20} /> Confirm Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScreenPage;