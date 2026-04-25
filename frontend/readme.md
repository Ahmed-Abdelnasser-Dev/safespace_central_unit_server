# Safe Space Frontend

This frontend repository must not contain any real credentials, tokens, or personal account data.

## Local Development

Create a local `.env` file in the frontend root and define only non-secret defaults:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

Current runtime code reads `VITE_API_URL` and `VITE_WS_URL`.
Planned split variables (`VITE_SOCKET_URL`, `VITE_NODE_VIDEO_WS_URL`) will be introduced with the frontend decoupling phase.

## Security Notes

- Do not commit usernames, emails, passwords, API keys, or refresh tokens.
- Keep production secrets in deployment environment variables only.
- Use role-based access controls and backend authorization checks for all protected actions.