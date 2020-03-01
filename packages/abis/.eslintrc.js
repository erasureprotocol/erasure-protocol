module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
  },
  'extends': [
    'eslint:recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    "no-unused-vars": 1,
    "no-else-return": 1,
    "no-trailing-spaces": 1,
    "class-methods-use-this": 0,
    "max-len": [2, 120],
    "indent": 1,
    "func-names": 0,
    "no-param-reassign": 0,
    "space-before-function-paren": 0,
    "lines-between-class-members": 1,
    "import/prefer-default-export": 0,
    "comma-dangle": 0,
    "no-useless-constructor": 0,
    "arrow-parens": 0,
    "arrow-body-style": 0,
    "no-void": 0,
  },
};
