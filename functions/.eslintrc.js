module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "google", "prettier"],
  parserOptions: {
    ecmaVersion: 2017,
  },
  rules: {},
};
