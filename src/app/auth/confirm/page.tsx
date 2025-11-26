'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memverifikasi email Anda...');
  const [countdown, setCountdown] = useState(3);
  
  const supabase = createClientComponentClient();

  // Fungsi untuk membuka aplikasi Savora
  const openSavoraApp = () => {
    // Deteksi Android
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Deep Link untuk APK Android (ganti sesuai deep link app)
    const deepLink = 'savora://home/';
    
    // Web fallback - akan dibuka di browser
    const webUrl = 'https://savora-nine.vercel.app/';
    
    if (isAndroid) {
      // Coba buka APK pakai deep link
      window.location.href = deepLink;
      
      // Jika APK tidak terinstall, buka web setelah 1.5 detik
      setTimeout(() => {
        if (document.hidden) return; // Jika APK terbuka, jangan lanjut
        window.location.href = webUrl;
      }, 1500);
    } else {
      // Bukan Android (Desktop/Tablet): langsung buka web
      window.location.href = webUrl;
    }
  };

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!token_hash || type !== 'email') {
        setStatus('error');
        setMessage('Link verifikasi tidak valid');
        return;
      }

      try {
        // Verifikasi token
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Gagal memverifikasi email');
          return;
        }

        // Berhasil
        setStatus('success');
        setMessage('Email berhasil diverifikasi!');

      } catch (error) {
        setStatus('error');
        setMessage('Terjadi kesalahan. Silakan coba lagi.');
      }
    };

    confirmEmail();
  }, [searchParams, supabase]);

  // Countdown dan redirect ke Savora App
  useEffect(() => {
    if (status === 'success') {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Buka aplikasi Savora setelah countdown selesai
        openSavoraApp();
      }
    }
  }, [status, countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <div>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Memverifikasi...
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Verifikasi Berhasil!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Membuka aplikasi Savora dalam {countdown} detik...
              </p>
              <button
                onClick={openSavoraApp}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Buka Sekarang
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Verifikasi Gagal
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}