'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Agent {
  id: string; name: string; email: string;
  phone: string; role: string; city: string;
  dailyOrdersClaimed?: number;
}

interface AgentContextType {
  agent: Agent | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('washx_agent_token');
    const a = localStorage.getItem('washx_agent');
    if (t && a) { setToken(t); setAgent(JSON.parse(a)); }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/agent/login`, { email, password });
    const { token: t, agent: a } = res.data;
    localStorage.setItem('washx_agent_token', t);
    localStorage.setItem('washx_agent', JSON.stringify(a));
    setToken(t); setAgent(a);
  };

  const logout = () => {
    localStorage.removeItem('washx_agent_token');
    localStorage.removeItem('washx_agent');
    setToken(null); setAgent(null);
  };

  return (
    <AgentContext.Provider value={{ agent, token, login, logout, isLoading }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be inside AgentProvider');
  return ctx;
}
