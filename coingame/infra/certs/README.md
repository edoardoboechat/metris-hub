Place Let's Encrypt assets for `moneyback.com.br` in this tree.

Expected runtime paths used by NGINX:

- `infra/certs/live/moneyback.com.br/fullchain.pem`
- `infra/certs/live/moneyback.com.br/privkey.pem`

Issue the wildcard certificate with:

```powershell
docker compose run --rm --profile certbot certbot
```

Before that, create a `.env` file at the project root based on `.env.example`.

Required environment variables:

- `CONTABO_CLIENT_ID`
- `CONTABO_CLIENT_SECRET`
- `CONTABO_API_USER`
- `CONTABO_API_PASSWORD`
- `CERTBOT_EMAIL`
