# Installation auf Windows (ohne Docker)

## Installieren:

Node.js: https://nodejs.org/en/download/ (aktuelle Version) installieren

Im Projektverzeichnis (mit dieser Datei) im Befehlsfenster (Powershell) weitere Pakete installieren (einmalig):

C:> npm install

Start des Servers:

C:> node server.js

Im Browser `http://localhost:8080/hsi/` öffnen.

## Proxy-Konfiguration

Wenn im Firmennetz ein Proxy-Server benutzt werden muss, um auf das Internet zuzugreifen, muss dieser Proxy für npm eingerichtet werden in C:\users\[username]\.npmrc (bei Umbenennen der Datei einen Punkt am Ende setzen!):

```
proxy = http://proxyhostname:8080/
https-proxy = http://proxyhostname:8080/
strict-ssl = false
```

Zusätzlich sind die Porxy-Infomationen in der Datei `modules/hsi/configuration.yaml` einzutragen.
