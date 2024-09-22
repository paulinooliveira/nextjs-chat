import React from 'react';

interface MessageProps {
  content: string;
}

export const BotMessage: React.FC<MessageProps> = ({ content }) => (
  <div className="bot-message">{content}</div>
);

export const UserMessage: React.FC<MessageProps> = ({ content }) => (
  <div className="user-message">{content}</div>
);