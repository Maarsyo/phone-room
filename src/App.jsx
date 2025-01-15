import React, { useState, useRef, useEffect, useCallback  } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

const socket = io("https://chat-wp5o.onrender.com", {
  transports: ["websocket"],
});
import { FaPaperPlane, FaImage } from "react-icons/fa";
import io from "socket.io-client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase/firebase";
// Ícones
import { FaSignal, FaPhoneAlt } from "react-icons/fa";
import {
  IoIosCall,
  IoIosContacts,
  IoIosKeypad,
  IoIosStar,
  IoIosClock
} from "react-icons/io";
import { IoBatteryFullOutline, IoGameController } from "react-icons/io5";
import { IoIosSettings, IoIosArrowBack } from "react-icons/io";
import { TbPrompt } from "react-icons/tb";
import { LuMessageCircle } from "react-icons/lu";
import { FaBolt, FaSyncAlt, FaCamera } from "react-icons/fa";  // Adicione se não tiver



import "./App.css";

/**
 * Modelo 3D de fundo (opcional).
 */
function BackgroundModel({ rotationY, positionY }) {
  const { scene } = useGLTF("/late_night_office.glb");
  return (
    <primitive
      object={scene}
      scale={[1, 1, 1]}
      rotation={[0, rotationY, 0]}
      position={[0, positionY, 0]}
    />
  );
}
function SnakeGame({ onBack }) {
  const GRID_SIZE = 20;
  const CELL_SIZE = 15;
  const INITIAL_SPEED = 150;

  const [snake, setSnake] = useState([[5, 5]]);
  const [food, setFood] = useState([10, 10]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback(() => {
    return [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE)
    ];
  }, []);

  const isOnSnake = useCallback((pos) => {
    return snake.some(segment => segment[0] === pos[0] && segment[1] === pos[1]);
  }, [snake]);

  const getNewFoodPosition = useCallback(() => {
    let newFood;
    do {
      newFood = generateFood();
    } while (isOnSnake(newFood));
    return newFood;
  }, [generateFood, isOnSnake]);

  const resetGame = () => {
    setSnake([[5, 5]]);
    setFood(getNewFoodPosition());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      const newSnake = [...snake];
      const head = [...newSnake[0]];

      switch (direction) {
        case 'UP':
          head[1] -= 1;
          break;
        case 'DOWN':
          head[1] += 1;
          break;
        case 'LEFT':
          head[0] -= 1;
          break;
        case 'RIGHT':
          head[0] += 1;
          break;
        default:
          break;
      }

      if (
        head[0] < 0 ||
        head[0] >= GRID_SIZE ||
        head[1] < 0 ||
        head[1] >= GRID_SIZE ||
        isOnSnake(head)
      ) {
        setGameOver(true);
        return;
      }

      newSnake.unshift(head);

      if (head[0] === food[0] && head[1] === food[1]) {
        setFood(getNewFoodPosition());
        setScore(prev => prev + 10);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const gameInterval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(gameInterval);
  }, [snake, direction, food, gameOver, isPaused, getNewFoodPosition, isOnSnake]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    const dx = touchX - centerX;
    const dy = touchY - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && direction !== 'LEFT') setDirection('RIGHT');
      if (dx < 0 && direction !== 'RIGHT') setDirection('LEFT');
    } else {
      if (dy > 0 && direction !== 'UP') setDirection('DOWN');
      if (dy < 0 && direction !== 'DOWN') setDirection('UP');
    }
  };

  return (
    <div 
      className="w-full h-full bg-black flex flex-col items-center" 
      onTouchStart={handleTouchStart}
    >
      <div className="flex justify-between items-center w-full p-4">
        <button onClick={onBack} className="text-white">
          <IoIosArrowBack size={24} />
        </button>
        <div className="text-yellow-400">Score: {score}</div>
        <button 
          onClick={() => setIsPaused(prev => !prev)}
          className="text-white px-2 py-1 rounded"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div 
        className="relative border-2 border-gray-700"
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE 
        }}
      >
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: food[0] * CELL_SIZE,
            top: food[1] * CELL_SIZE,
          }}
        />

        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-500"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment[0] * CELL_SIZE,
              top: segment[1] * CELL_SIZE,
              borderRadius: index === 0 ? '4px' : '0',
            }}
          />
        ))}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <div className="text-red-500 text-2xl mb-4">Game Over!</div>
          <div className="text-yellow-400 mb-4">Score: {score}</div>
          <button
            onClick={resetGame}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Play Again
          </button>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="text-white text-2xl">Paused</div>
        </div>
      )}
    </div>
  );
}

/**
 * Controles de câmera (opcional).
 */
function CameraControls() {
  return (
    <OrbitControls
      enablePan
      enableZoom
      enableRotate
      minDistance={0}
      maxDistance={1}
      minAzimuthAngle={-Math.PI / 4.5}
      maxAzimuthAngle={Math.PI / 4.5}
    />
  );
}

/**
 * Exemplos de componentes dos aplicativos que aparecem dentro da tela do celular.
 */ function ChatAIApp({ onBack }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Olá! Como posso ajudar?" },
  ]);
  const [inputValue, setInputValue] = useState("");

  // Simulação de resposta
  const respostas = [
    "Claro, vamos lá!",
    "Pode me dizer mais?",
    "Interessante, fale mais!",
    "Vamos continuar.",
    "Ainda não compreendi, pode reformular?",
  ];

  function gerarRespostaAleatoria() {
    const index = Math.floor(Math.random() * respostas.length);
    return respostas[index];
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    // Mensagem do usuário
    const userMsg = { role: "user", text: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Resposta da IA, simulando delay
    setTimeout(() => {
      const aiMsg = { role: "ai", text: gerarRespostaAleatoria() };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  // Enviar com Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="app-content chat-app-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role === "user" ? "user" : "ai"}`}
          >
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Digite sua mensagem..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="chat-send-button" onClick={handleSendMessage}>
          Enviar
        </button>
      </div>

      <button onClick={onBack} className="back-button">
        <IoIosArrowBack />
      </button>
    </div>
  );
}

function MessagerApp({ onBack }) {
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenCA, setTokenCA] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [pumpLink, setPumpLink] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    // Fetch data from the API when the component mounts
    fetch("https://apitoreturnca.onrender.com/api/purchaseData", {
      headers: {
        "x-access-key":
          "A1qQaAA9kdfnn4Mmn44bpoieIYHKkdghFKUD1978563llakLLLKdfslphgarcorc3haeogmmMNn243wf",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
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
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const generateRandomNickname = () => {
    const randomNumbers = Math.floor(10000 + Math.random() * 90000);
    return `user${randomNumbers}`;
  };
  const joinChat = (storedNickname) => {
    const nick = storedNickname || generateRandomNickname();
    socket.emit("join", nick);
    setNickname(nick);
    localStorage.setItem("nickname", nick);

    socket.on("previousMessages", (previousMessages) => {
      setMessages(previousMessages);
    });

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("userList", (userList) => {
      setUserCount(userList.length);
    });
  };
  useEffect(() => {
    const storedNickname = localStorage.getItem("nickname");
    if (storedNickname) {
      joinChat(storedNickname);
    } else {
      joinChat();
    }

    return () => {
      socket.off("previousMessages");
      socket.off("message");
      socket.off("userList");
    };
  }, []);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao enviar a imagem. Por favor, tente novamente.");
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
      socket.emit("message", newMessage);
      setMessage("");
      setImage(null);
      setImagePreview(null);
    }
  };
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
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
        <button onClick={onBack} className="back-button">
          <IoIosArrowBack />
        </button>
        <div className="window-body chat-messages">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.sender === nickname ? "my-message" : ""
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
            style={{ display: "none" }}
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
            {loading ? <IoReloadOutline className="load" size={16} /> : "Send"}
          </button>
        </div>
        
      </div>
    </div>
  );
}

/***************************************************************************
 * COPIE E COLE ESTE BLOCO NO LUGAR DO SEU "function PhoneApp({ onBack })"
 ***************************************************************************/
function PhoneApp({ onBack }) {
  const [currentTab, setCurrentTab] = React.useState("favorites");

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "favorites":
        return <FavoritesTab />;
      case "recents":
        return <RecentsTab />;
      case "contacts":
        return <ContactsTab />;
      case "keypad":
        return <KeypadTab />;
      default:
        return <FavoritesTab />;
    }
  };

  return (
    <div className="phone-app-container">
      {/* Cabeçalho do app Phone */}
      <div className="phone-header">
        <button onClick={onBack} className="back-button">
          <IoIosArrowBack />
        </button>
        {/* Espaço à direita (opcional) */}
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Conteúdo (aba selecionada) */}
      <div className="phone-body-content">{renderTabContent()}</div>

      {/* Fixed navigation bar */}
      <div className="phone-nav-bar">
        <div
          className={`phone-nav-item ${currentTab === "favorites" ? "active" : ""}`}
          onClick={() => handleTabChange("favorites")}
        >
          <IoIosStar size={24} />
          <span>Favorites</span>
        </div>
        <div
          className={`phone-nav-item ${currentTab === "recents" ? "active" : ""}`}
          onClick={() => handleTabChange("recents")}
        >
          <IoIosClock size={24} />
          <span>Recents</span>
        </div>
        <div
          className={`phone-nav-item ${currentTab === "contacts" ? "active" : ""}`}
          onClick={() => handleTabChange("contacts")}
        >
          <IoIosContacts size={24} />
          <span>Contacts</span>
        </div>
      </div>
    </div>
  );
}

/* ========== Abas (somente interface) ========== */

// Aba Favorites
function FavoritesTab() {
  return (
    <div className="tab-content">
      <h2 className="tab-title">Favorites</h2>
      <p>You have no favorites yet.</p>
    </div>
  );
}

// Aba Recents
function RecentsTab() {
  return (
    <div className="tab-content">
      <h2 className="tab-title">Recents</h2>
      <p>No recent calls.</p>
    </div>
  );
}

// Alguns contatos de exemplo
const contactsData = [
  { id: 1, name: "Elon Musk", phone: "(415) 555-0123" },
  { id: 2, name: "Anatoly Yakovenko", phone: "(650) 555-0456" },
  { id: 3, name: "Donald Trump", phone: "(212) 555-0789" }
];
// Aba Contacts
function ContactsTab() {
  return (
    <div className="tab-content contacts-tab">
      <h2 className="tab-title">Contacts</h2>
      {contactsData.map((contact) => (
        <div key={contact.id} className="contact-item">
          <div className="contact-info">
            <div className="contact-name">{contact.name}</div>
            <div className="contact-phone">{contact.phone}</div>
          </div>
          <button className="call-button">
            {/* Apenas ilustrativo (não faz chamada) */}
            <FaPhoneAlt />
          </button>
        </div>
      ))}
    </div>
  );
}

// Aba Keypad
function KeypadTab() {
  const [number, setNumber] = React.useState("");

  const handleDigitClick = (digit) => {
    setNumber((prev) => prev + digit);
  };

  const handleClear = () => {
    setNumber("");
  };

  return (
    <div className="tab-content keypad-tab">
      <h2 className="tab-title">Keypad</h2>
      <div className="keypad-display">{number || "Digite um número"}</div>
      <div className="keypad-grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
          <button
            key={digit}
            className="keypad-button"
            onClick={() => handleDigitClick(digit)}
          >
            {digit}
          </button>
        ))}
      </div>
      <div className="keypad-controls">
        {/* Botão verde (simulação) */}
        <button className="call-button-green">
          <IoIosCall size={24} />
        </button>
        {/* Botão de limpar */}
        <button className="call-button-red" onClick={handleClear}>
          Limpar
        </button>
      </div>
    </div>
  );
}
/***************************************************************************
 * FIM DO BLOCO A SER COPIADO E COLADO NO LUGAR DO ANTIGO "PhoneApp"        *
 ***************************************************************************/



function CameraApp({ onBack }) {
  return (
    <div className="camera-app-container">
      {/* Barra superior com botão de voltar e flash */}
      <div className="camera-top-bar">
        <button className="camera-close-button" onClick={onBack}>
          <IoIosArrowBack />
        </button>
        <button className="camera-flash-button">
          <FaBolt />
        </button>
      </div>

      {/* Área de preview da câmera (apenas ilustrativa) */}
      <div className="camera-preview">
        <img src="/background.png" alt="" />
      </div>

      {/* Barra inferior com botões de alternar câmera, disparo, etc. */}
      <div className="camera-bottom-bar">
        <button className="camera-toggle-button">
          <FaSyncAlt />
        </button>

        <div className="camera-shutter-button" />

        <button className="camera-mode-button">
          <FaCamera />
        </button>
      </div>
    </div>
  );
}

function SettingsApp({ onBack }) {
  return (
    <div className="app-content">
      <h2>Settings App</h2>
      <p>Conteúdo de Configurações...</p>
      <button onClick={onBack}>Voltar</button>
    </div>
  );
}

function GameApp({ onBack }) {
  return (
    <div className="app-content">
      <h2>Game App</h2>
      <p>Conteúdo do Jogo...</p>
      <button onClick={onBack}>Voltar</button>
    </div>
  );
}

/**
 * Aqui definimos a "Tela do Celular" que alterna entre o menu de apps
 * e o conteúdo do app selecionado.
 */
function PhoneScreen({ openApp, setOpenApp }) {
  if (!openApp) {
    return (
      <div className="apps">
        <div className="column">
          <div className="app" onClick={() => setOpenApp("messager")}>
            <div className="icon messager">
              <LuMessageCircle style={{ fontSize: "45px" }} />
            </div>
            <h1>Messager</h1>
          </div>
          <div className="app" onClick={() => setOpenApp("phone")}>
            <div className="icon">
              <FaPhoneAlt style={{ fontSize: "35px" }} />
            </div>
            <h1>Phone</h1>
          </div>
          <div className="app" onClick={() => setOpenApp("snake")}>
            <div className="icon">
              <IoGameController style={{ fontSize: "35px", color: "#4ade80" }} />
            </div>
            <h1>Snake</h1>
          </div>
        </div>
        <div className="column">
          <div className="app" onClick={() => setOpenApp("camera")}>
            <div className="icon chat">
              <FaCamera style={{ fontSize: "35px" }} />
            </div>
            <h1>Camera</h1>
          </div>
          <div className="app" onClick={() => setOpenApp("settings")}>
            <div className="icon">
              <IoIosSettings style={{ fontSize: "45px" }} />
            </div>
            <h1>Settings</h1>
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setOpenApp(null);
  };

  switch (openApp) {
    case "messager":
      return <MessagerApp onBack={handleBack} />;
    case "phone":
      return <PhoneApp onBack={handleBack} />;
    case "camera":
      return <CameraApp onBack={handleBack} />;
    case "settings":
      return <SettingsApp onBack={handleBack} />;
    case "snake":
      return <SnakeGame onBack={handleBack} />;
    default:
      return null;
  }
}


export default function App() {
  const [rotationY, setRotationY] = useState(2.7);
  const [positionY, setPositionY] = useState(-1.5);
  const [openApp, setOpenApp] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // Add time update effect
  useEffect(() => {
    const updateTime = () => {
      const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false,
        timeZone: 'America/New_York'
      };
      const nyTime = new Date().toLocaleTimeString('en-US', options);
      setCurrentTime(nyTime);
    };

    // Update immediately
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Canvas camera={{ position: [0, 0, 10] }} style={{ background: "black" }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Environment preset="city" />
        <BackgroundModel rotationY={rotationY} positionY={positionY} />
        <CameraControls />
      </Canvas>

      <div className="phone">
        <div className="container-phone">
          <div className="top-header">
            <img src="/fruit.png" alt="" />
          </div>
          <div className="phone-infos">
            <div className="left">
              <FaSignal />
            </div>
            <div className="mid">
              <h1>{currentTime}</h1>
            </div>
            <div className="right">
              <IoBatteryFullOutline />
            </div>
          </div>

          <div className="phone-body">
            <PhoneScreen openApp={openApp} setOpenApp={setOpenApp} />
          </div>
        </div>
      </div>
    </div>
  );
}