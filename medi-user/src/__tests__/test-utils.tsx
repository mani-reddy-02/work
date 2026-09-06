import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreferencesProvider } from '../lib/PreferencesContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions,
) => {
  const { initialEntries = ['/'], ...rest } = options || {};
  return render(ui, {
    wrapper: ({ children }) => (
      <PreferencesProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </PreferencesProvider>
    ),
    ...rest,
  });
};

export * from '@testing-library/react';
export { customRender as render };
