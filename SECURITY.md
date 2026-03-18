# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within ViceBrain, please follow these guidelines:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send a detailed report to the maintainer via:
   - GitHub's [Private vulnerability reporting](https://github.com/abelnhm/ViceBrain/security/advisories/new)
   - Or contact directly through GitHub

### What to Include

Please include the following information:

- Type of vulnerability (e.g., XSS, injection, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment of the vulnerability

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Response**: Within 7 days
- **Resolution**: As soon as possible (depending on severity)

### Scope

This project is for **educational purposes**. Security vulnerabilities in:

- Third-party AI services (ChatGPT, Gemini, Claude, etc.)
- User accounts on external platforms
- Services not controlled by this application

...are **outside the scope** of this security policy.

## Security Best Practices

When contributing to this project:

- Never commit API keys, tokens, or credentials
- Use environment variables for sensitive configuration
- Follow Electron security best practices
- Report any potential security issues immediately

## Disclaimer

ViceBrain is provided for educational and research purposes. The maintainer is not responsible for misuse of this software or security issues arising from third-party services.
