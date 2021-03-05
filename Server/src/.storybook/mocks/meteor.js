module.exports = {
  startup: () => {},
  _localStorage: window
    ? window.localStorage
    : { setItem: () => {}, getItem: () => {} },
  isClient: () => true,
  isServer: () => false,
  absoluteUrl: () => "http://localhost:3000/"
};
