import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const storedUser = JSON.parse(userInfo);
        setUser(storedUser);

        try {
          const config = { headers: { Authorization: `Bearer ${storedUser.token}` } };

          // Fetch profile and subscription status in parallel
          const [profileRes, subRes] = await Promise.allSettled([
            axios.get('/api/auth/profile', config),
            axios.get('/api/payment/subscription', config),
          ]);

          let updatedUser = { ...storedUser };

          if (profileRes.status === 'fulfilled') {
            updatedUser = { ...updatedUser, ...profileRes.value.data };
          }

          if (subRes.status === 'fulfilled') {
            updatedUser = {
              ...updatedUser,
              subscription: subRes.value.data,
              aiCredits: subRes.value.data.aiCredits ?? updatedUser.aiCredits,
            };
          }

          setUser(updatedUser);
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));

        } catch (error) {
          console.error('Session expired or sync failed');
          if (error.response?.status === 401) logout();
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Immediately refresh to fetch subscription tier
      await refreshUser();
      return data;
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Register Error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const refreshUser = async () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return;
    const storedUser = JSON.parse(userInfo);
    try {
      const config = { headers: { Authorization: `Bearer ${storedUser.token}` } };
      const [profileRes, subRes] = await Promise.allSettled([
        axios.get('/api/auth/profile', config),
        axios.get('/api/payment/subscription', config),
      ]);

      let updatedUser = { ...storedUser };
      if (profileRes.status === 'fulfilled') updatedUser = { ...updatedUser, ...profileRes.value.data };
      if (subRes.status === 'fulfilled') {
        updatedUser = {
          ...updatedUser,
          subscription: subRes.value.data,
          aiCredits: subRes.value.data.aiCredits ?? updatedUser.aiCredits,
        };
      }

      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Refresh User failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
