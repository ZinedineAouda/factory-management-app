import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import { theme } from './theme';
import AppRoutes from './routes/AppRoutes';
import { loadStoredAuth } from './store/slices/authSlice';

const App: React.FC = () => {
  useEffect(() => {
    // Load stored authentication on app start
    store.dispatch(loadStoredAuth() as any);
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;

