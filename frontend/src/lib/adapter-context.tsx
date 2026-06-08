import React, { createContext, useContext } from 'react';
import type { IOAdapter } from './io-adapter';
import { WebIOAdapter } from './web-adapter';

const AdapterContext = createContext<IOAdapter>(new WebIOAdapter());

export function AdapterProvider({
  adapter,
  children,
}: {
  adapter: IOAdapter;
  children: React.ReactNode;
}) {
  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdapter(): IOAdapter {
  return useContext(AdapterContext);
}
