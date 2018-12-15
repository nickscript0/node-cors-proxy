# Node CORS Proxy
A nodejs reverse proxy with file based request caching, and options to add CORS header to the proxied request.

> Only run this in trusted non-public environments. As there are no restrictions on where requests are proxied from, or when the CORS header is enabled, it is open to XSS attacks.

## Example usage with a docker-compose web app
> The following is an example for dev only, do not use EXTRA_TLDS, CORS_ALL in production, where they won't be necessary (and for security reasons) as both the web app and the proxy should be served from the same port and hostname

Step 1: Write a web app that makes requests to `http://localhost:8080/proxy/https://...`

Step 2: Start your web app in a docker-compose environment with node-cors-proxy running

docker-compose.yml
```
version: "3.2"
services:
web:
    build: 
    context: .
    ports:
    - "3000:3000"
node-cors-proxy:
    image: node-cors-proxy:latest
    ports:
    - "8080:8080"    
    environment:
    - IGNORE_URL_PREFIX=/proxy
    - EXTRA_TLDS=web # Needed only for dev testing on container hostname 'web'
    - CORS_ALL=true # Needed only for dev testing on parceljs localhost different port

```