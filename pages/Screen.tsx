
// import React, { useState, useEffect } from 'react';
// import { io } from "socket.io-client";
// import {
//   Monitor, Plus, Trash2, Edit, Wifi, WifiOff, Calendar,
//   Play, Users, X, Check, Clock, AlertTriangle, Info, CheckCircle
// } from 'lucide-react';
// import { getAllScreens, saveScreen, deleteScreen, deploySchedule, ScreenData } from '../services/screenService';
// import { getAllPlaylists } from '../services/playlistService';
// import { useAuth } from '../contexts/AuthContext';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// // --- CUSTOM ALERT MODAL COMPONENT ---
// interface StatusModalProps {
//   isOpen: boolean;
//   type: 'success' | 'error' | 'info';
//   message: string;
//   onClose: () => void;
// }

// const StatusModal: React.FC<StatusModalProps> = ({ isOpen, type, message, onClose }) => {
//   if (!isOpen) return null;

//   const styles = {
//     success: { bg: 'bg-green-600', icon: <CheckCircle size={32} /> },
//     error: { bg: 'bg-red-600', icon: <AlertTriangle size={32} /> },
//     info: { bg: 'bg-slate-800', icon: <Info size={32} /> },
//   };

//   const currentStyle = styles[type];

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
//         <div className={`${currentStyle.bg} text-white p-6 flex flex-col items-center justify-center`}>
//           <div className="bg-white/20 p-3 rounded-full mb-2">
//             {currentStyle.icon}
//           </div>
//           <h3 className="text-xl font-bold uppercase tracking-wider">{type}</h3>
//         </div>
//         <div className="p-6 text-center">
//           <p className="text-gray-700 font-medium text-lg leading-relaxed">{message}</p>
//         </div>
//         <div className="p-4 bg-gray-50 border-t border-gray-100">
//           <button
//             onClick={onClose}
//             className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 ${currentStyle.bg} hover:opacity-90`}
//           >
//             Okay
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- MAIN PAGE COMPONENT ---
// const ScreenPage: React.FC = () => {
//   const { user } = useAuth();

//   // Data State
//   const [screens, setScreens] = useState<ScreenData[]>([]);
//   const [playlists, setPlaylists] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   // UI State
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
//   const [statusState, setStatusState] = useState<{ open: boolean; type: 'success' | 'error' | 'info'; msg: string }>({
//     open: false, type: 'info', msg: ''
//   });

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
//     endTime: '', // Used for "Until" in NOW mode and "End Time" in SCHEDULE mode
//   });

//   // --- Initial Load & Socket ---
//   useEffect(() => {
//     loadData();

//     // Polling
//     const interval = setInterval(loadData, 10000);

//     // Socket for Dashboard Updates
//     const socket = io(API_URL, { transports: ['websocket'] });
//     socket.on('connect', () => {
//       console.log("💻 Web Dashboard Connected via Socket");
//       socket.emit('join_dashboard');
//     });

//     return () => {
//       socket.disconnect();
//       clearInterval(interval);
//     };
//   }, []);

//   const loadData = async () => {
//     try {
//       const [screenRes, playlistRes] = await Promise.all([
//         getAllScreens(),
//         getAllPlaylists()
//       ]);

//       if (screenRes.success) setScreens(screenRes.data || []);

//       if (playlistRes.success) {
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

//   // --- Helpers ---
//   const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
//     setStatusState({ open: true, type, msg });
//   };

//   const closeAlert = () => {
//     setStatusState({ ...statusState, open: false });
//   };

//   const handleSelectScreen = (id: string) => {
//     setSelectedScreens(prev =>
//       prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
//     );
//   };

//   // --- Actions ---

//   const handleSaveScreen = async () => {
//     if (!editingScreen.screenName || editingScreen.screenName.trim() === "") {
//       return showAlert('error', "Please enter a screen name.");
//     }

//     if (editingScreen.screenCustomId && editingScreen.screenCustomId.length < 6) {
//       return showAlert('error', "Custom Connection ID must be at least 6 characters long.");
//     }

//     const payload = {
//       id: editingScreen.id,
//       screenName: editingScreen.screenName,
//       screenLocation: editingScreen.screenLocation,
//       screenCustomId: editingScreen.screenCustomId,
//       userID: user?.id
//     };

//     const res = await saveScreen(payload);
//     if (res.success) {
//       setIsEditModalOpen(false);
//       loadData();
//       showAlert('success', 'Screen saved successfully!');
//     } else {
//       showAlert('error', res.msg || 'Failed to save screen');
//     }
//   };

//   const handleDelete = async (id: string) => {
//     // We use a browser confirm here as it's a destructive action, 
//     // but you could replace this with another modal if desired.
//     if (window.confirm('Are you sure? This will delete the screen and stop all schedules.')) {
//       const res = await deleteScreen(id);
//       if (res.success) {
//         loadData();
//         showAlert('success', 'Screen deleted successfully.');
//       } else {
//         showAlert('error', 'Failed to delete screen.');
//       }
//     }
//   };

//   const handleDeploy = async () => {
//     if (!deployConfig.playlistId) return showAlert('error', 'Please select a playlist.');
//     if (selectedScreens.length === 0) return showAlert('error', 'Select at least one screen.');

//     let startISO, endISO;

//     if (deployConfig.mode === 'SCHEDULE') {
//       if (!deployConfig.startDate || !deployConfig.startTime || !deployConfig.endDate || !deployConfig.endTime) {
//         return showAlert('error', 'Please fill in all date and time fields.');
//       }
//       startISO = new Date(`${deployConfig.startDate}T${deployConfig.startTime}`).toISOString();
//       endISO = new Date(`${deployConfig.endDate}T${deployConfig.endTime}`).toISOString();

//       if (new Date(startISO) >= new Date(endISO)) return showAlert('error', 'End time must be after start time.');
//     } else {
//       // NOW MODE
//       // If user provided an End Time, construct the date
//       // Default to today
//       if (deployConfig.endTime) {
//         // Create a date object for "Today + Time"
//         // Logic handles crossing midnight in backend usually, but basic is today
//         // We just send the Time String, backend controller logic handles the Date construction
//         // OR we construct it here:
//       }
//     }

//     const res = await deploySchedule({
//       screenIds: selectedScreens,
//       playlistId: deployConfig.playlistId,
//       mode: deployConfig.mode,
//       startTime: startISO,
//       endTime: deployConfig.endTime, // Backend logic expects this for NOW mode "Until"
//     });

//     if (res.success) {
//       setIsDeployModalOpen(false);
//       setSelectedScreens([]);
//       showAlert('success', 'Content broadcasted successfully! Screens will update shortly.');
//     } else {
//       showAlert('error', res.msg || 'Podcast failed. Ensure designs are exported to video.');
//     }
//   };

//   if (loading) return <div className="h-screen flex items-center justify-center bg-ivory text-slate-500 font-bold">Loading Screens...</div>;

//   return (
//     <div className="min-h-screen bg-ivory p-8">
//       <div className="max-w-7xl mx-auto">

//         {/* --- Custom Status Modal --- */}
//         <StatusModal
//           isOpen={statusState.open}
//           type={statusState.type}
//           message={statusState.msg}
//           onClose={closeAlert}
//         />

//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
//               <Monitor className="text-slate-900" size={32} /> Screen Management
//             </h1>
//             <p className="text-slate-500 mt-1">Monitor, manage, and schedule content for your displays.</p>
//           </div>
//           <div className="flex gap-3">
//             {selectedScreens.length > 0 && (
//               <button
//                 onClick={() => setIsDeployModalOpen(true)}
//                 className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all animate-in fade-in hover:scale-105"
//               >
//                 <Play size={20} /> Podcast ({selectedScreens.length})
//               </button>
//             )}
//             <button
//               onClick={() => { setEditingScreen({}); setIsEditModalOpen(true); }}
//               className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors"
//             >
//               <Plus size={20} /> Add Screen
//             </button>
//           </div>
//         </div>

//         {/* Screen Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {screens.length === 0 && (
//             <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300">
//               <div className="bg-slate-100 p-4 rounded-full mb-4">
//                 <Monitor className="text-slate-400" size={48} />
//               </div>
//               <h3 className="text-xl font-bold text-slate-700">No Screens Added</h3>
//               <p className="text-slate-500 mb-6">Link your first device to get started.</p>
//               <button
//                 onClick={() => { setEditingScreen({}); setIsEditModalOpen(true); }}
//                 className="text-slate-900 font-bold underline hover:text-blue-600"
//               >
//                 Add a Screen Now
//               </button>
//             </div>
//           )}

//           {screens.map(screen => (
//             <div
//               key={screen.id}
//               onClick={() => handleSelectScreen(screen.id)}
//               className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all cursor-pointer group overflow-hidden hover:shadow-md
//                 ${selectedScreens.includes(screen.id) ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-300'}
//               `}
//             >
//               {/* Selection Checkmark */}
//               {selectedScreens.includes(screen.id) && (
//                 <div className="absolute top-3 right-3 bg-slate-900 text-white rounded-full p-1.5 z-10 shadow-sm animate-in zoom-in">
//                   <Check size={14} />
//                 </div>
//               )}

//               <div className="p-6">
//                 <div className="flex justify-between items-start mb-4">
//                   {/* Connection Status Badge */}
//                   <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${screen.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
//                     }`}>
//                     {screen.status === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
//                     {screen.status === 'online' ? 'Online' : 'Offline'}
//                   </div>
//                 </div>

//                 <h3 className="text-xl font-bold text-slate-800 truncate mb-1">{screen.screenName}</h3>
//                 <p className="text-slate-500 text-sm mb-6 flex items-center gap-1.5">
//                   <Monitor size={16} /> {screen.screenLocation || 'Unknown Location'}
//                 </p>

//                 {/* Info Grid */}
//                 <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-4 text-sm">
//                   <div>
//                     <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Status</span>
//                     <div className="flex items-center gap-1.5 font-semibold text-slate-700">
//                       <Users size={14} /> {screen.connectedDevices} Connected
//                     </div>
//                   </div>
//                   <div>
//                     <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Playing</span>
//                     <div className="font-semibold text-slate-900 truncate" title={screen.tblplaylist?.name}>
//                       {screen.tblplaylist?.name || '—'}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
//                   <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
//                     ID: {screen.screenCustomId}
//                   </div>
//                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <button
//                       onClick={(e) => { e.stopPropagation(); setEditingScreen(screen); setIsEditModalOpen(true); }}
//                       className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
//                     >
//                       <Edit size={18} />
//                     </button>
//                     <button
//                       onClick={(e) => { e.stopPropagation(); handleDelete(screen.id); }}
//                       className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* --- EDIT / CREATE MODAL --- */}
//         {isEditModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
//               <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
//                 <h3 className="font-bold text-lg">{editingScreen.id ? 'Edit Screen Settings' : 'Add New Screen'}</h3>
//                 <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
//               </div>
//               <div className="p-6 space-y-5">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Screen Name</label>
//                   <input
//                     className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-slate-900 focus:ring-0 outline-none transition-colors"
//                     value={editingScreen.screenName || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenName: e.target.value })}
//                     placeholder="e.g. Lobby Reception TV"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Location</label>
//                   <input
//                     className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-slate-900 focus:ring-0 outline-none transition-colors"
//                     value={editingScreen.screenLocation || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenLocation: e.target.value })}
//                     placeholder="e.g. Building A, Floor 1"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Connection ID (Optional)</label>
//                   <input
//                     className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 font-mono text-sm focus:border-slate-900 outline-none"
//                     value={editingScreen.screenCustomId || ''}
//                     onChange={e => setEditingScreen({ ...editingScreen, screenCustomId: e.target.value })}
//                     placeholder="Auto-generated if empty"
//                   />
//                   <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
//                     <Info size={12} /> Enter this ID in the Android App to link the device. (Min 6 chars)
//                   </p>
//                 </div>
//                 <button
//                   onClick={handleSaveScreen}
//                   className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-lg mt-2 transition-transform active:scale-95"
//                 >
//                   Save Screen
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* --- DEPLOY / PODCAST MODAL --- */}
//         {isDeployModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
//               <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-xl flex items-center gap-2"><Play size={24} className="text-green-400" /> Podcast Content</h3>
//                   <p className="text-slate-300 text-sm mt-1">Deploying to <span className="font-bold text-white">{selectedScreens.length}</span> selected screens</p>
//                 </div>
//                 <button onClick={() => setIsDeployModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
//               </div>

//               <div className="p-8 space-y-8">
//                 {/* 1. Select Content */}
//                 <div>
//                   <label className="block text-sm font-bold text-slate-700 mb-2">Select Playlist</label>
//                   <div className="relative">
//                     <select
//                       className="w-full border-2 border-gray-200 rounded-xl p-3 pl-4 bg-white focus:border-slate-900 outline-none appearance-none font-medium text-slate-700 cursor-pointer"
//                       value={deployConfig.playlistId}
//                       onChange={e => setDeployConfig({ ...deployConfig, playlistId: e.target.value })}
//                     >
//                       <option value="">-- Choose Content to Play --</option>
//                       {playlists.map(p => (
//                         <option key={p.id} value={p.id}>{p.name} ({p.itemCount || 0} items)</option>
//                       ))}
//                     </select>
//                     <div className="absolute right-4 top-4 pointer-events-none text-slate-500">▼</div>
//                   </div>
//                 </div>

//                 {/* 2. Select Mode */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <button
//                     onClick={() => setDeployConfig({ ...deployConfig, mode: 'NOW' })}
//                     className={`p-4 rounded-2xl border-2 text-center transition-all group ${deployConfig.mode === 'NOW'
//                       ? 'border-slate-900 bg-slate-50 text-slate-900'
//                       : 'border-gray-200 hover:border-slate-300 text-gray-500'
//                       }`}
//                   >
//                     <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${deployConfig.mode === 'NOW' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
//                       <Play size={24} fill="currentColor" />
//                     </div>
//                     <div className="font-bold">Play Now</div>
//                     <div className="text-xs opacity-70 mt-1">Starts immediately</div>
//                   </button>
//                   <button
//                     onClick={() => setDeployConfig({ ...deployConfig, mode: 'SCHEDULE' })}
//                     className={`p-4 rounded-2xl border-2 text-center transition-all group ${deployConfig.mode === 'SCHEDULE'
//                       ? 'border-slate-900 bg-slate-50 text-slate-900'
//                       : 'border-gray-200 hover:border-slate-300 text-gray-500'
//                       }`}
//                   >
//                     <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${deployConfig.mode === 'SCHEDULE' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
//                       <Calendar size={24} />
//                     </div>
//                     <div className="font-bold">Schedule</div>
//                     <div className="text-xs opacity-70 mt-1">Set Date & Time</div>
//                   </button>
//                 </div>

//                 {/* 3. Dynamic Inputs */}
//                 {deployConfig.mode === 'NOW' ? (
//                   <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
//                     <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Play Until (Optional)</label>
//                     <input
//                       type="time"
//                       className="w-full border-2 border-blue-100 rounded-lg p-2.5 focus:border-slate-900 outline-none"
//                       value={deployConfig.endTime}
//                       onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })}
//                     />
//                     <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
//                       <Info size={12} /> If left blank, it will play for 24 hours.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
//                     <div className="flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 p-2 rounded-lg border border-orange-100">
//                       <AlertTriangle size={14} />
//                       Content downloads now, but plays ONLY during this window.
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
//                         <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, startDate: e.target.value })} />
//                         <input type="time" className="w-full border rounded-lg p-2 mt-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, startTime: e.target.value })} />
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
//                         <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, endDate: e.target.value })} />
//                         <input type="time" className="w-full border rounded-lg p-2 mt-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })} />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   onClick={handleDeploy}
//                   className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
//                 >
//                   <Wifi size={20} /> Confirm Broadcast
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default ScreenPage;
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import {
  Monitor, Plus, Trash2, Edit, Wifi, WifiOff, Calendar,
  Play, Users, X, Check, Clock, AlertTriangle, Info, CheckCircle,
  Loader2, Video, CloudUpload, MonitorPlay
} from 'lucide-react';
import { getAllScreens, saveScreen, deleteScreen, deploySchedule, ScreenData } from '../services/screenService';
import { getAllPlaylists } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- PODCASTING PROGRESS MODAL ---
interface ProgressModalProps {
  isOpen: boolean;
  progress: number;
  stage: string;
  playlistName: string;
}

const PodcastProgressModal: React.FC<ProgressModalProps> = ({ isOpen, progress, stage, playlistName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Animated Icon Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
            <div className="relative z-10 p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg">
              {progress < 85 ? <Video size={40} className="animate-pulse" /> : <CloudUpload size={40} />}
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-1">Broadcasting Content</h3>
          <p className="text-slate-400 text-sm mb-8">Playlist: <span className="text-blue-400 font-semibold">{playlistName}</span></p>

          {/* Progress Track */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-blue-400 font-bold text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> {stage}
              </span>
              <span className="text-white font-mono text-lg">{progress}%</span>
            </div>
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 w-full">
            <p className="text-slate-500 text-xs leading-relaxed uppercase tracking-widest font-medium">
              Puppeteer recording session in progress.<br /> Do not close this tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM ALERT MODAL ---
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
        <div className={`${currentStyle.bg} text-white p-6 flex flex-col items-center justify-center`}>
          <div className="bg-white/20 p-3 rounded-full mb-2">{currentStyle.icon}</div>
          <h3 className="text-xl font-bold uppercase tracking-wider">{type}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-700 font-medium text-lg leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 ${currentStyle.bg} hover:opacity-90`}>Okay</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const ScreenPage: React.FC = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

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

  // Recording Progress State
  const [podcastProgress, setPodcastProgress] = useState({
    isOpen: false,
    value: 0,
    stage: 'Initializing...',
    playlistName: ''
  });

  // Selection & Form State
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [editingScreen, setEditingScreen] = useState<Partial<ScreenData>>({});
  const [deployConfig, setDeployConfig] = useState({
    playlistId: '',
    mode: 'NOW' as 'NOW' | 'SCHEDULE',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // --- Initial Load & Socket ---
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);

    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("💻 Dashboard Connected: ", socket.id);
      socket.emit('join_dashboard');
    });

    // 🎥 Recording Progress Listener
    socket.on('deployment_progress', (data: { progress: number, stage: string }) => {
      setPodcastProgress(prev => ({
        ...prev,
        isOpen: true,
        value: data.progress,
        stage: data.stage
      }));

      if (data.progress === 100) {
        setTimeout(() => {
          setPodcastProgress(prev => ({ ...prev, isOpen: false }));
          showAlert('success', 'Broadcast complete! Screens are updating.');
          loadData();
        }, 2000);
      }
    });

    socket.on('deployment_error', (data: { msg: string }) => {
      setPodcastProgress(prev => ({ ...prev, isOpen: false }));
      showAlert('error', data.msg);
    });

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [screenRes, playlistRes] = await Promise.all([getAllScreens(), getAllPlaylists()]);
      if (screenRes.success) setScreens(screenRes.data || []);
      if (playlistRes.success) setPlaylists(playlistRes.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => setStatusState({ open: true, type, msg });
  const closeAlert = () => setStatusState({ ...statusState, open: false });
  const handleSelectScreen = (id: string) => setSelectedScreens(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSaveScreen = async () => {
    if (!editingScreen.screenName?.trim()) return showAlert('error', "Screen name is required.");
    const res = await saveScreen({ ...editingScreen, userID: user?.id });
    if (res.success) { setIsEditModalOpen(false); loadData(); showAlert('success', 'Screen saved!'); }
    else showAlert('error', res.msg || 'Save failed');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this screen?')) {
      const res = await deleteScreen(id);
      if (res.success) { loadData(); showAlert('success', 'Deleted.'); }
    }
  };

  // 🚀 FIXED DEPLOY LOGIC
  const handleDeploy = async () => {
    if (!deployConfig.playlistId) return showAlert('error', 'Select a playlist.');
    if (selectedScreens.length === 0) return showAlert('error', 'Select a screen.');

    let startISO: string;
    let endISO: string;

    const selectedPlaylist = playlists.find(p => p.id === deployConfig.playlistId);

    try {
      if (deployConfig.mode === 'SCHEDULE') {
        if (!deployConfig.startDate || !deployConfig.startTime || !deployConfig.endDate || !deployConfig.endTime) {
          return showAlert('error', 'All schedule fields are required.');
        }
        startISO = new Date(`${deployConfig.startDate}T${deployConfig.startTime}`).toISOString();
        endISO = new Date(`${deployConfig.endDate}T${deployConfig.endTime}`).toISOString();
        if (new Date(startISO) >= new Date(endISO)) return showAlert('error', 'End must be after start.');
      } else {
        // NOW MODE
        startISO = new Date().toISOString();
        if (deployConfig.endTime) {
          const todayStr = new Date().toISOString().split('T')[0];
          const combined = new Date(`${todayStr}T${deployConfig.endTime}`);
          // If the time already passed today, assume tomorrow
          if (combined < new Date()) combined.setDate(combined.getDate() + 1);
          endISO = combined.toISOString();
        } else {
          // Default to 24h from now
          endISO = new Date(Date.now() + 86400000).toISOString();
        }
      }

      // Open the progress UI immediately
      setPodcastProgress({
        isOpen: true,
        value: 0,
        stage: 'Preparing recording...',
        playlistName: selectedPlaylist?.name || 'Unknown'
      });

      const res = await deploySchedule({
        screenIds: selectedScreens,
        playlistId: deployConfig.playlistId,
        mode: deployConfig.mode,
        startTime: startISO,
        endTime: endISO,
      }, socketRef.current?.id); // Pass socketId for progress tracking

      if (!res.success) {
        setPodcastProgress(prev => ({ ...prev, isOpen: false }));
        showAlert('error', res.msg || 'Deployment failed.');
      } else {
        setIsDeployModalOpen(false);
        setSelectedScreens([]);
      }
    } catch (err) {
      showAlert('error', 'Invalid date/time selection.');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-ivory text-slate-500 font-bold">Loading Screens...</div>;

  return (
    <div className="min-h-screen bg-ivory p-8">
      <div className="max-w-7xl mx-auto">
        <StatusModal isOpen={statusState.open} type={statusState.type} message={statusState.msg} onClose={closeAlert} />

        <PodcastProgressModal
          isOpen={podcastProgress.isOpen}
          progress={podcastProgress.value}
          stage={podcastProgress.stage}
          playlistName={podcastProgress.playlistName}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Monitor className="text-slate-900" size={32} /> Screen Management
            </h1>
            <p className="text-slate-500 mt-1">Deploy visual recordings to your digital signage.</p>
          </div>
          <div className="flex gap-3">
            {selectedScreens.length > 0 && (
              <button
                onClick={() => setIsDeployModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <MonitorPlay size={20} /> Broadcast ({selectedScreens.length})
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map(screen => (
            <div
              key={screen.id}
              onClick={() => handleSelectScreen(screen.id)}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all cursor-pointer group overflow-hidden ${selectedScreens.includes(screen.id) ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-300'}`}
            >
              {selectedScreens.includes(screen.id) && <div className="absolute top-3 right-3 bg-slate-900 text-white rounded-full p-1.5 z-10"><Check size={14} /></div>}
              <div className="p-6">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mb-4 ${screen.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {screen.status === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />} {screen.status}
                </div>
                <h3 className="text-xl font-bold text-slate-800 truncate mb-1">{screen.screenName}</h3>
                <p className="text-slate-500 text-sm mb-6 flex items-center gap-1.5"><Monitor size={16} /> {screen.screenLocation}</p>
                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Status</span><div className="flex items-center gap-1.5 font-semibold text-slate-700"><Users size={14} /> {screen.connectedDevices}</div></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Playing</span><div className="font-semibold text-slate-900 truncate">{screen.tblplaylist?.name || 'Standby'}</div></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">ID: {screen.screenCustomId}</div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingScreen(screen); setIsEditModalOpen(true); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full"><Edit size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(screen.id); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- EDIT MODAL --- */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center"><h3 className="font-bold">Screen Settings</h3><button onClick={() => setIsEditModalOpen(false)}><X size={20} /></button></div>
              <div className="p-6 space-y-5">
                <div><label className="block text-sm font-bold mb-1.5">Name</label><input className="w-full border-2 rounded-xl p-3 outline-none" value={editingScreen.screenName || ''} onChange={e => setEditingScreen({ ...editingScreen, screenName: e.target.value })} /></div>
                <div><label className="block text-sm font-bold mb-1.5">Location</label><input className="w-full border-2 rounded-xl p-3 outline-none" value={editingScreen.screenLocation || ''} onChange={e => setEditingScreen({ ...editingScreen, screenLocation: e.target.value })} /></div>
                <button onClick={handleSaveScreen} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* --- DEPLOY MODAL --- */}
        {isDeployModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                <div><h3 className="font-bold text-xl flex items-center gap-2"><MonitorPlay size={24} className="text-blue-400" /> Broadcast Content</h3><p className="text-slate-400 text-sm">Targeting {selectedScreens.length} devices</p></div>
                <button onClick={() => setIsDeployModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Playlist</label>
                  <select className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white focus:border-slate-900 outline-none font-medium" value={deployConfig.playlistId} onChange={e => setDeployConfig({ ...deployConfig, playlistId: e.target.value })}>
                    <option value="">-- Choose Playlist to Record --</option>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name} ({p.itemCount} items)</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setDeployConfig({ ...deployConfig, mode: 'NOW' })} className={`p-4 rounded-2xl border-2 transition-all ${deployConfig.mode === 'NOW' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-100 text-gray-400'}`}>
                    <Play className="mx-auto mb-2" fill={deployConfig.mode === 'NOW' ? "black" : "none"} />
                    <div className="font-bold">Play Now</div>
                  </button>
                  <button onClick={() => setDeployConfig({ ...deployConfig, mode: 'SCHEDULE' })} className={`p-4 rounded-2xl border-2 transition-all ${deployConfig.mode === 'SCHEDULE' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-100 text-gray-400'}`}>
                    <Calendar className="mx-auto mb-2" />
                    <div className="font-bold">Schedule</div>
                  </button>
                </div>

                {deployConfig.mode === 'NOW' ? (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Play Until (Optional)</label>
                    <input type="time" className="w-full border-2 rounded-xl p-3 outline-none" value={deployConfig.endTime} onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })} />
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><Info size={10} /> Leave blank to play for 24 hours.</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">Start</label><input type="date" className="w-full border rounded-lg p-2 text-sm mb-2" onChange={e => setDeployConfig({ ...deployConfig, startDate: e.target.value })} /><input type="time" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, startTime: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">End</label><input type="date" className="w-full border rounded-lg p-2 text-sm mb-2" onChange={e => setDeployConfig({ ...deployConfig, endDate: e.target.value })} /><input type="time" className="w-full border rounded-lg p-2 text-sm" onChange={e => setDeployConfig({ ...deployConfig, endTime: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                <button onClick={handleDeploy} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                  <CloudUpload size={20} /> Start Broadcast
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