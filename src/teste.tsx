import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaImage } from 'react-icons/fa';
import io from 'socket.io-client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import './Chat.css';
import { IoReloadOutline } from 'react-icons/io5';

const socket = io('https://chat-wp5o.onrender.com', {
  transports: ['websocket'],
});

const Chat = () => {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenCA, setTokenCA] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [pumpLink, setPumpLink] = useState('');
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch data from the API when the component mounts
    fetch('https://apitoreturnca.onrender.com/api/purchaseData', {
      headers: {
        'x-access-key': 'A1qQaAA9kdfnn4Mmn44bpoieIYHKkdghFKUD1978563llakLLLKdfslphgarcorc3haeogmmMNn243wf',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setTokenName(data.tokenName);
        setTelegramLink(data.telegramLink);
        setTwitterLink(data.twitterLink);
        setTokenCA(data.tokenCA);
        setPumpLink(data.link);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  const generateRandomNickname = () => {
    const randomNumbers = Math.floor(10000 + Math.random() * 90000);
    return `user${randomNumbers}`;
  };

  const joinChat = (storedNickname) => {
    const nick = storedNickname || generateRandomNickname();
    socket.emit('join', nick);
    setNickname(nick);
    localStorage.setItem('nickname', nick);

    socket.on('previousMessages', (previousMessages) => {
      setMessages(previousMessages);
    });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('userList', (userList) => {
      setUserCount(userList.length);
    });
  };

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      joinChat(storedNickname);
    } else {
      joinChat();
    }

    return () => {
      socket.off('previousMessages');
      socket.off('message');
      socket.off('userList');
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const uploadImageToFirebase = async (imageFile) => {
    try {
      const uniqueName = `${Date.now()}-${imageFile.name}`;
      const imageRef = ref(storage, `images/${uniqueName}`);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);
      return imageUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao enviar a imagem. Por favor, tente novamente.');
      return null;
    }
  };

  const sendMessage = async () => {
    let imageUrl = null;

    if (image) {
      setLoading(true);
      imageUrl = await uploadImageToFirebase(image);
      setLoading(false);
      if (!imageUrl) {
        return;
      }
    }

    if (message.trim() || imageUrl) {
      const newMessage = {
        text: message.trim(),
        image: imageUrl,
        sender: nickname,
        timestamp: new Date(),
      };
      socket.emit('message', newMessage);
      setMessage('');
      setImage(null);
      setImagePreview(null);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleCopyTokenCA = () => {
    navigator.clipboard.writeText(tokenCA).then(() => {
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-box window">
        <div className="title-bar">
          <div className="title-bar-text">
            <div className="tokenName">✨ {tokenName} ✨</div>
            <div
              className="tokenCA"
              onClick={handleCopyTokenCA}
              style={{ cursor: 'pointer' }}
            >
              CA: {tokenCA}
            </div>
            {showCopyMessage && (
              <div className="copy-message">CA copiado para a área de transferência!</div>
            )}
            <div className="tokenLinks">
              ✨{' '}
              <a target="_blank" href={twitterLink} rel="noreferrer">
                Twitter/X
              </a>{' '}
              {' '}
              <a target="_blank" href={pumpLink} rel="noreferrer">
                PumpFun
              </a>{' '}
              {' '}
              <a target="_blank" href={telegramLink} rel="noreferrer">
                Telegram
              </a>{' '}
              ✨
            </div>
          </div>
        </div>
        <div className="window-body chat-messages">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.sender === nickname ? 'my-message' : ''
                }`}
              >
                <div className="message-content">
                  {msg.sender !== nickname && (
                    <div className="message-nickname">{msg.sender}</div>
                  )}
                  {msg.image && (
                    <img src={msg.image} alt="img" className="message-image" />
                  )}
                  {msg.text && <div className="message-text">{msg.text}</div>}
                </div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="status-bar env">
          <label htmlFor="image-upload" className="image-upload-label">
            <FaImage size={16} />
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {imagePreview && (
            <div className="image-preview">
              <img
                src={imagePreview}
                alt="Preview"
                className="message-image-preview"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Write a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <button onClick={sendMessage} disabled={loading}>
            {loading ? (
              <IoReloadOutline className="load" size={16} />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;