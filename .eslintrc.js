module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended'
    ],
    plugins: ['@typescript-eslint'],
    env: {
        node: true,
        es6: true,
        browser: true // Add browser environment for window/document
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        // Disable annoying rules
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'no-empty': 'off',
        'no-constant-condition': 'off'
    }
};