'use client';
import { Suspense } from 'react';
import ChatContent from './ChatContent';

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#03050a',display:'flex',alignItems:'center',justifyContent:'center',color:'#4d6b8a',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}