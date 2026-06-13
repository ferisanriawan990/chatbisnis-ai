'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCircle, Camera, Lock, Mail, User, Save, UploadCloud } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/dashboard/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.user.name || '',
          email: data.user.email || '',
          avatar: data.user.avatar || '',
        });
      }
    } catch (e) {
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    toast.loading('Menyimpan perubahan...', { id: 'update' });
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          avatar: profile.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Profil berhasil diperbarui', { id: 'update' });
      // Trigger a session update event so the layout re-reads the avatar if needed
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan profil', { id: 'update' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setSubmitting(true);
    toast.loading('Mengganti password...', { id: 'password' });
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Password berhasil diganti', { id: 'password' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengganti password', { id: 'password' });
    } finally {
      setSubmitting(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export as JPEG with 80% quality to save DB space
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    try {
      const base64Avatar = await compressImage(file);
      setProfile({ ...profile, avatar: base64Avatar });
    } catch (e) {
      toast.error('Gagal memproses gambar');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat profil...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-1">Kelola informasi identitas dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Avatar & Info Pribadi */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-md">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-16 h-16 text-slate-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                  <p className="text-slate-500 text-sm">Super Admin</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" /> Ubah Foto
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      className="pl-10 w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Masukkan nama lengkap" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Email (Read-only)</label>
                  <div className="relative opacity-60 cursor-not-allowed">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      disabled
                      value={profile.email}
                      className="pl-10 w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Password */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleUpdatePassword} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900">Ubah Password</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Saat Ini</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input 
                  type="password" 
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                <input 
                  type="password" 
                  required
                  minLength={8}
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm" 
                />
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-200">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                Ganti Password
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
