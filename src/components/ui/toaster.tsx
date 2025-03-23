import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * A custom toast notification component based on react-hot-toast
 */
export function Toaster() {
  return (
    <HotToaster
      position="bottom-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default toast options
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          maxWidth: '350px',
        },
        
        // Toast type-specific options
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981', // green-500
            secondary: 'white',
          },
          style: {
            background: '#065f46', // green-800
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444', // red-500
            secondary: 'white',
          },
          style: {
            background: '#991b1b', // red-800
            color: '#fff',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#1e293b', // slate-800
            color: '#fff',
          },
        },
      }}
    />
  );
}
