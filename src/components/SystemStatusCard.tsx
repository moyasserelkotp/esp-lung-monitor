import { Check } from "lucide-react";

export default function SystemStatusCard() {
  return (
    <div style={{
      background: '#Edf7ec', 
      borderRadius: '24px',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      position: 'relative',
      margin: '0 20px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>System Status</span>
        <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>Normal</span>
      </div>
      
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
      }}>
        <Check size={24} strokeWidth={3} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '20px',
        fontSize: '11px',
        color: '#6b7280',
        fontWeight: 500
      }}>
        Last update: 09:41:23 AM
      </div>
    </div>
  );
}
