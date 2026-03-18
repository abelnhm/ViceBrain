module.exports = [
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        Notification: 'readonly'
      }
    },
    files: ['src/**/*.js'],
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error'
    }
  }
];
