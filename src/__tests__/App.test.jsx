import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component Unit Tests', () => {
  test('renders welcomes heading', () => {
    render(<App />);
    const headingElement = screen.getByText('Digitap Learning Portal');
    expect(headingElement).toBeInTheDocument();
  });

  test('renders correct description text', () => {
    render(<App />);
    const descriptionElement = screen.getByText(/Account Aggregator ecosystem/i);
    expect(descriptionElement).toBeInTheDocument();
  });
});
