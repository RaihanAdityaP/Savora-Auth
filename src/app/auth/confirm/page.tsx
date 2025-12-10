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

  // Fungsi untuk membuka aplikasi Savora dengan Deep Link saja
  const openSavoraApp = () => {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    // Deep Link saja (tanpa Universal Link)
    const deepLink = 'savora://home';
    
    if (isAndroid) {
      // ANDROID: Coba buka dengan deep link
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      
      // Hapus iframe setelah 500ms
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 500);
      
      // Track jika app berhasil dibuka
      let appOpened = false;
      let blurTime = 0;
      
      const onBlur = () => {
        blurTime = Date.now();
        appOpened = true;
      };
      
      const onFocus = () => {
        const focusTime = Date.now();
        if (focusTime - blurTime > 100) {
          appOpened = true;
        }
      };
      
      const onVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
        }
      };
      
      window.addEventListener('blur', onBlur);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibilityChange);
      
      // Setelah 2 detik, cek apakah app terbuka
      setTimeout(() => {
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        
        // Jika app tidak terbuka, tampilkan pesan
        if (!appOpened && !document.hidden) {
          setMessage('App tidak terdeteksi. Pastikan Savora sudah terinstall.');
        }
      }, 2000);
      
    } else if (isIOS) {
      // iOS: Coba buka dengan deep link
      window.location.href = deepLink;
      
      // Fallback jika app tidak terbuka setelah 2 detik
      setTimeout(() => {
        setMessage('App tidak terdeteksi. Pastikan Savora sudah terinstall.');
      }, 2000);
      
    } else {
      // Desktop/Other: Tampilkan pesan
      setMessage('Buka aplikasi Savora di perangkat mobile Anda.');
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
              <p className="text-sm text-gray-500 mb-2">
                Membuka aplikasi Savora dalam {countdown} detik...
              </p>
              <button
                onClick={openSavoraApp}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Buka Aplikasi Sekarang
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Jika aplikasi tidak terbuka otomatis,<br/>
                pastikan Savora sudah terinstall di perangkat Anda.
              </p>
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