import { render, screen, fireEvent, act } from './test-utils';
import { expect, test, describe, beforeEach } from 'vitest';
import ProfilePreferences from '../pages/ProfilePreferences';
import Translator from '../components/Translator';
import React from 'react';

describe('Preferences Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('changes language and persists to local storage', async () => {
    // Render the translator and preferences component to test global translation changes
    render(
      <>
        <Translator />
        <ProfilePreferences />
      </>
    );
    
    // Initial state should be English
    const engBtn = screen.getByRole('button', { name: /English/i });
    expect(engBtn).toBeInTheDocument();
    
    // Check if Telugu is available
    const teluguBtn = screen.getByRole('button', { name: /Telugu/i });
    
    // Click Telugu
    fireEvent.click(teluguBtn);
    
    // Check local storage
    const getLang = () => JSON.parse(localStorage.getItem('mediquee_preferences') || '{}').language;
    expect(getLang()).toBe('te');

    // Restore to English for other tests
    fireEvent.click(engBtn);
    expect(getLang()).toBe('en');
  });

  test('changes font size and style', () => {
    render(<ProfilePreferences />);
    
    const getFontSize = () => JSON.parse(localStorage.getItem('mediquee_preferences') || '{}').fontSize;
    const getFontStyle = () => JSON.parse(localStorage.getItem('mediquee_preferences') || '{}').fontStyle;
    
    // Font size
    const smallBtn = screen.getByText('Small');
    const largeBtn = screen.getByText('Large');
    
    fireEvent.click(smallBtn);
    expect(getFontSize()).toBe('small');
    
    fireEvent.click(largeBtn);
    expect(getFontSize()).toBe('large');

    // Font style
    const serifBtn = screen.getByText('Serif');
    const sansBtn = screen.getByText('Sans Serif');
    
    fireEvent.click(serifBtn);
    expect(getFontStyle()).toBe('serif');
    
    fireEvent.click(sansBtn);
    expect(getFontStyle()).toBe('sans');
  });
});
