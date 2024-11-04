import React from 'react';
import './assets/scss/themes.scss';
import Route from './Routes'; // Import routes
import { WebSocketProvider } from './Components/WebSocketProvider/WebSocketcontext';

function App() {
  return (
    <React.Fragment>
      <WebSocketProvider>
        <Route />
      </WebSocketProvider>
    </React.Fragment>
  );
}

export default App;
