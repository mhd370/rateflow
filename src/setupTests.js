// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import './i18n';

jest.mock(
  'react-router-dom',
  () => {
  const React = require('react');

  const BrowserRouter = ({ children }) =>
    React.createElement(React.Fragment, null, children);

  const Routes = ({ children }) => {
    const items = React.Children.toArray(children);
    return React.createElement(React.Fragment, null, items[0] || null);
  };

  const Route = ({ element }) => element || null;

  const NavLink = ({ to, children, ...props }) => {
    if (typeof children === 'function') {
      return children({ isActive: false, isPending: false });
    }

    return React.createElement('a', { href: to, ...props }, children);
  };

  const Link = ({ to, children, ...props }) =>
    React.createElement('a', { href: to, ...props }, children);

  const useNavigate = () => () => {};

  return {
    BrowserRouter,
    Link,
    NavLink,
    Route,
    Routes,
    useNavigate,
  };
  },
  { virtual: true },
);
