import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';

describe('AuthPage', () => {
  it('renders login and register toggle', () => {
    render(
      <BrowserRouter>
        <AuthPage setToken={() => {}} />
      </BrowserRouter>
    );
    
    // It should start on Login
    expect(screen.getAllByText('Sign in')[0]).toBeInTheDocument();
    
    // Should have a link to create an account
    expect(screen.getByText(/Create account/i)).toBeInTheDocument();
  });
});
