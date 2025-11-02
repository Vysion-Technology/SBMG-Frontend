import React from 'react';
import { CreditCard } from 'lucide-react';

const PaymentsContent = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      padding: '40px'
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '60px 80px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: '600px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CreditCard style={{ 
            width: '40px', 
            height: '40px', 
            color: 'white' 
          }} />
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '16px',
          margin: 0
        }}>
          Payment Feature
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#6b7280',
          marginTop: '16px',
          marginBottom: 0
        }}>
          Coming Soon
        </p>
        
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #86efac'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#166534',
            margin: 0
          }}>
            We're working hard to bring you a seamless payment experience. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentsContent;

