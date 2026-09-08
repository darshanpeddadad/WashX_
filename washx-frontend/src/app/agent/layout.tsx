import { AgentProvider } from '@/context/AgentContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WashX Agent Panel',
  description: 'Delivery agent management dashboard',
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentProvider>{children}</AgentProvider>;
}
