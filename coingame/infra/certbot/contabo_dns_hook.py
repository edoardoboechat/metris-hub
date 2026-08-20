#!/usr/bin/env python3
import json
import os
import sys
import time
import uuid
from urllib import error, parse, request

AUTH_URL = "https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token"
API_BASE_URL = "https://api.contabo.com/v1"


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_access_token() -> str:
    payload = parse.urlencode(
        {
            "grant_type": "password",
            "client_id": required_env("CONTABO_CLIENT_ID"),
            "client_secret": required_env("CONTABO_CLIENT_SECRET"),
            "username": required_env("CONTABO_API_USER"),
            "password": required_env("CONTABO_API_PASSWORD"),
        }
    ).encode("utf-8")
    req = request.Request(AUTH_URL, data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with request.urlopen(req, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
    token = body.get("access_token")
    if not token:
        raise RuntimeError("Unable to obtain Contabo access token.")
    return token


def api_request(method: str, path: str, token: str, payload=None):
    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
    req = request.Request(f"{API_BASE_URL}{path}", data=body, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-request-id", str(uuid.uuid4()))
    try:
        with request.urlopen(req, timeout=30) as response:
            content = response.read().decode("utf-8")
            if not content:
                return {}
            return json.loads(content)
    except error.HTTPError as exc:
        if method == "DELETE" and exc.code in {400, 404}:
            return {}
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Contabo API {method} {path} failed with {exc.code}: {details}") from exc


def challenge_record_name(domain: str) -> str:
    normalized = domain[2:] if domain.startswith("*.") else domain
    return f"_acme-challenge.{normalized}"


def list_records(zone: str, token: str):
    response = api_request("GET", f"/dns/zones/{zone}/records?page=1&size=500", token)
    return response.get("data", [])


def create_record():
    token = get_access_token()
    zone = os.environ.get("CONTABO_DNS_ZONE", "moneyback.com.br").strip() or "moneyback.com.br"
    ttl = int(os.environ.get("CONTABO_DNS_TTL", "60"))
    propagation_wait = int(os.environ.get("CONTABO_DNS_PROPAGATION_SECONDS", "90"))
    name = challenge_record_name(required_env("CERTBOT_DOMAIN"))
    value = required_env("CERTBOT_VALIDATION")

    api_request(
        "POST",
        f"/dns/zones/{zone}/records",
        token,
        {
            "name": name,
            "type": "TXT",
            "ttl": ttl,
            "prio": 0,
            "data": value,
        },
    )
    time.sleep(propagation_wait)


def cleanup_record():
    token = get_access_token()
    zone = os.environ.get("CONTABO_DNS_ZONE", "moneyback.com.br").strip() or "moneyback.com.br"
    name = challenge_record_name(required_env("CERTBOT_DOMAIN"))
    value = required_env("CERTBOT_VALIDATION")

    for record in list_records(zone, token):
        if record.get("name") == name and record.get("type") == "TXT" and record.get("data") == value:
            record_id = record.get("recordId")
            if record_id is not None:
                api_request("DELETE", f"/dns/zones/{zone}/records/{record_id}", token)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in {"auth", "cleanup"}:
        raise SystemExit("Usage: contabo_dns_hook.py [auth|cleanup]")
    if sys.argv[1] == "auth":
        create_record()
        return
    cleanup_record()


if __name__ == "__main__":
    main()
