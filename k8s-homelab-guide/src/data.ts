export const phases: Phase[] = [
  {
    id: 1,
    title: { uk: "Підготовка", en: "Preparation" },
    description: { uk: "Обладнання та встановлення Ubuntu Server", en: "Hardware and Ubuntu Server installation" },
    steps: [
      {
        title: { uk: "Завантажте Ubuntu Server 24.04 LTS", en: "Download Ubuntu Server 24.04 LTS" },
        description: { uk: "Використовуйте версію без GUI. При встановленні створіть користувача: ubuntus", en: "Use non-GUI version. During installation, create user: ubuntus" },
        command: "wget https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso",
        expectedResult: { uk: "ISO файл успішно завантажено в поточну директорію.", en: "ISO file successfully downloaded to the current directory." },
        expectedOutput: "100%[======================================>] 2.6G  11.2MB/s    in 4m 12s",
        possibleErrors: { uk: "Помилка 404: посилання застаріло. Перевірте актуальне посилання на сайті Ubuntu.", en: "Error 404: link is outdated. Check the current link on the Ubuntu website." },
        note: { uk: "Рекомендується також налаштувати статичну IP-адресу для вашого сервера в налаштуваннях роутера або через netplan, щоб уникнути зміни IP після перезавантаження.", en: "It is also recommended to configure a static IP address for your server in your router settings or via netplan to avoid IP changes after reboot." }
      },
      {
        title: { uk: "Запишіть образ на USB", en: "Flash image to USB" },
        description: { uk: "Використовуйте Balena Etcher для запису ISO образу на флешку.", en: "Use Balena Etcher to flash the ISO image to a USB drive." },
        command: "https://etcher.balena.io"
      }
    ]
  },
  {
    id: 2,
    title: { uk: "Мережа та IP", en: "Networking & IP" },
    description: { uk: "Чітке планування адрес для стабільності кластера", en: "Clear address planning for cluster stability" },
    steps: [
      {
        title: { uk: "Пояснення IP адрес", en: "IP Address Explanation" },
        description: { 
          uk: "Статичні IP критичні: якщо DHCP змінить адресу вузла, зв'язок між компонентами K8s розірветься. mini1 (Master): mini1, mini2 (Worker): mini2", 
          en: "Static IPs are critical: if DHCP changes a node's address, K8s component communication will break. mini1 (Master): mini1, mini2 (Worker): mini2" 
        }
      },
      {
        title: { uk: "Налаштуйте Netplan на mini1 (Master)", en: "Configure Netplan on mini1 (Master)" },
        description: { uk: "Відкрийте файл конфігурації та вставте наступний код. Замініть YOUR_SSID та YOUR_PASSWORD.", en: "Open the config file and paste the following code. Replace YOUR_SSID and YOUR_PASSWORD." },
        command: `sudo nano /etc/netplan/00-installer-config.yaml

network:
  version: 2
  renderer: networkd
  wifis:
    wlp2s0:
      dhcp4: false
      addresses: [mini1/24]
      routes:
        - to: default
          via: gateway
      nameservers:
        addresses: [dns1, dns2]
      access-points:
        "YOUR_SSID":
          password: "YOUR_PASSWORD"`,
        expectedResult: { uk: "Файл конфігурації збережено з новими налаштуваннями.", en: "Configuration file saved with new settings." }
      },
      {
        title: { uk: "Застосуйте налаштування мережі (mini1)", en: "Apply network settings (mini1)" },
        command: "sudo netplan apply\nip a",
        expectedResult: { uk: "Мережевий інтерфейс отримає IP адресу mini1.", en: "The network interface will get the IP address mini1." },
        expectedOutput: "2: wlp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000\n    inet mini1/24 brd broadcast scope global wlp2s0",
        possibleErrors: { uk: "Cannot find device: перевірте назву вашого Wi-Fi інтерфейсу через команду 'ip a' (може бути wlan0 замість wlp2s0).", en: "Cannot find device: check your Wi-Fi interface name using the 'ip a' command (might be wlan0 instead of wlp2s0)." }
      },
      {
        title: { uk: "Налаштуйте Netplan на mini2 (Worker)", en: "Configure Netplan on mini2 (Worker)" },
        description: { uk: "Зробіть те саме для другого вузла, але з IP mini2", en: "Do the same for the second node, but with IP mini2" },
        command: `sudo nano /etc/netplan/00-installer-config.yaml

network:
  version: 2
  renderer: networkd
  wifis:
    wlp2s0:
      dhcp4: false
      addresses: [mini2/24]
      routes:
        - to: default
          via: gateway
      nameservers:
        addresses: [dns1, dns2]
      access-points:
        "YOUR_SSID":
          password: "YOUR_PASSWORD"`,
        expectedResult: { uk: "Файл конфігурації збережено з новими налаштуваннями.", en: "Configuration file saved with new settings." }
      },
      {
        title: { uk: "Застосуйте налаштування мережі (mini2)", en: "Apply network settings (mini2)" },
        command: "sudo netplan apply\nip a",
        expectedResult: { uk: "Мережевий інтерфейс отримає IP адресу mini2.", en: "The network interface will get the IP address mini2." },
        expectedOutput: "2: wlp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000\n    inet mini2/24 brd broadcast scope global wlp2s0",
        possibleErrors: { uk: "Cannot find device: перевірте назву вашого Wi-Fi інтерфейсу через команду 'ip a'.", en: "Cannot find device: check your Wi-Fi interface name using the 'ip a' command." }
      }
    ]
  },
  {
    id: 3,
    title: { uk: "SSH Доступ", en: "SSH Access" },
    description: { uk: "Безпарольний доступ для користувача ubuntus", en: "Passwordless access for ubuntus user" },
    steps: [
      {
        title: { uk: "Генерація ключа на вашому ПК (WSL/Mac/Linux)", en: "Generate key on your PC (WSL/Mac/Linux)" },
        description: { uk: "Виконайте це на вашому основному комп'ютері, з якого будете керувати кластером.", en: "Run this on your main computer from which you will manage the cluster." },
        command: "mkdir -p ~/.ssh\nssh-keygen -t ed25519 -C \"ubuntus@mini\" -f ~/.ssh/id_k8s",
        expectedResult: { uk: "Створено пару ключів (id_k8s та id_k8s.pub) у папці ~/.ssh.", en: "Key pair (id_k8s and id_k8s.pub) created in ~/.ssh folder." }
      },
      {
        title: { uk: "Копіювання ключа на mini1 та mini2", en: "Copy key to mini1 and mini2" },
        description: { uk: "Вас попросить ввести пароль користувача ubuntus, який ви створили при встановленні.", en: "You will be asked to enter the password for the ubuntus user you created during installation." },
        command: "ssh-copy-id -i ~/.ssh/id_k8s.pub ubuntus@mini1\nssh-copy-id -i ~/.ssh/id_k8s.pub ubuntus@mini2",
        expectedResult: { uk: "Ключі успішно додано на сервери. Тепер можна входити без пароля.", en: "Keys successfully added to the servers. You can now log in without a password." },
        expectedOutput: "Number of key(s) added: 1\n\nNow try logging into the machine, with:   \"ssh 'ubuntus@mini1'\"\nand check to make sure that only the key(s) you wanted were added.",
        possibleErrors: { uk: "Connection refused: перевірте чи встановлено openssh-server на mini1/mini2 та чи правильна IP адреса.", en: "Connection refused: check if openssh-server is installed on mini1/mini2 and if the IP address is correct." }
      },
      {
        title: { uk: "Перевірка підключення", en: "Verify connection" },
        description: { uk: "Переконайтеся, що ви можете зайти без пароля.", en: "Ensure you can log in without a password." },
        command: "ssh -i ~/.ssh/id_k8s ubuntus@mini1\nexit\nssh -i ~/.ssh/id_k8s ubuntus@mini2\nexit",
        expectedResult: { uk: "Успішний вхід на сервери без запиту пароля.", en: "Successful login to the servers without a password prompt." }
      }
    ]
  },
  {
    id: 4,
    title: { uk: "Конфігурація Вузлів", en: "Node Configuration" },
    description: { uk: "Підготовка OS до роботи Kubernetes (Виконати на ОБОХ вузлах)", en: "OS preparation for Kubernetes (Run on BOTH nodes)" },
    steps: [
      {
        title: { uk: "Вимкнення Swap", en: "Disable Swap" },
        description: { uk: "Kubernetes вимагає вимкненого файлу підкачки (swap).", en: "Kubernetes requires swap to be disabled." },
        command: "sudo swapoff -a\nsudo sed -i '/ swap / s/^\\(.*\\)$/#\\1/g' /etc/fstab",
        expectedResult: { uk: "Swap вимкнено та закоментовано у файлі /etc/fstab.", en: "Swap is disabled and commented out in the /etc/fstab file." }
      },
      {
        title: { uk: "Модулі ядра та Sysctl", en: "Kernel Modules & Sysctl" },
        description: { uk: "Налаштування мережевих мостів для контейнерів.", en: "Configuring network bridges for containers." },
        command: `cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system`,
        expectedResult: { uk: "Модулі завантажено, параметри sysctl застосовано без помилок.", en: "Modules loaded, sysctl parameters applied without errors." }
      },
      {
        title: { uk: "Встановлення Containerd та Kubernetes", en: "Install Containerd and Kubernetes" },
        description: { uk: "Встановлюємо середовище виконання контейнерів та компоненти K8s.", en: "Installing container runtime and K8s components." },
        command: `sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg containerd

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl`,
        expectedResult: { uk: "Пакети kubelet, kubeadm, kubectl та containerd успішно встановлено.", en: "Packages kubelet, kubeadm, kubectl, and containerd successfully installed." }
      }
    ]
  },
  {
    id: 5,
    title: { uk: "Control Plane (mini1)", en: "Control Plane (mini1)" },
    description: { uk: "Запуск головного вузла кластера (Виконати ТІЛЬКИ на mini1)", en: "Starting the main cluster node (Run ONLY on mini1)" },
    steps: [
      {
        title: { uk: "Ініціалізація kubeadm", en: "Kubeadm Init" },
        description: { uk: "Створюємо кластер. Збережіть команду 'kubeadm join', яка з'явиться в кінці!", en: "Creating the cluster. Save the 'kubeadm join' command that appears at the end!" },
        command: "sudo kubeadm init --pod-network-cidr=pod_cidr --apiserver-advertise-address=mini1 --node-name=mini1",
        expectedResult: { uk: "Повідомлення 'Your Kubernetes control-plane has initialized successfully!' та команда kubeadm join.", en: "Message 'Your Kubernetes control-plane has initialized successfully!' and the kubeadm join command." },
        expectedOutput: "Your Kubernetes control-plane has initialized successfully!\n\nTo start using your cluster, you need to run the following as a regular user:\n\n  mkdir -p $HOME/.kube\n  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config\n  sudo chown $(id -u):$(id -g) $HOME/.kube/config\n\nThen you can join any number of worker nodes by running the following on each as root:\n\nkubeadm join mini1:6443 --token ...",
        possibleErrors: { uk: "CRI v1 image endpoint is not valid: перевірте чи запущено containerd (sudo systemctl status containerd).", en: "CRI v1 image endpoint is not valid: check if containerd is running (sudo systemctl status containerd)." },
        note: { uk: "Ця команда встановлює single-node control plane. Для production-ready (High Availability) середовища вам знадобиться зовнішня база даних (наприклад, etcd) та декілька master-нод, а також балансувальник навантаження перед ними.", en: "This command installs a single-node control plane. For a production-ready (High Availability) environment, you will need an external database (e.g., etcd) and multiple master nodes, as well as a load balancer in front of them." }
      },
      {
        title: { uk: "Налаштування Kubeconfig", en: "Kubeconfig Setup" },
        description: { uk: "Надаємо користувачу ubuntus права на керування кластером.", en: "Granting the ubuntus user rights to manage the cluster." },
        command: "mkdir -p $HOME/.kube\nsudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config\nsudo chown $(id -u):$(id -g) $HOME/.kube/config",
        expectedResult: { uk: "Файл конфігурації скопійовано, тепер команди kubectl працюватимуть.", en: "Config file copied, kubectl commands will now work." }
      },
      {
        title: { uk: "Перевірка статусу", en: "Check status" },
        command: "kubectl get nodes",
        expectedResult: { uk: "Вузол mini1 відображається зі статусом NotReady (це нормально до встановлення CNI).", en: "Node mini1 is displayed with status NotReady (this is normal before CNI installation)." }
      }
    ]
  },
  {
    id: 6,
    title: { uk: "Мережа Pod (CNI)", en: "Pod Network (CNI)" },
    description: { uk: "Встановлення Flannel для зв'язку між Pods (Виконати на mini1)", en: "Installing Flannel for Pod communication (Run on mini1)" },
    steps: [
      {
        title: { uk: "Застосуйте Flannel", en: "Apply Flannel" },
        command: "kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml",
        expectedResult: { uk: "Створено ресурси (serviceaccount, configmap, daemonset) для Flannel.", en: "Resources (serviceaccount, configmap, daemonset) created for Flannel." }
      },
      {
        title: { uk: "Перевірка мережі", en: "Check network" },
        description: { uk: "Зачекайте хвилину і перевірте, чи всі поди Flannel запущені.", en: "Wait a minute and check if all Flannel pods are running." },
        command: "kubectl get pods -n kube-flannel",
        expectedResult: { uk: "Поди kube-flannel-ds-* мають статус Running. Вузол mini1 перейде в статус Ready.", en: "kube-flannel-ds-* pods have Running status. Node mini1 will transition to Ready status." }
      }
    ]
  },
  {
    id: 7,
    title: { uk: "Worker Node (mini2)", en: "Worker Node (mini2)" },
    description: { uk: "Приєднання другого вузла (Виконати ТІЛЬКИ на mini2)", en: "Joining the second node (Run ONLY on mini2)" },
    steps: [
      {
        title: { uk: "Приєднання до кластера", en: "Join Cluster" },
        description: { uk: "Вставте команду, яку ви зберегли на кроці 5. Якщо забули, згенеруйте нову на mini1: 'kubeadm token create --print-join-command'", en: "Paste the command you saved in step 5. If forgotten, generate a new one on mini1: 'kubeadm token create --print-join-command'" },
        command: "sudo kubeadm join mini1:6443 --token <your-token> --discovery-token-ca-cert-hash sha256:<your-hash>",
        expectedResult: { uk: "Повідомлення 'This node has joined the cluster'.", en: "Message 'This node has joined the cluster'." },
        expectedOutput: "This node has joined the cluster:\n* Certificate signing request was sent to apiserver and a response was received.\n* The Kubelet was informed of the new secure connection details.",
        possibleErrors: { uk: "Token has expired: згенеруйте новий токен на master вузлі командою 'kubeadm token create --print-join-command'.", en: "Token has expired: generate a new token on the master node with 'kubeadm token create --print-join-command'." }
      },
      {
        title: { uk: "Маркування ролі (Виконати на mini1)", en: "Role Labeling (Run on mini1)" },
        description: { uk: "Поверніться на mini1 і додайте мітку 'worker' для mini2.", en: "Return to mini1 and add the 'worker' label to mini2." },
        command: "kubectl label node mini2 node-role.kubernetes.io/worker=worker\nkubectl get nodes",
        expectedResult: { uk: "Вузол mini2 з'явиться у списку зі статусом Ready та роллю worker.", en: "Node mini2 will appear in the list with Ready status and worker role." }
      }
    ]
  },
  {
    id: 8,
    title: { uk: "Ingress та Трафік", en: "Ingress & Traffic" },
    description: { uk: "Nginx Ingress Controller з NodePort (Виконати на mini1)", en: "Nginx Ingress Controller with NodePort (Run on mini1)" },
    steps: [
      {
        title: { uk: "Встановлення Ingress", en: "Install Ingress" },
        command: "kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/baremetal/deploy.yaml",
        expectedResult: { uk: "Створено ресурси Ingress Nginx (namespace, serviceaccount, configmap, deployment).", en: "Ingress Nginx resources created (namespace, serviceaccount, configmap, deployment)." }
      },
      {
        title: { uk: "Фіксація портів (30080/30443)", en: "Fixing Ports (30080/30443)" },
        description: { uk: "Робимо порти статичними, щоб завжди знати, куди звертатися.", en: "Making ports static so we always know where to connect." },
        command: `kubectl patch svc ingress-nginx-controller -n ingress-nginx \\
--type='json' -p='[
{"op":"replace","path":"/spec/ports/0/nodePort","value":30080},
{"op":"replace","path":"/spec/ports/1/nodePort","value":30443}
]'`,
        expectedResult: { uk: "Сервіс ingress-nginx-controller оновлено (patched).", en: "Service ingress-nginx-controller updated (patched)." }
      },
      {
        title: { uk: "Перевірка Ingress", en: "Check Ingress" },
        command: "kubectl get pods -n ingress-nginx",
        expectedResult: { uk: "Под ingress-nginx-controller-* має статус Running.", en: "Pod ingress-nginx-controller-* has Running status." }
      }
    ]
  },
  {
    id: 9,
    title: { uk: "Зберігання Даних", en: "Storage" },
    description: { uk: "Local Path Provisioner для збереження даних (Виконати на mini1)", en: "Local Path Provisioner for data persistence (Run on mini1)" },
    steps: [
      {
        title: { uk: "Встановлення StorageClass", en: "Install StorageClass" },
        command: "kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.28/deploy/local-path-storage.yaml",
        expectedResult: { uk: "Створено ресурси для local-path-provisioner.", en: "Resources for local-path-provisioner created." }
      },
      {
        title: { uk: "Встановлення як Default", en: "Set as Default" },
        command: "kubectl patch storageclass local-path -p '{\"metadata\": {\"annotations\":{\"storageclass.kubernetes.io/is-default-class\":\"true\"}}}'",
        expectedResult: { uk: "StorageClass 'local-path' оновлено (patched).", en: "StorageClass 'local-path' updated (patched)." }
      },
      {
        title: { uk: "Перевірка StorageClass", en: "Check StorageClass" },
        command: "kubectl get sc",
        expectedResult: { uk: "У списку є 'local-path (default)'.", en: "'local-path (default)' is in the list." }
      }
    ]
  },
  {
    id: 10,
    title: { uk: "Homepage Dashboard", en: "Homepage Dashboard" },
    description: { uk: "Візуалізація сервісів: Pi-hole, Grafana, Home Assistant", en: "Service visualization: Pi-hole, Grafana, Home Assistant" },
    steps: [
      {
        title: { uk: "Створення маніфесту Homepage", en: "Create Homepage Manifest" },
        description: { uk: "Цей блок створить Namespace, ConfigMap, Deployment та Service одним файлом.", en: "This block creates Namespace, ConfigMap, Deployment, and Service in one file." },
        command: `cat <<EOF > homepage.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: homepage
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: homepage-config
  namespace: homepage
data:
  settings.yaml: |
    title: K8s Home Lab
    background: https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80
    cardBlur: sm
    theme: dark
    layout:
      Network:
        style: grid
        columns: 2
      Automation:
        style: grid
        columns: 1
      Monitoring:
        style: grid
        columns: 1
      Telegram Bots:
        style: grid
        columns: 2
  widgets.yaml: |
    - logo:
        icon: https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg
    - datetime:
        text_size: xl
        format:
          dateStyle: long
          timeStyle: short
    - kubernetes:
        cluster:
          show: true
          cpu: true
          memory: true
          nodes: true
    - resources:
        cpu: true
        memory: true
        disk: /
  bookmarks.yaml: |
    - Social:
        - GitHub:
            - abbr: GH
              href: https://github.com/
        - Reddit:
            - abbr: RE
              href: https://reddit.com/
    - DevOps:
        - Artifact Hub:
            - abbr: AH
              href: https://artifacthub.io/
        - K8s Docs:
            - abbr: K8S
              href: https://kubernetes.io/docs/
  kubernetes.yaml: |
    mode: cluster
    show_node_stats: true
  services.yaml: |
    - Network:
        - Pi-hole:
            href: http://mini1:30081/admin
            icon: pi-hole.png
            description: Network-wide Ad Blocking
        - AdGuard Home:
            href: http://mini1:30082
            icon: adguard-home.png
    - Automation:
        - Home Assistant:
            href: http://mini1:30123
            icon: home-assistant.png
    - Monitoring:
        - Grafana:
            href: http://mini1:30300
            icon: grafana.png
    - Telegram Bots:
        - My Assistant Bot:
            href: https://t.me/MyAssistantBot
            icon: telegram.png
            description: Personal Assistant
        - Home Alerts Bot:
            href: https://t.me/HomeAlertsBot
            icon: telegram.png
            description: Smart Home Notifications
        - Server Status Bot:
            href: https://t.me/ServerStatusBot
            icon: telegram.png
            description: K8s Cluster Health
        - Security Cam Bot:
            href: https://t.me/SecurityCamBot
            icon: telegram.png
            description: Motion Alerts & Snapshots
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: homepage
  namespace: homepage
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: homepage
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "namespaces", "services"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: homepage
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: homepage
subjects:
- kind: ServiceAccount
  name: homepage
  namespace: homepage
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homepage
  namespace: homepage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: homepage
  template:
    metadata:
      labels:
        app: homepage
    spec:
      serviceAccountName: homepage
      containers:
      - name: homepage
        image: ghcr.io/gethomepage/homepage:latest
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: config
          mountPath: /app/config
      volumes:
      - name: config
        configMap:
          name: homepage-config
---
apiVersion: v1
kind: Service
metadata:
  name: homepage
  namespace: homepage
spec:
  selector:
    app: homepage
  ports:
  - port: 80
    targetPort: 3000
EOF`,
        expectedResult: { uk: "Файл homepage.yaml успішно створено.", en: "File homepage.yaml successfully created." }
      },
      {
        title: { uk: "Запуск Homepage", en: "Deploy Homepage" },
        command: "kubectl apply -f homepage.yaml\nkubectl get pods -n homepage",
        expectedResult: { uk: "Ресурси створено, под homepage-* має статус Running.", en: "Resources created, homepage-* pod has Running status." }
      }
    ]
  },
  {
    id: 11,
    title: { uk: "GitOps з Flux CD", en: "GitOps with Flux CD" },
    description: { uk: "Автоматизація через GitHub (Infrastructure as Code)", en: "Automation via GitHub (Infrastructure as Code)" },
    steps: [
      {
        title: { uk: "Підготовка GitHub", en: "GitHub Preparation" },
        description: { uk: "Створіть порожній приватний репозиторій на GitHub (наприклад, 'k8s-homelab-ops').", en: "Create an empty private repository on GitHub (e.g., 'k8s-homelab-ops')." }
      },
      {
        title: { uk: "Генерація Deploy Key", en: "Generate Deploy Key" },
        description: { uk: "Згенеруйте SSH ключ. Скопіюйте публічний ключ (cat ~/.ssh/flux_ed25519.pub) та додайте його в GitHub -> Repository Settings -> Deploy keys (поставте галочку 'Allow write access').", en: "Generate an SSH key. Copy the public key (cat ~/.ssh/flux_ed25519.pub) and add it to GitHub -> Repository Settings -> Deploy keys (check 'Allow write access')." },
        command: "ssh-keygen -t ed25519 -C \"flux-deploy-key\" -f ~/.ssh/flux_ed25519 -q -N \"\"\ncat ~/.ssh/flux_ed25519.pub",
        expectedResult: { uk: "Згенеровано SSH ключ та виведено його публічну частину.", en: "SSH key generated and its public part is printed." }
      },
      {
        title: { uk: "Встановлення Flux CLI (на mini1)", en: "Install Flux CLI (on mini1)" },
        command: "curl -s https://fluxcd.io/install.sh | sudo bash",
        expectedResult: { uk: "Flux CLI успішно встановлено.", en: "Flux CLI successfully installed." }
      },
      {
        title: { uk: "Bootstrap Flux через SSH", en: "Bootstrap Flux via SSH" },
        description: { uk: "Ця команда встановить Flux у кластер і зв'яже його з вашим репозиторієм використовуючи Deploy Key.", en: "This command installs Flux in the cluster and links it to your repository using the Deploy Key." },
        command: "flux bootstrap git \\\n  --url=ssh://git@github.com/ruslanlap/homelab-k8s.git \\\n  --branch=main \\\n  --path=clusters/my-cluster \\\n  --private-key-file=$HOME/.ssh/flux_ed25519",
        expectedResult: { uk: "Flux компоненти запущені в кластері, репозиторій синхронізовано.", en: "Flux components are running in the cluster, repository is synced." },
        expectedOutput: "► connecting to github.com\n✔ repository cloned\n► generating component manifests\n✔ components are healthy\n✔ bootstrap finished",
        possibleErrors: { uk: "Host key verification failed: переконайтеся, що ви додали публічний ключ до Deploy Keys у GitHub з правами запису.", en: "Host key verification failed: ensure you added the public key to Deploy Keys in GitHub with write access." }
      },
      {
        title: { uk: "Клонування репозиторію на ваш ПК", en: "Clone repository to your PC" },
        description: { uk: "Тепер ви можете керувати кластером зі свого комп'ютера. Вкажіть ваші дані для Git.", en: "Now you can manage the cluster from your computer. Set your Git details." },
        command: "git clone https://github.com/ruslanlap/homelab-k8s.git\ncd homelab-k8s\ngit config --global user.name \"Your Name\"\ngit config --global user.email \"your.email@example.com\"",
        expectedResult: { uk: "Репозиторій клоновано локально, налаштування Git застосовано.", en: "Repository cloned locally, Git settings applied." }
      },
      {
        title: { uk: "Структура GitOps репозиторію", en: "GitOps Repository Structure" },
        description: { uk: "Ось як має виглядати структура вашого репозиторію після додавання всіх сервісів. Flux автоматично сканує папку 'clusters/my-cluster' і застосовує всі YAML файли.", en: "Here is what your repository structure should look like after adding all services. Flux automatically scans the 'clusters/my-cluster' folder and applies all YAML files." },
        command: "tree .",
        expectedOutput: `
.
├── clusters
│   └── my-cluster
│       ├── flux-system          # Автоматично створено Flux при bootstrap
│       │   ├── gotk-components.yaml
│       │   ├── gotk-sync.yaml
│       │   └── kustomization.yaml
│       ├── homeassistant        # Ваші маніфести
│       │   └── deployment.yaml
│       ├── nginx                # Тестовий маніфест
│       │   └── deployment.yaml
│       └── pihole               # Ваші маніфести
│           └── deployment.yaml
└── README.md
`,
        expectedResult: { uk: "Ви бачите повну ієрархію файлів у вашому GitOps репозиторії.", en: "You see the full file hierarchy in your GitOps repository." }
      },
      {
        title: { uk: "Створення тестового маніфесту Nginx", en: "Create test Nginx manifest" },
        description: { uk: "Створимо простий Nginx через GitOps.", en: "Let's create a simple Nginx via GitOps." },
        command: `mkdir -p clusters/my-cluster/nginx
cat <<EOF > clusters/my-cluster/nginx/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-gitops
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-gitops
  template:
    metadata:
      labels:
        app: nginx-gitops
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 3
          periodSeconds: 3
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 3
          periodSeconds: 3
EOF`,
        expectedResult: { uk: "Файл deployment.yaml для Nginx створено у папці clusters/my-cluster/nginx.", en: "deployment.yaml file for Nginx created in clusters/my-cluster/nginx folder." }
      },
      {
        title: { uk: "Створення маніфесту Pi-hole", en: "Create Pi-hole manifest" },
        description: { uk: "Додамо Pi-hole для блокування реклами та pihole-exporter для моніторингу через GitOps.", en: "Let's add Pi-hole for ad blocking and pihole-exporter for monitoring via GitOps." },
        command: `mkdir -p clusters/my-cluster/pihole
cat <<EOF > clusters/my-cluster/pihole/deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pihole-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pihole
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pihole
  template:
    metadata:
      labels:
        app: pihole
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9617"
    spec:
      containers:
      - name: pihole
        image: pihole/pihole:latest
        env:
        - name: TZ
          value: "Europe/Kyiv"
        - name: WEBPASSWORD
          value: "admin123"
        ports:
        - containerPort: 80
          name: web
        livenessProbe:
          httpGet:
            path: /admin/index.php
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /admin/index.php
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
        - containerPort: 53
          name: dns-tcp
          protocol: TCP
        - containerPort: 53
          name: dns-udp
          protocol: UDP
        volumeMounts:
        - name: pihole-data
          mountPath: /etc/pihole
        - name: dnsmasq-data
          mountPath: /etc/dnsmasq.d
      - name: pihole-exporter
        image: ekofr/pihole-exporter:latest
        env:
        - name: PIHOLE_HOSTNAME
          value: "127.0.0.1"
        - name: PIHOLE_PASSWORD
          value: "admin123"
        ports:
        - containerPort: 9617
          name: metrics
      volumes:
      - name: pihole-data
        persistentVolumeClaim:
          claimName: pihole-pvc
      - name: dnsmasq-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: pihole
  namespace: default
spec:
  selector:
    app: pihole
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30081
    name: web
  - port: 53
    targetPort: 53
    nodePort: 30053
    name: dns-tcp
    protocol: TCP
  - port: 53
    targetPort: 53
    nodePort: 30053
    name: dns-udp
    protocol: UDP
EOF`,
        expectedResult: { uk: "Файл deployment.yaml для Pi-hole створено у папці clusters/my-cluster/pihole.", en: "deployment.yaml file for Pi-hole created in clusters/my-cluster/pihole folder." }
      },
      {
        title: { uk: "Створення маніфесту Home Assistant", en: "Create Home Assistant manifest" },
        description: { uk: "Додамо систему розумного дому Home Assistant на порт 8123.", en: "Let's add the Home Assistant smart home system on port 8123." },
        command: `mkdir -p clusters/my-cluster/homeassistant
cat <<EOF > clusters/my-cluster/homeassistant/deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: homeassistant-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homeassistant
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: homeassistant
  template:
    metadata:
      labels:
        app: homeassistant
    spec:
      containers:
      - name: homeassistant
        image: ghcr.io/home-assistant/home-assistant:stable
        env:
        - name: TZ
          value: "Europe/Kyiv"
        ports:
        - containerPort: 8123
          name: http
        livenessProbe:
          httpGet:
            path: /
            port: 8123
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8123
          initialDelaySeconds: 30
          periodSeconds: 5
        volumeMounts:
        - name: config
          mountPath: /config
      volumes:
      - name: config
        persistentVolumeClaim:
          claimName: homeassistant-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: homeassistant
  namespace: default
spec:
  selector:
    app: homeassistant
  type: NodePort
  ports:
  - port: 8123
    targetPort: 8123
    nodePort: 30123
    name: http
EOF`,
        expectedResult: { uk: "Файл deployment.yaml для Home Assistant створено у папці clusters/my-cluster/homeassistant.", en: "deployment.yaml file for Home Assistant created in clusters/my-cluster/homeassistant folder." }
      },
      {
        title: { uk: "Відправка в Git (Commit & Push)", en: "Send to Git (Commit & Push)" },
        description: { uk: "Додаємо файли, зберігаємо зміни та відправляємо на GitHub. При запиті пароля введіть ваш PAT токен.", en: "Add files, save changes, and push to GitHub. When asked for a password, enter your PAT token." },
        command: "git add .\ngit commit -m \"Add nginx, pihole, and homeassistant via GitOps\"\ngit push origin main",
        expectedResult: { uk: "Зміни успішно відправлені до GitHub репозиторію.", en: "Changes successfully pushed to the GitHub repository." }
      },
      {
        title: { uk: "Перевірка фінальної структури", en: "Final Structure Check" },
        description: { uk: "Переконайтеся, що всі файли на своїх місцях перед тим, як Flux почне їх застосовувати.", en: "Ensure all files are in their places before Flux starts applying them." },
        command: "tree .",
        expectedOutput: `
.
├── clusters
│   └── my-cluster
│       ├── flux-system
│       ├── homeassistant
│       │   └── deployment.yaml
│       ├── nginx
│       │   └── deployment.yaml
│       └── pihole
│           └── deployment.yaml
└── README.md
`,
        expectedResult: { uk: "Ви бачите всі створені маніфести у відповідних папках.", en: "You see all created manifests in their respective folders." }
      },
      {
        title: { uk: "DevOps Порада: Примусова синхронізація", en: "DevOps Tip: Force sync" },
        description: { uk: "Flux автоматично побачить зміни через 1-5 хвилин. Щоб пришвидшити (виконати на mini1):", en: "Flux will automatically see changes in 1-5 minutes. To speed it up (run on mini1):" },
        command: "flux reconcile kustomization flux-system --with-source\nkubectl get pods",
        expectedResult: { uk: "Flux миттєво застосує нові маніфести. З'являться поди nginx, pihole та homeassistant.", en: "Flux instantly applies new manifests. Pods for nginx, pihole, and homeassistant will appear." }
      }
    ]
  },
  {
    id: 12,
    title: { uk: "DevOps Фішки", en: "DevOps Tips & Tricks" },
    description: { uk: "Поради від досвідчених інженерів для професійного управління", en: "Tips from experienced engineers for professional management" },
    steps: [
      {
        title: { uk: "K9s: Термінальний UI", en: "K9s: Terminal UI" },
        description: { uk: "Найкращий інструмент для управління кластером з консолі. Дозволяє швидко дивитися логи та редагувати ресурси.", en: "The best tool for cluster management from the console. Allows you to quickly view logs and edit resources." },
        command: "curl -sS https://webinstall.dev/k9s | bash\nk9s",
        expectedResult: { uk: "Відкриється інтерактивний інтерфейс K9s в терміналі.", en: "Interactive K9s interface opens in the terminal." }
      },
      {
        title: { uk: "Alias для kubectl", en: "Kubectl Aliases" },
        description: { uk: "Зекономте тисячі натискань клавіш. Додайте це у ваш ~/.bashrc", en: "Save thousands of keystrokes. Add this to your ~/.bashrc" },
        command: "echo \"alias k='kubectl'\" >> ~/.bashrc\necho \"complete -F __start_kubectl k\" >> ~/.bashrc\nsource ~/.bashrc",
        expectedResult: { uk: "Тепер ви можете використовувати 'k' замість 'kubectl'.", en: "You can now use 'k' instead of 'kubectl'." }
      },
      {
        title: { uk: "Stern: Логи декількох Pods", en: "Stern: Multi-Pod Logs" },
        description: { uk: "Дозволяє дивитися логи декількох подів одночасно за допомогою regex.", en: "Allows you to view logs of multiple pods simultaneously using regex." },
        command: "wget https://github.com/stern/stern/releases/download/v1.30.0/stern_1.30.0_linux_amd64.tar.gz\ntar xvf stern_1.30.0_linux_amd64.tar.gz\nsudo mv stern /usr/local/bin/\nstern \".*\" --all-namespaces",
        expectedResult: { uk: "Stern встановлено, команда покаже логи всіх подів у кластері.", en: "Stern installed, the command will show logs of all pods in the cluster." }
      }
    ]
  },
  {
    id: 13,
    title: { uk: "Моніторинг", en: "Monitoring" },
    description: { uk: "Prometheus + Grafana", en: "Prometheus + Grafana" },
    steps: [
      {
        title: { uk: "Встановлення через Helm", en: "Install via Helm" },
        command: "helm repo add prometheus-community https://prometheus-community.github.io/helm-charts\nhelm repo update\nhelm install prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace",
        expectedResult: { uk: "Створено namespace 'monitoring' та розгорнуто стек Prometheus/Grafana.", en: "Namespace 'monitoring' created and Prometheus/Grafana stack deployed." },
        expectedOutput: "NAME: prometheus-stack\nLAST DEPLOYED: ...\nNAMESPACE: monitoring\nSTATUS: deployed\nREVISION: 1",
        possibleErrors: { uk: "cannot re-use a name that is still in use: видаліть попередній реліз (helm uninstall prometheus-stack -n monitoring).", en: "cannot re-use a name that is still in use: delete the previous release (helm uninstall prometheus-stack -n monitoring)." },
        note: { uk: "Цей посібник встановлює базовий стек. Для повноцінного моніторингу вам також потрібно налаштувати Persistent Volumes для збереження метрик після рестарту, а також додати кастомні дашборди в Grafana та правила для Alertmanager (наприклад, сповіщення в Telegram).", en: "This guide installs the basic stack. For comprehensive monitoring, you also need to configure Persistent Volumes to save metrics across restarts, and add custom Grafana dashboards and Alertmanager rules (e.g., Telegram notifications)." }
      },
      {
        title: { uk: "Відкриття доступу до Grafana", en: "Expose Grafana" },
        description: { uk: "Зробимо Grafana доступною ззовні через NodePort 30300. Логін: admin, Пароль: prom-operator", en: "Make Grafana accessible externally via NodePort 30300. Login: admin, Password: prom-operator" },
        command: "kubectl patch svc prometheus-stack-grafana -n monitoring -p '{\"spec\": {\"type\": \"NodePort\", \"ports\": [{\"port\": 80, \"nodePort\": 30300}]}}'",
        expectedResult: { uk: "Сервіс Grafana оновлено. Доступно за адресою http://mini1:30300", en: "Grafana service updated. Accessible at http://mini1:30300" }
      },
      {
        title: { uk: "Перевірка подів моніторингу", en: "Check monitoring pods" },
        command: "kubectl get pods -n monitoring",
        expectedResult: { uk: "Всі поди prometheus, grafana, alertmanager мають статус Running.", en: "All prometheus, grafana, alertmanager pods have Running status." }
      },
      {
        title: { uk: "Додавання дашборду Pi-hole", en: "Add Pi-hole Dashboard" },
        description: { uk: "Додамо дашборд Pi-hole до Grafana через ConfigMap.", en: "Add Pi-hole dashboard to Grafana via ConfigMap." },
        command: `cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards-pihole
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  pihole-dashboard.json: |-
    {
      "title": "Pi-hole",
      "tags": ["pihole"],
      "timezone": "browser",
      "panels": [
        {
          "type": "stat",
          "title": "Total Queries",
          "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
          "targets": [
            {
              "expr": "pihole_dns_queries_today",
              "refId": "A"
            }
          ]
        },
        {
          "type": "stat",
          "title": "Ads Blocked",
          "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
          "targets": [
            {
              "expr": "pihole_domains_being_blocked",
              "refId": "A"
            }
          ]
        }
      ],
      "schemaVersion": 30
    }
EOF`,
        expectedResult: { uk: "Дашборд 'Pi-hole' з'явиться в інтерфейсі Grafana.", en: "'Pi-hole' dashboard will appear in the Grafana UI." }
      }
    ]
  },
  {
    id: 14,
    title: { uk: "Логування", en: "Logging" },
    description: { uk: "Loki + Promtail", en: "Loki + Promtail" },
    steps: [
      {
        title: { uk: "Встановлення Loki", en: "Install Loki" },
        command: "helm repo add grafana https://grafana.github.io/helm-charts\nhelm repo update\nhelm install loki grafana/loki-stack --namespace monitoring",
        expectedResult: { uk: "Loki та Promtail розгорнуто в namespace 'monitoring'.", en: "Loki and Promtail deployed in 'monitoring' namespace." },
        expectedOutput: "NAME: loki\nLAST DEPLOYED: ...\nNAMESPACE: monitoring\nSTATUS: deployed\nREVISION: 1",
        possibleErrors: { uk: "Error: INSTALLATION FAILED: ... : переконайтеся, що namespace monitoring існує та helm repo оновлено.", en: "Error: INSTALLATION FAILED: ... : ensure the monitoring namespace exists and helm repo is updated." },
        note: { uk: "За замовчуванням Loki зберігає логи локально і не має довгострокового сховища. Для production налаштуйте S3-сумісне сховище (наприклад, MinIO або AWS S3) у values.yaml для Loki.", en: "By default, Loki stores logs locally and has no long-term storage. For production, configure an S3-compatible storage (e.g., MinIO or AWS S3) in values.yaml for Loki." }
      },
      {
        title: { uk: "Налаштування Loki як Datasource в Grafana", en: "Configure Loki Datasource in Grafana" },
        description: { uk: "Додамо Loki до Grafana автоматично через ConfigMap.", en: "Add Loki to Grafana automatically via ConfigMap." },
        command: `cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-datasource
  namespace: monitoring
  labels:
    grafana_datasource: "1"
data:
  loki-datasource.yaml: |-
    apiVersion: 1
    datasources:
    - name: Loki
      type: loki
      url: http://loki.monitoring.svc.cluster.local:3100
      access: proxy
      isDefault: false
EOF`,
        expectedResult: { uk: "ConfigMap створено. Grafana автоматично підхопить нове джерело даних Loki.", en: "ConfigMap created. Grafana will automatically pick up the new Loki datasource." }
      },
      {
        title: { uk: "Додавання дашбордів Grafana (Loki & Cluster)", en: "Add Grafana Dashboards (Loki & Cluster)" },
        description: { uk: "Завантажимо готові дашборди для логів та метрик кластера. Kube-prometheus-stack автоматично сканує ConfigMaps з міткою grafana_dashboard.", en: "Load pre-configured dashboards for logs and cluster metrics. Kube-prometheus-stack automatically scans ConfigMaps with the grafana_dashboard label." },
        command: `cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards-custom
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  loki-dashboard.json: |-
    {
      "title": "Loki Logs Dashboard",
      "tags": ["loki", "logs"],
      "timezone": "browser",
      "panels": [
        {
          "type": "logs",
          "title": "Cluster Logs",
          "gridPos": { "h": 20, "w": 24, "x": 0, "y": 0 },
          "targets": [
            {
              "expr": "{namespace=~\\".+\\"}",
              "refId": "A"
            }
          ],
          "datasource": "Loki"
        }
      ],
      "schemaVersion": 30
    }
EOF`,
        expectedResult: { uk: "Дашборд 'Loki Logs Dashboard' з'явиться в інтерфейсі Grafana.", en: "'Loki Logs Dashboard' will appear in the Grafana UI." }
      }
    ]
  },
  {
    id: 15,
    title: { uk: "Безпека (Hardening)", en: "Security (Hardening)" },
    description: { uk: "UFW та RBAC", en: "UFW and RBAC" },
    steps: [
      {
        title: { uk: "Налаштування UFW на обох вузлах", en: "UFW Setup on both nodes" },
        description: { uk: "Дозволяємо весь трафік всередині локальної мережі (network) для правильної роботи кластера, та відкриваємо потрібні порти назовні.", en: "Allow all traffic within the local network (network) for proper cluster operation, and open necessary ports to the outside." },
        command: "sudo ufw allow from network\nsudo ufw allow 22/tcp\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp\nsudo ufw enable\nsudo ufw status",
        expectedResult: { uk: "UFW активовано, правила застосовано. Трафік між вузлами дозволено.", en: "UFW activated, rules applied. Traffic between nodes is allowed." }
      }
    ]
  },
  {
    id: 16,
    title: { uk: "Troubleshooting", en: "Troubleshooting" },
    description: { uk: "Ремонт кластера", en: "Cluster repair" },
    steps: [
      {
        title: { uk: "Перевірка вузлів та подів", en: "Check Nodes and Pods" },
        command: "kubectl get nodes -o wide\nkubectl get pods -A",
        expectedResult: { uk: "Вивід списку всіх вузлів та подів з їхніми статусами.", en: "Output of the list of all nodes and pods with their statuses." }
      },
      {
        title: { uk: "Скидання вузла (Якщо все зламалося)", en: "Reset Node (If everything breaks)" },
        description: { uk: "Обережно! Це видалить Kubernetes з вузла.", en: "Careful! This will remove Kubernetes from the node." },
        command: "sudo kubeadm reset -f\nsudo rm -rf /etc/cni/net.d\nsudo rm -rf ~/.kube",
        expectedResult: { uk: "Вузол повністю очищено від конфігурацій Kubernetes.", en: "Node completely cleared of Kubernetes configurations." }
      }
    ]
  },
  {
    id: 17,
    title: { uk: "Фінальний Чеклист", en: "Final Checklist" },
    description: { uk: "Перевірка готовності", en: "Readiness check" },
    steps: [
      {
        title: { uk: "Тест Ingress", en: "Ingress Test" },
        description: { uk: "Перевіряємо, чи відповідає Nginx Ingress Controller на нашому NodePort.", en: "Checking if Nginx Ingress Controller responds on our NodePort." },
        command: "curl -I http://mini1:30080",
        expectedResult: { uk: "HTTP/1.1 404 Not Found (це нормально, означає що Nginx працює, але ще немає правил маршрутизації).", en: "HTTP/1.1 404 Not Found (this is normal, means Nginx is working but there are no routing rules yet)." }
      },
      {
        title: { uk: "Тест DNS", en: "DNS Test" },
        command: "kubectl exec -it -n default $(kubectl get pods -n default -l app=nginx-gitops -o jsonpath='{.items[0].metadata.name}') -- nslookup kubernetes.default",
        expectedResult: { uk: "Успішне розв'язання імені kubernetes.default в IP адресу сервісу.", en: "Successful resolution of kubernetes.default name to the service IP address." }
      }
    ]
  },
  {
    id: 18,
    title: { uk: "Професійні DevOps Практики", en: "Professional DevOps Practices" },
    description: { uk: "Інструменти рівня Enterprise для вашого домашнього кластера: балансувальники навантаження, управління секретами та бекапи.", en: "Enterprise-grade tools for your home cluster: load balancers, secret management, and backups." },
    steps: [
      {
        title: { uk: "MetalLB (Load Balancer)", en: "MetalLB (Load Balancer)" },
        description: { uk: "У хмарі (AWS, DO) LoadBalancer надається провайдером. На bare-metal потрібен MetalLB для виділення IP адрес сервісам.", en: "In the cloud (AWS, DO) LoadBalancer is provided by the provider. On bare-metal, MetalLB is needed to allocate IP addresses to services." },
        command: "kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.3/config/manifests/metallb-native.yaml\n\ncat <<EOF | kubectl apply -f -\napiVersion: metallb.io/v1beta1\nkind: IPAddressPool\nmetadata:\n  name: first-pool\n  namespace: metallb-system\nspec:\n  addresses:\n  - metallb_range\n---\napiVersion: metallb.io/v1beta1\nkind: L2Advertisement\nmetadata:\n  name: example\n  namespace: metallb-system\nEOF",
        expectedResult: { uk: "MetalLB встановлено, пул IP адрес налаштовано.", en: "MetalLB installed, IP address pool configured." },
        note: { uk: "Обов'язково зарезервуйте діапазон IP-адрес, який ви виділите для MetalLB, у налаштуваннях DHCP вашого домашнього роутера, щоб він не видав їх іншим пристроям (смартфонам, ноутбукам).", en: "Make sure to reserve the IP range you allocate for MetalLB in your home router's DHCP settings so it doesn't assign them to other devices (smartphones, laptops)." }
      },
      {
        title: { uk: "Sealed Secrets: Встановлення", en: "Sealed Secrets: Installation" },
        description: { uk: "Зберігати паролі в Git небезпечно. Sealed Secrets шифрує їх так, що розшифрувати може лише ваш кластер. Встановлюємо контролер у kube-system та CLI (kubeseal).", en: "Storing passwords in Git is unsafe. Sealed Secrets encrypts them so only your cluster can decrypt them. Install the controller in kube-system and the CLI (kubeseal)." },
        command: "helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets\nhelm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system --set-string fullnameOverride=sealed-secrets-controller\n\n# Встановлення CLI (kubeseal)\nwget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.26.2/kubeseal-0.26.2-linux-amd64.tar.gz\ntar -xvzf kubeseal-0.26.2-linux-amd64.tar.gz kubeseal\nsudo install -m 755 kubeseal /usr/local/bin/kubeseal",
        expectedResult: { uk: "Контролер Sealed Secrets та CLI kubeseal встановлено.", en: "Sealed Secrets controller and kubeseal CLI installed." }
      },
      {
        title: { uk: "Sealed Secrets: Створення базового секрету", en: "Sealed Secrets: Create base secret" },
        description: { uk: "Створюємо звичайний Kubernetes Secret у вигляді YAML файлу (без застосування в кластер).", en: "Create a regular Kubernetes Secret as a YAML file (without applying to the cluster)." },
        command: "kubectl create secret generic db-password --from-literal=password=SuperSecret123! --dry-run=client -o yaml > db-password.yaml\n\ncat db-password.yaml",
        expectedResult: { uk: "Файл db-password.yaml створено з закодованим у base64 паролем.", en: "File db-password.yaml created with base64 encoded password." }
      },
      {
        title: { uk: "Sealed Secrets: Шифрування (Sealing)", en: "Sealed Secrets: Encryption (Sealing)" },
        description: { uk: "Використовуємо kubeseal для шифрування секрету. Цей файл безпечно зберігати в Git (GitOps).", en: "Use kubeseal to encrypt the secret. This file is safe to store in Git (GitOps)." },
        command: "kubeseal --format=yaml --controller-namespace=kube-system --controller-name=sealed-secrets-controller < db-password.yaml > sealed-db-password.yaml\n\ncat sealed-db-password.yaml",
        expectedResult: { uk: "Створено файл sealed-db-password.yaml із зашифрованими даними.", en: "File sealed-db-password.yaml created with encrypted data." }
      },
      {
        title: { uk: "Sealed Secrets: Застосування та Перевірка", en: "Sealed Secrets: Apply and Verify" },
        description: { uk: "Застосовуємо зашифрований секрет у кластер. Контролер автоматично розшифрує його у звичайний Secret.", en: "Apply the encrypted secret to the cluster. The controller will automatically decrypt it into a regular Secret." },
        command: "kubectl apply -f sealed-db-password.yaml\n\n# Чекаємо кілька секунд і перевіряємо\nkubectl get secret db-password\nkubectl get sealedsecret db-password",
        expectedResult: { uk: "Звичайний Secret 'db-password' успішно створено контролером.", en: "Regular Secret 'db-password' successfully created by the controller." }
      },
      {
        title: { uk: "Sealed Secrets: Бекап Майстер-ключа (КРИТИЧНО)", en: "Sealed Secrets: Backup Master Key (CRITICAL)" },
        description: { uk: "Якщо кластер впаде, ви втратите ключ для розшифровки всіх секретів у Git. Зробіть бекап ключа і зберігайте його в надійному місці (наприклад, 1Password).", en: "If the cluster crashes, you will lose the key to decrypt all secrets in Git. Backup the key and store it in a safe place (e.g., 1Password)." },
        command: "kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > master-key-backup.yaml\n\necho \"ЗБЕРЕЖІТЬ master-key-backup.yaml У БЕЗПЕЧНОМУ МІСЦІ ТА ВИДАЛІТЬ З СЕРВЕРА!\"",
        expectedResult: { uk: "Майстер-ключ збережено у файл master-key-backup.yaml.", en: "Master key saved to master-key-backup.yaml file." }
      },
      {
        title: { uk: "Cert-Manager (Автоматичні SSL сертифікати)", en: "Cert-Manager (Automated SSL Certificates)" },
        description: { uk: "Автоматично випускає та оновлює безкоштовні сертифікати від Let's Encrypt для ваших доменів.", en: "Automatically issues and renews free certificates from Let's Encrypt for your domains." },
        command: "kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml",
        expectedResult: { uk: "Cert-Manager встановлено у кластері.", en: "Cert-Manager installed in the cluster." },
        note: { uk: "Для локальних (внутрішніх) доменів HTTP-01 challenge не спрацює. Вам знадобиться налаштувати DNS-01 challenge (наприклад, через Cloudflare API token), щоб отримувати wildcard сертифікати для локальної мережі.", en: "For local (internal) domains, HTTP-01 challenge will not work. You will need to configure DNS-01 challenge (e.g., via Cloudflare API token) to get wildcard certificates for your local network." }
      },
      {
        title: { uk: "Velero: Встановлення CLI", en: "Velero: CLI Installation" },
        description: { uk: "Завантажуємо та встановлюємо утиліту командного рядка Velero для керування бекапами.", en: "Download and install the Velero command-line utility for managing backups." },
        command: "wget https://github.com/vmware-tanzu/velero/releases/download/v1.13.1/velero-v1.13.1-linux-amd64.tar.gz\ntar -xvf velero-v1.13.1-linux-amd64.tar.gz\nsudo mv velero-v1.13.1-linux-amd64/velero /usr/local/bin/",
        expectedResult: { uk: "Velero CLI встановлено. Готово до налаштування S3 сховища.", en: "Velero CLI installed. Ready to configure S3 storage." }
      },
      {
        title: { uk: "Velero: Налаштування доступу до S3", en: "Velero: S3 Access Setup" },
        description: { uk: "Створюємо файл з доступами до вашого S3-сумісного сховища (AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces).", en: "Create a credentials file for your S3-compatible storage (AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces)." },
        command: "cat <<EOF > credentials-velero\n[default]\naws_access_key_id = YOUR_ACCESS_KEY\naws_secret_access_key = YOUR_SECRET_KEY\nEOF",
        expectedResult: { uk: "Файл credentials-velero створено з ключами доступу.", en: "credentials-velero file created with access keys." }
      },
      {
        title: { uk: "Velero: Встановлення в кластер", en: "Velero: Cluster Installation" },
        description: { uk: "Встановлюємо серверну частину Velero у кластер з плагіном AWS (підходить для будь-якого S3). Замініть BUCKET_NAME та REGION на свої. Для MinIO додайте параметри s3Url та s3ForcePathStyle.", en: "Install Velero server component with AWS plugin (works for any S3). Replace BUCKET_NAME and REGION. For MinIO, add s3Url and s3ForcePathStyle parameters." },
        command: "# Для AWS S3 / Cloudflare R2:\nvelero install \\\n  --provider aws \\\n  --plugins velero/velero-plugin-for-aws:v1.9.0 \\\n  --bucket BUCKET_NAME \\\n  --secret-file ./credentials-velero \\\n  --use-node-agent \\\n  --backup-location-config region=REGION\n\n# Для MinIO (додаткові параметри):\n# --backup-location-config region=minio,s3ForcePathStyle=\"true\",s3Url=http://minio.example.com",
        expectedResult: { uk: "Velero встановлено у неймспейс velero. Поди запущені.", en: "Velero installed in the velero namespace. Pods are running." }
      },
      {
        title: { uk: "Velero: Створення бекапу", en: "Velero: Create Backup" },
        description: { uk: "Робимо тестовий бекап певного неймспейсу (наприклад, default) або всього кластера.", en: "Make a test backup of a specific namespace (e.g., default) or the whole cluster." },
        command: "# Бекап конкретного неймспейсу\nvelero backup create my-first-backup --include-namespaces default\n\n# Бекап всього кластера (крім системних ресурсів)\nvelero backup create full-cluster-backup --exclude-namespaces kube-system,velero\n\n# Перевірка статусу\nvelero backup describe my-first-backup\nvelero backup logs my-first-backup",
        expectedResult: { uk: "Бекап успішно створено та завантажено у S3 сховище.", en: "Backup successfully created and uploaded to S3 storage." }
      },
      {
        title: { uk: "Velero: Відновлення з бекапу", en: "Velero: Restore from Backup" },
        description: { uk: "Відновлюємо дані з раніше створеного бекапу. Velero відтворить всі ресурси (Deployments, Services, PVCs).", en: "Restore data from a previously created backup. Velero will recreate all resources (Deployments, Services, PVCs)." },
        command: "velero restore create --from-backup my-first-backup\n\n# Перевірка статусу відновлення\nvelero restore get\nvelero restore describe <RESTORE_NAME>",
        expectedResult: { uk: "Ресурси успішно відновлено у кластері.", en: "Resources successfully restored in the cluster." }
      },
      {
        title: { uk: "Velero: Автоматичні бекапи за розкладом", en: "Velero: Scheduled Backups" },
        description: { uk: "Налаштовуємо щоденний бекап всього кластера о 2 годині ночі з терміном зберігання (TTL) 7 днів (168 годин).", en: "Setup daily full cluster backup at 2 AM with a Time-To-Live (TTL) of 7 days (168 hours)." },
        command: "velero schedule create daily-cluster-backup \\\n  --schedule=\"0 2 * * *\" \\\n  --exclude-namespaces kube-system,velero \\\n  --ttl 168h0m0s\n\n# Перевірка розкладів\nvelero schedule get",
        expectedResult: { uk: "Розклад створено. Velero автоматично робитиме бекапи.", en: "Schedule created. Velero will automatically make backups." },
        note: { uk: "Обов'язково періодично перевіряйте процес відновлення (Restore) на тестовому кластері. Бекап не має сенсу, якщо ви не впевнені, що зможете з нього відновитися. Також подбайте про безпеку S3-сховища (IAM політики, шифрування).", en: "Make sure to periodically test the restore process on a test cluster. A backup is useless if you are not sure you can restore from it. Also, ensure the security of your S3 storage (IAM policies, encryption)." }
      }
    ]
  },
  {
    id: 19,
    title: { uk: "GitOps: Структура Репозиторію", en: "GitOps: Repository Structure" },
    description: { uk: "Правильна архітектура папок та найкращі практики для керування кластером через GitHub.", en: "Proper folder architecture and best practices for managing the cluster via GitHub." },
    steps: [
      {
        title: { uk: "Створення еталонної структури", en: "Create reference structure" },
        description: { uk: "Стандартна структура для Flux CD розділяє конфігурацію кластера, інфраструктуру та додатки.", en: "The standard structure for Flux CD separates cluster configuration, infrastructure, and applications." },
        command: "mkdir -p homelab-gitops/{clusters/production,infrastructure/{controllers,storage},apps/{base,production}}\ncd homelab-gitops\ntree .",
        expectedOutput: ".\n├── apps\n│   ├── base\n│   └── production\n├── clusters\n│   └── production\n└── infrastructure\n    ├── controllers\n    └── storage"
      },
      {
        title: { uk: "Архітектура: Призначення папок", en: "Architecture: Folder purposes" },
        description: { uk: "1. clusters/production/ - Точка входу Flux. Містить файли, які вказують Flux, які папки застосовувати.\n2. infrastructure/ - Базові компоненти (Ingress, MetalLB, Cert-Manager). Застосовуються першими.\n3. apps/ - Ваші додатки (Homepage, Pi-hole). Застосовуються після інфраструктури.", en: "1. clusters/production/ - Flux entry point. Contains files telling Flux which folders to apply.\n2. infrastructure/ - Base components (Ingress, MetalLB, Cert-Manager). Applied first.\n3. apps/ - Your applications (Homepage, Pi-hole). Applied after infrastructure." }
      },
      {
        title: { uk: "Налаштування залежностей (Dependencies)", en: "Setting up dependencies" },
        description: { uk: "Додатки не повинні стартувати, поки не підніметься інфраструктура (наприклад, Ingress). У Flux це робиться через dependsOn.", en: "Apps shouldn't start until infrastructure (e.g., Ingress) is up. In Flux, this is done via dependsOn." },
        command: "cat <<EOF > clusters/production/apps.yaml\napiVersion: kustomize.toolkit.fluxcd.io/v1beta2\nkind: Kustomization\nmetadata:\n  name: apps\n  namespace: flux-system\nspec:\n  interval: 10m0s\n  dependsOn:\n    - name: infrastructure\n  sourceRef:\n    kind: GitRepository\n    name: flux-system\n  path: ./apps/production\n  prune: true\n  wait: true\nEOF",
        expectedResult: { uk: "Створено файл, який каже Flux розгортати папку apps/production ТІЛЬКИ після успішного розгортання infrastructure.", en: "Created a file telling Flux to deploy apps/production ONLY after successful infrastructure deployment." }
      },
      {
        title: { uk: "Найкращі практики GitOps", en: "GitOps Best Practices" },
        description: { uk: "1. Ніяких ручних змін (No kubectl edit): Всі зміни робляться ТІЛЬКИ через Git.\n2. Захист секретів: Використовуйте Sealed Secrets. Ніколи не пуште base64 секрети.\n3. DRY (Don't Repeat Yourself): Використовуйте apps/base для спільних налаштувань і apps/production для специфічних.\n4. Prune (Очищення): Завжди вмикайте prune: true. Якщо ви видалите файл з Git, Flux видалить ресурс з кластера.", en: "1. No manual changes (No kubectl edit): All changes are made ONLY via Git.\n2. Secret protection: Use Sealed Secrets. Never push base64 secrets.\n3. DRY: Use apps/base for common settings and apps/production for specific ones.\n4. Prune: Always enable prune: true. If you delete a file from Git, Flux deletes the resource from the cluster." }
      },
      {
        title: { uk: "Команди керування кластером", en: "Cluster management commands" },
        description: { uk: "Як керувати синхронізацією та дебажити Flux.", en: "How to manage synchronization and debug Flux." },
        command: "# Примусова синхронізація (не чекати 10 хвилин)\nflux reconcile kustomization apps --with-source\n\n# Перевірка статусу всіх Kustomizations\nflux get kustomizations\n\n# Призупинення оновлень (для дебагу)\nflux suspend kustomization apps\n\n# Відновлення оновлень\nflux resume kustomization apps\n\n# Перегляд логів Flux\nflux logs --tail=50",
        expectedResult: { uk: "Ви знаєте, як примусово оновити кластер, зупинити оновлення та подивитися логи.", en: "You know how to force update the cluster, pause updates, and view logs." }
      }
    ]
  },
  {
    id: 20,
    title: { uk: "Kubernetes Dashboard (Web UI)", en: "Kubernetes Dashboard (Web UI)" },
    description: { uk: "Офіційний веб-інтерфейс для керування кластером. Дозволяє візуально переглядати ресурси, деплоїти додатки та шукати помилки.", en: "The official web-based UI for managing the cluster. Allows visual overview of resources, deploying applications, and troubleshooting." },
    steps: [
      {
        title: { uk: "Встановлення Dashboard", en: "Install Dashboard" },
        description: { uk: "Встановлюємо Kubernetes Dashboard через Helm у неймспейс kubernetes-dashboard.", en: "Install the Kubernetes Dashboard via Helm in the kubernetes-dashboard namespace." },
        command: "helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/\nhelm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard",
        expectedResult: { uk: "Dashboard встановлено. Поди запущені.", en: "Dashboard installed. Pods are running." }
      },
      {
        title: { uk: "Створення ServiceAccount (Admin)", en: "Create ServiceAccount (Admin)" },
        description: { uk: "Створюємо користувача з правами адміністратора (cluster-admin) для доступу до всіх ресурсів через Dashboard.", en: "Create a user with administrator privileges (cluster-admin) to access all resources via the Dashboard." },
        command: "cat <<EOF | kubectl apply -f -\napiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: admin-user\n  namespace: kubernetes-dashboard\n---\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRoleBinding\nmetadata:\n  name: admin-user\nroleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: ClusterRole\n  name: cluster-admin\nsubjects:\n- kind: ServiceAccount\n  name: admin-user\n  namespace: kubernetes-dashboard\nEOF",
        expectedResult: { uk: "ServiceAccount та ClusterRoleBinding створено.", en: "ServiceAccount and ClusterRoleBinding created." }
      },
      {
        title: { uk: "Генерація токена доступу", en: "Generate Access Token" },
        description: { uk: "Генеруємо токен (Bearer Token), який буде використовуватися для входу в веб-інтерфейс.", en: "Generate a Bearer Token that will be used to log into the web interface." },
        command: "kubectl -n kubernetes-dashboard create token admin-user",
        expectedOutput: "eyJhbGciOiJSUzI1NiIsImtpZCI6... (довгий рядок токена)",
        expectedResult: { uk: "Токен згенеровано. Скопіюйте його, він знадобиться для входу.", en: "Token generated. Copy it, you will need it to log in." }
      },
      {
        title: { uk: "Доступ до Dashboard (Port Forward)", en: "Access Dashboard (Port Forward)" },
        description: { uk: "Прокидаємо порт для безпечного доступу до Dashboard з вашого комп'ютера.", en: "Forward a port to securely access the Dashboard from your computer." },
        command: "kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443",
        expectedResult: { uk: "Тепер відкрийте у браузері https://localhost:8443 і вставте скопійований токен.", en: "Now open https://localhost:8443 in your browser and paste the copied token." }
      }
    ]
  },
  {
    id: 21,
    title: { uk: "Renovate Bot (Автоматизація оновлень)", en: "Renovate Bot (Dependency Automation)" },
    description: { uk: "Інтеграція Renovate Bot для автоматичного створення Pull Requests при оновленні Docker-образів та Helm-чартів у GitOps репозиторії.", en: "Integrate Renovate Bot to automatically create Pull Requests when Docker images and Helm charts are updated in the GitOps repository." },
    steps: [
      {
        title: { uk: "Встановлення Renovate GitHub App", en: "Install Renovate GitHub App" },
        description: { uk: "Найпростіший спосіб - встановити офіційний додаток Renovate з GitHub Marketplace для вашого GitOps репозиторію.", en: "The easiest way is to install the official Renovate app from the GitHub Marketplace for your GitOps repository." },
        command: "# Перейдіть за посиланням та встановіть додаток:\n# https://github.com/apps/renovate",
        expectedResult: { uk: "Додаток Renovate встановлено та надано доступ до репозиторію.", en: "Renovate app installed and granted access to the repository." }
      },
      {
        title: { uk: "Конфігурація renovate.json", en: "Configure renovate.json" },
        description: { uk: "Створюємо файл конфігурації в корені репозиторію. Він налаштований на розпізнавання Kubernetes маніфестів, Helm чартів та FluxCD.", en: "Create a configuration file in the root of the repository. It is configured to recognize Kubernetes manifests, Helm charts, and FluxCD." },
        command: "cat <<EOF > renovate.json\n{\n  \"\\$schema\": \"https://docs.renovatebot.com/renovate-schema.json\",\n  \"extends\": [\n    \"config:recommended\",\n    \"docker:enableMajor\",\n    \"helpers:pinGitHubActionDigests\"\n  ],\n  \"kubernetes\": {\n    \"fileMatch\": [\"\\\\.yaml$\"]\n  },\n  \"flux\": {\n    \"fileMatch\": [\"clusters/.+\\\\.yaml$\", \"apps/.+\\\\.yaml$\"]\n  },\n  \"packageRules\": [\n    {\n      \"matchUpdateTypes\": [\"minor\", \"patch\"],\n      \"automerge\": true\n    }\n  ]\n}\nEOF\ngit add renovate.json\ngit commit -m \"Add Renovate configuration\"\ngit push",
        expectedResult: { uk: "Файл renovate.json додано. Renovate почне сканувати репозиторій.", en: "renovate.json added. Renovate will start scanning the repository." }
      },
      {
        title: { uk: "Перевірка Pull Requests", en: "Check Pull Requests" },
        description: { uk: "Renovate створить 'Dependency Dashboard' issue та почне відкривати PR для оновлення застарілих образів та чартів.", en: "Renovate will create a 'Dependency Dashboard' issue and start opening PRs to update outdated images and charts." },
        command: "# Відкрийте вкладку Pull Requests у вашому GitHub репозиторії",
        expectedResult: { uk: "Ви бачите автоматично створені PR від Renovate.", en: "You see automatically created PRs from Renovate." }
      },
      {
        title: { uk: "Розширена конфігурація (Розклад та Групування)", en: "Advanced Configuration (Schedule & Grouping)" },
        description: { uk: "Щоб зменшити кількість PR, можна згрупувати оновлення та налаштувати розклад (наприклад, тільки на вихідних).", en: "To reduce PR noise, you can group updates and set a schedule (e.g., weekends only)." },
        command: "cat <<EOF > renovate.json\n{\n  \"\\$schema\": \"https://docs.renovatebot.com/renovate-schema.json\",\n  \"extends\": [\n    \"config:recommended\",\n    \"docker:enableMajor\"\n  ],\n  \"timezone\": \"Europe/Kyiv\",\n  \"schedule\": [\"every weekend\"],\n  \"kubernetes\": { \"fileMatch\": [\"\\\\.yaml$\"] },\n  \"flux\": { \"fileMatch\": [\"clusters/.+\\\\.yaml$\", \"apps/.+\\\\.yaml$\"] },\n  \"packageRules\": [\n    {\n      \"matchUpdateTypes\": [\"minor\", \"patch\"],\n      \"groupName\": \"all non-major dependencies\",\n      \"automerge\": true\n    }\n  ]\n}\nEOF\ngit commit -am \"Update Renovate config\"\ngit push",
        expectedResult: { uk: "Renovate тепер створюватиме згруповані PR тільки на вихідних.", en: "Renovate will now create grouped PRs only on weekends." },
        note: { uk: "Автоматичне злиття (automerge) може бути небезпечним для production. Рекомендується налаштувати CI/CD пайплайн, який буде розгортати PR у staging-середовищі та проганяти тести перед злиттям у main гілку.", en: "Automerging can be dangerous for production. It is recommended to set up a CI/CD pipeline that deploys PRs to a staging environment and runs tests before merging into the main branch." }
      }
    ]
  },
  {
    id: 22,
    title: { uk: "K9s (Термінальний інтерфейс)", en: "K9s (Terminal UI)" },
    description: { uk: "K9s — це потужний термінальний інтерфейс (TUI) для зручної взаємодії з Kubernetes кластером без необхідності постійно вводити довгі команди kubectl.", en: "K9s is a powerful terminal UI to interact with your Kubernetes clusters without constantly typing long kubectl commands." },
    steps: [
      {
        title: { uk: "Встановлення K9s", en: "Install K9s" },
        description: { uk: "Завантажуємо та встановлюємо останню версію K9s для Linux.", en: "Download and install the latest version of K9s for Linux." },
        command: "wget https://github.com/derailed/k9s/releases/download/v0.32.4/k9s_Linux_amd64.tar.gz\ntar -xvf k9s_Linux_amd64.tar.gz\nsudo mv k9s /usr/local/bin/\nrm k9s_Linux_amd64.tar.gz",
        expectedResult: { uk: "K9s успішно встановлено.", en: "K9s successfully installed." }
      },
      {
        title: { uk: "Базові команди та гарячі клавіші", en: "Basic Commands and Shortcuts" },
        description: { uk: "Запустіть k9s у терміналі. Ось основні клавіші для керування:", en: "Run k9s in your terminal. Here are the basic shortcuts:" },
        command: "# Запуск\nk9s\n\n# Навігація (вводьте з двокрапкою):\n:pods       # Показати всі Pods\n:deploy     # Показати Deployments\n:svc        # Показати Services\n:ns         # Змінити Namespace\n\n# Дії над вибраним ресурсом:\nd           # Describe (детальний опис)\nl           # Logs (перегляд логів)\ e           # Edit (редагувати YAML)\nshift-f     # Port-forward (прокинути порт)\nctrl-d      # Видалити ресурс\n/           # Пошук\nctrl-c      # Вийти з K9s",
        expectedResult: { uk: "Ви можете швидко керувати кластером через інтерактивний інтерфейс.", en: "You can quickly manage the cluster through an interactive interface." }
      }
    ]
  },
  {
    id: 23,
    title: { uk: "Health Checks (Liveness & Readiness)", en: "Health Checks (Liveness & Readiness)" },
    description: { uk: "Налаштування проб для автоматичного моніторингу стану додатків та забезпечення їх стійкості.", en: "Configuring probes for automatic application health monitoring and ensuring resilience." },
    steps: [
      {
        title: { uk: "Перевірка стану проб", en: "Check Probes Status" },
        description: { uk: "Після додавання проб у маніфести, Kubernetes почне автоматично перевіряти стан ваших додатків. Ви можете побачити це у детальному описі пода.", en: "After adding probes to the manifests, Kubernetes will start automatically checking the status of your applications. You can see this in the pod description." },
        command: "kubectl describe pod -l app=nginx-gitops",
        expectedResult: { uk: "У розділі 'Liveness' та 'Readiness' ви побачите налаштовані параметри.", en: "In the 'Liveness' and 'Readiness' sections, you will see the configured parameters." }
      },
      {
        title: { uk: "Симуляція збою (Liveness)", en: "Simulate Failure (Liveness)" },
        description: { uk: "Якщо Liveness-проба не проходить, Kubernetes автоматично перезапустить под. Це допомагає при 'зависанні' додатку.", en: "If the Liveness probe fails, Kubernetes will automatically restart the pod. This helps when the application 'hangs'." },
        command: "# Для Nginx можна видалити index.html, щоб проба на / не пройшла:\nkubectl exec -it $(kubectl get pods -l app=nginx-gitops -o name) -- rm /usr/share/nginx/html/index.html",
        expectedResult: { uk: "Kubernetes помітить збій і перезапустить под через кілька секунд.", en: "Kubernetes will notice the failure and restart the pod after a few seconds." }
      },
      {
        title: { uk: "Симуляція збою (Readiness)", en: "Simulate Failure (Readiness)" },
        description: { uk: "Якщо Readiness-проба не проходить, Kubernetes перестане направляти трафік на цей под. Це корисно під час завантаження додатку або при тимчасових проблемах.", en: "If the Readiness probe fails, Kubernetes will stop directing traffic to this pod. This is useful during application startup or temporary issues." },
        command: "# Перевірте статус сервісу:\nkubectl get endpoints nginx-gitops",
        expectedResult: { uk: "Якщо под не готовий, його IP зникне зі списку Endpoints.", en: "If the pod is not ready, its IP will disappear from the Endpoints list." }
      }
    ]
  }
];

export interface Step {
  title: { uk: string; en: string };
  command?: string;
  description?: { uk: string; en: string };
  expectedResult?: { uk: string; en: string };
  expectedOutput?: string;
  possibleErrors?: { uk: string; en: string };
  note?: { uk: string; en: string };
}

export interface Phase {
  id: number;
  title: { uk: string; en: string };
  description: { uk: string; en: string };
  steps: Step[];
}
