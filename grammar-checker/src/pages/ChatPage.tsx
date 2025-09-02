import React from 'react';
import Layout from '../components/Layout';
import SimpleChatPage from '../components/SimpleChatPage';

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)]">
        <SimpleChatPage />
      </div>
    </Layout>
  );
};

export default ChatPage;