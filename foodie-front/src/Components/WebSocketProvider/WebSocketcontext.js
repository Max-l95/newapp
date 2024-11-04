import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL;
    const authUserString = sessionStorage.getItem("authUser");
    let token;

    if (authUserString) {
      const authUser = JSON.parse(authUserString);
      token = authUser.token;

      const newSocket = io.connect(SOCKET_URL, {
        transports: ['websocket'],
        query: { token }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      console.log('No authUser found in sessionStorage');
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
