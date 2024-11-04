import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
  postSocialLogin,
} from "../../../helpers/fakebackend_helper";
import {
  loginSuccess,
  logoutUserSuccess,
  apiError,
  reset_login_flag
} from './reducer';
import io from 'socket.io-client';

// Constants
const SOCKET_URL = process.env.REACT_APP_API_URL; // WebSocket server URL

// WebSocket connection variable
let socket;

// Function to connect to WebSocket server
export const connectSocket = (token) => {
  if (socket) {
    // If a socket connection already exists, disconnect it
    socket.disconnect();
  }

  socket = io.connect(SOCKET_URL, {
    transports: ['websocket'],
    query: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('tables_updated', (data) => {
    console.log('Tables updated:', data);
    // Handle incoming data as needed
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  // Return the socket instance if needed elsewhere
  return socket;
};

// Function to get the current socket instance
export const getSocket = () => socket;

// Login User Function
export const loginUser = (user, history) => async (dispatch) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.loginUser(user.email, user.password);
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      response = postJwtLogin({
        email: user.email,
        password: user.password
      });
    } else if (process.env.REACT_APP_DEFAULTAUTH) {
      response = postFakeLogin({
        email: user.email,
        password: user.password,
      });
    }

    const data = await response;

    if (data) {
      // Save the JWT token to sessionStorage
      sessionStorage.setItem("authUser", JSON.stringify(data));

      dispatch(loginSuccess(data));

      console.log(data)

      history('/dashboard');

      // Establish WebSocket connection after successful login
      connectSocket(data.token);
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

// Logout User Function
export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");

    if (socket) {
      socket.disconnect();
      console.log("Disconnected from WebSocket server");
    }

    let fireBaseBackend = getFirebaseBackend();
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = fireBaseBackend.logout();
      dispatch(logoutUserSuccess(response));
    } else {
      dispatch(logoutUserSuccess(true));
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

// Social Login Function
export const socialLogin = (type, history) => async (dispatch) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }

    const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(socialdata));
      dispatch(loginSuccess(socialdata));
      history('/dashboard');

      // Establish WebSocket connection after successful social login
      connectSocket(socialdata.token);
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

// Reset Login Flag Function
export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
