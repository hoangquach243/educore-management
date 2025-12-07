import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { User, UserRole } from '../types';
import { X, User as UserIcon, Lock, Save, Mail, Phone, MapPin } from 'lucide-react';
import * as api from '@/src/services/api';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { currentUser, updateUser, updatePassword } = useSchool();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  const [formData, setFormData] = useState<Partial<User>>({
    name: currentUser?.name,
    email: currentUser?.email,
    phone: currentUser?.phone,
    address: currentUser?.address,
    personalEmail: currentUser?.personalEmail,
  });

  const [passData, setPassData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  if (!currentUser) return null;

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, { ...currentUser, ...formData });
    alert("Profile updated successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      alert("New passwords do not match!");
      return;
    }

    try {
      const result = await api.usersAPI.verifyPassword(currentUser.id, passData.current);
      if (!result.valid) {
        alert("Current password is incorrect!");
        return;
      }

      updatePassword(currentUser.id, passData.new);
      alert("Password changed successfully!");
      setPassData({ current: '', new: '', confirm: '' });
    } catch (error) {
      alert("Error verifying password. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-full">
                <UserIcon size={20} />
             </div>
             <div>
                <h3 className="font-bold text-lg">My Profile</h3>
                <p className="text-indigo-100 text-xs uppercase tracking-wider">{currentUser.role}</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
           <button 
             onClick={() => setActiveTab('info')}
             className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             Personal Info
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           >
             Security & Password
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
           {activeTab === 'info' && (
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                    <input 
                      className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">School Email (Read Only)</label>
                    <input 
                      className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.email}
                      disabled
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                className="w-full pl-9 p-2.5 border rounded-lg"
                                value={formData.phone || ''}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder="+84..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Personal Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                className="w-full pl-9 p-2.5 border rounded-lg"
                                value={formData.personalEmail || ''}
                                onChange={e => setFormData({...formData, personalEmail: e.target.value})}
                                placeholder="gmail..."
                            />
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                        <textarea 
                            className="w-full pl-9 p-2.5 border rounded-lg resize-none h-24"
                            value={formData.address || ''}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                 </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-shadow shadow-md">
                       <Save size={18} /> Update Info
                    </button>
                 </div>
              </form>
           )}

           {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Current Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="password"
                            className="w-full pl-9 p-2.5 border rounded-lg"
                            value={passData.current}
                            onChange={e => setPassData({...passData, current: e.target.value})}
                            required
                        />
                    </div>
                 </div>
                 <hr className="border-gray-100" />
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="password"
                            className="w-full pl-9 p-2.5 border rounded-lg"
                            value={passData.new}
                            onChange={e => setPassData({...passData, new: e.target.value})}
                            required
                        />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Confirm New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="password"
                            className="w-full pl-9 p-2.5 border rounded-lg"
                            value={passData.confirm}
                            onChange={e => setPassData({...passData, confirm: e.target.value})}
                            required
                        />
                    </div>
                 </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-shadow shadow-md">
                       <Save size={18} /> Change Password
                    </button>
                 </div>
              </form>
           )}
        </div>
      </div>
    </div>
  );
};