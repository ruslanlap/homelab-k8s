# homelab-gitops

GitOps-структура для розгортання homelab Kubernetes кластера через Flux CD.

## Структура

- `clusters/production` — точка входу Flux
- `infrastructure` — базові компоненти кластера
- `apps/production` — прикладні сервіси

## Bootstrap Flux

```bash
flux bootstrap git \
  --url=ssh://git@github.com/ruslanlap/homelab-k8s.git \
  --branch=main \
  --path=clusters/production \
  --private-key-file=$HOME/.ssh/flux_ed25519
```

## Після змін

```bash
flux reconcile source git flux-system
flux reconcile kustomization infrastructure --with-source
flux reconcile kustomization apps --with-source
```
