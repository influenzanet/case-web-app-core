/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import ContentRenderer from '../../src/components/pages/components/ContentRenderer';
import appReducer from '../../src/store/appSlice';
import { PageRow } from '../../src/types/pagesConfig';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const Echo: React.FC<{ type?: string; label?: string }> = (props) => (
  <div>{`echo ${props.type} ${props.label ?? ''}`}</div>
);

const rowWith = (config: object): PageRow[] => [
  {
    key: 'row',
    columns: [{ key: 'col', items: [{ itemKey: 'ext', config } as any] }],
  },
];

const renderRows = (rows: PageRow[]) =>
  render(
    <Provider store={configureStore({ reducer: { app: appReducer } })}>
      <MemoryRouter>
        <ContentRenderer
          isAuthenticated={true}
          rows={rows}
          pageKey="home"
          defaultRoutes={{} as any}
          extensions={[{ name: 'echo', component: Echo }]}
        />
      </MemoryRouter>
    </Provider>
  );

describe('ContentRenderer extension items', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it('finds the extension named by the inner config type and passes the config as props', () => {
    renderRows(rowWith({ type: 'extension', config: { type: 'echo', label: 'hello' } }));
    expect(screen.getByText('echo echo hello')).toBeInTheDocument();
  });

  it('renders nothing, without throwing, when the item has no inner config', () => {
    const { container } = renderRows(rowWith({ type: 'extension' }));
    expect(container).not.toHaveTextContent('echo');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Extension item config is invalid'));
  });

  it('renders nothing when no extension has that name', () => {
    const { container } = renderRows(rowWith({ type: 'extension', config: { type: 'missing' } }));
    expect(container).not.toHaveTextContent('echo');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No extension found with name: missing'));
  });
});
