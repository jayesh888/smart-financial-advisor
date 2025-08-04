import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './ChatBox.module.css';
import { FiSend } from 'react-icons/fi';

function ChatBox({ email }) {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newHistory = [...chatHistory, { from: 'user', text: userMessage }];
    setChatHistory(newHistory);
    setUserMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5000/chat', {
        email,
        message: userMessage
      });

      setChatHistory([
        ...newHistory,
        { from: 'agent', text: response.data.response }
      ]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        { from: 'agent', text: "Something went wrong." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatboxContainer}>
      <div className={styles.header}>Ask the Investment Agent</div>

      <div className={styles.chatHistory}>
        {chatHistory.length === 0 ? (
          <div className={styles.placeholderIcon}></div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.from === 'user' ? styles.userMessage : styles.agentMessage
              }
            >
              {msg.text}
            </div>
          ))
        )}

        {isTyping && <div className={styles.typingIndicator}>Agent is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className={styles.inputForm}>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your financial question..."
        />
        <button type="submit" className={styles.sendButton} title="Send">
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
