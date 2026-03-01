# Guide d'installation -- POS Mano Verde

Ce guide couvre toutes les methodes d'installation de POS Mano Verde, de la plus simple (cloud) a la plus avancee (serveur local, Docker, Raspberry Pi).

---

## Table des matieres

- [A. Installation rapide (Cloud / Vercel)](#a-installation-rapide-cloud--vercel)
- [B. Installation locale (Serveur en boutique)](#b-installation-locale-serveur-en-boutique)
- [C. Installation Docker (Recommandee pour production)](#c-installation-docker-recommandee-pour-production)
- [D. Installation sur Raspberry Pi](#d-installation-sur-raspberry-pi)
- [E. Configuration reseau et hotspot WiFi](#e-configuration-reseau-et-hotspot-wifi)

---

## A. Installation rapide (Cloud / Vercel)

Cette methode est la plus simple. L'application est hebergee dans le cloud et accessible depuis n'importe quel appareil avec un navigateur web.

### Etape 1 : Acceder a l'application

Ouvrez votre navigateur et rendez-vous sur :

```
https://pos.manoverde.com
```

L'application fonctionne sur Chrome, Edge, Safari et Firefox (recommande : **Google Chrome** pour le support Bluetooth).

### Etape 2 : Creer un compte

1. Cliquez sur **"Commencer"** sur la page d'accueil.
2. Choisissez votre type d'activite (restaurant, supermarche, pharmacie, etc.).
3. Renseignez le nom de votre boutique, votre adresse et votre telephone.
4. Creez votre compte administrateur (email + mot de passe).
5. Definissez un code PIN a 4 chiffres pour l'acces rapide.

### Etape 3 : Configurer votre boutique

Une fois connecte :

1. Ajoutez vos **produits** (nom, prix, categorie, stock initial).
2. Creez les **comptes employes** (caissiers, gerants).
3. Configurez les **parametres** (taxe, devise, impression).

> **Astuce** : L'application fonctionne aussi hors-ligne. Toutes les ventes sont sauvegardees localement et synchronisees automatiquement quand Internet revient.

### Etape 4 : Installer comme application (optionnel)

Pour une experience de type application native :

1. Ouvrez l'application dans Chrome.
2. Cliquez sur l'icone "Installer" dans la barre d'adresse (ou Menu > "Installer l'application").
3. L'application apparait sur votre bureau ou ecran d'accueil.

---

## B. Installation locale (Serveur en boutique)

Cette methode installe un serveur local dans votre boutique. Les tablettes et telephones se connectent a ce serveur via le reseau WiFi local. **Aucune connexion Internet n'est requise** apres l'installation.

### Prerequis systeme

| Prerequis | Version minimale |
|-----------|-----------------|
| **Node.js** | 20.0 ou superieur |
| **npm** | 10.0 ou superieur |
| **Systeme d'exploitation** | Windows 10+, macOS 12+, Ubuntu 22.04+, Debian 12+ |
| **RAM** | 2 Go minimum (4 Go recommande) |
| **Stockage** | 500 Mo d'espace libre |

Verifiez votre version de Node.js :

```bash
node --version   # doit afficher v20.x.x ou superieur
npm --version    # doit afficher 10.x.x ou superieur
```

Si Node.js n'est pas installe, telechargez-le depuis [nodejs.org](https://nodejs.org/).

### Etape 1 : Cloner le depot

```bash
git clone https://github.com/manoverde/pos-app.git
cd pos-app
```

Ou telechargez l'archive ZIP depuis la page Releases et decompressez-la.

### Etape 2 : Installer les dependances du backend

```bash
cd backend
npm install
```

> **Note** : Le module `better-sqlite3` necessite des outils de compilation (Python 3, Make, GCC/G++). Sur Windows, installez les "Build Tools" avec `npm install -g windows-build-tools`. Sur macOS, installez Xcode Command Line Tools avec `xcode-select --install`. Sur Ubuntu/Debian : `sudo apt install python3 make g++`.

### Etape 3 : Installer les dependances du frontend

```bash
cd ../frontend
npm install
```

### Etape 4 : Configurer les variables d'environnement

Creez ou modifiez le fichier `backend/.env` :

```env
# Port du serveur (par defaut : 4000)
PORT=4000

# Cle secrete pour les tokens JWT (CHANGEZ CETTE VALEUR EN PRODUCTION)
JWT_SECRET=votre-cle-secrete-unique-et-longue

# Chemin de la base de donnees SQLite (par defaut : ./pos.db)
# DB_PATH=/chemin/vers/pos.db

# Supabase (optionnel - pour la synchronisation cloud)
# VITE_SUPABASE_URL=https://votre-projet.supabase.co
# VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

> **Important** : Changez absolument le `JWT_SECRET` avant la mise en production. Utilisez une chaine aleatoire d'au moins 32 caracteres.

### Etape 5 : Compiler le frontend

```bash
cd frontend
npm run build
```

Le frontend compile est genere dans le dossier `frontend/dist/`. Le serveur backend servira automatiquement ces fichiers statiques.

### Etape 6 : Demarrer le serveur

```bash
cd ../backend
npm start
```

Vous verrez s'afficher :

```
============================================================
  POS Mano Verde - Server Started
============================================================

  Local:    http://localhost:4000
  Network:  http://192.168.1.100:4000  (Wi-Fi)

  Store:    Mano Verde
  Database: /chemin/vers/pos.db

  API:      /api/health
  WebSocket: Enabled (Socket.IO)

  Default login:
    Email: admin@manoverde.com
    Password: admin123
    PIN: 1234
============================================================
```

### Etape 7 : Acceder a l'application

- **Sur le serveur** : Ouvrez `http://localhost:4000` dans votre navigateur.
- **Sur les tablettes/telephones** : Connectez-les au meme reseau WiFi, puis ouvrez `http://192.168.1.100:4000` (remplacez par l'adresse IP affichee dans le terminal).

### Etape 8 : Connexion initiale

Utilisez les identifiants par defaut :

- **Email** : `admin@manoverde.com`
- **Mot de passe** : `admin123`
- **PIN** : `1234`

> **Securite** : Changez le mot de passe et le PIN immediatement apres la premiere connexion dans la section *Parametres*.

### Mode developpement

Pour le developpement avec rechargement automatique :

```bash
# Terminal 1 -- Backend (port 4000)
cd backend
npm run dev

# Terminal 2 -- Frontend (port 5173)
cd frontend
npm run dev
```

Le frontend en mode developpement ecoute sur `http://localhost:5173` et communique avec le backend sur `http://localhost:4000`.

---

## C. Installation Docker (Recommandee pour production)

Docker simplifie le deploiement et garantit un environnement reproductible. C'est la methode recommandee pour un usage en production.

### Prerequis

- **Docker** 24.0 ou superieur
- **Docker Compose** v2 ou superieur

Installation de Docker :

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# macOS : installez Docker Desktop depuis https://docker.com

# Windows : installez Docker Desktop depuis https://docker.com
```

### Etape 1 : Preparer le projet

```bash
git clone https://github.com/manoverde/pos-app.git
cd pos-app
```

### Etape 2 : Compiler le frontend

Le conteneur Docker monte le frontend compile depuis `frontend/dist/`. Compilez-le d'abord :

```bash
cd frontend
npm install
npm run build
cd ..
```

### Etape 3 : Configurer les variables d'environnement

Creez un fichier `.env` a la racine du projet :

```env
JWT_SECRET=votre-cle-secrete-tres-longue-et-unique-pour-production
```

### Etape 4 : Lancer avec Docker Compose

```bash
docker-compose up -d
```

Le serveur demarre sur le port **4000**. Verifiez qu'il fonctionne :

```bash
# Verifier l'etat du conteneur
docker-compose ps

# Voir les logs
docker-compose logs -f pos-server

# Tester le endpoint de sante
curl http://localhost:4000/api/health
```

### Configuration du fichier `docker-compose.yml`

Le fichier de configuration par defaut :

```yaml
version: '3.8'
services:
  pos-server:
    build: ./backend
    container_name: pos-manoverde
    ports:
      - "4000:4000"
    volumes:
      - pos-data:/data
      - ./frontend/dist:/app/public
    environment:
      - PORT=4000
      - JWT_SECRET=${JWT_SECRET:-pos-manoverde-production-key}
      - DB_PATH=/data/pos.db
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  pos-data:
    driver: local
```

### Volumes et persistance des donnees

La base de donnees SQLite est stockee dans le volume Docker `pos-data`. Ce volume persiste meme si le conteneur est supprime.

```bash
# Voir les volumes Docker
docker volume ls

# Inspecter le volume
docker volume inspect pos-app_pos-data

# ATTENTION : Supprimer le volume efface TOUTES les donnees
# docker volume rm pos-app_pos-data
```

**Sauvegarde de la base de donnees :**

```bash
# Copier la base de donnees hors du conteneur
docker cp pos-manoverde:/data/pos.db ./backup-pos.db

# Restaurer une sauvegarde
docker cp ./backup-pos.db pos-manoverde:/data/pos.db
docker-compose restart
```

### Mise a jour de l'application

```bash
# Tirer les dernieres modifications
git pull

# Recompiler le frontend
cd frontend && npm install && npm run build && cd ..

# Reconstruire et relancer le conteneur
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Changer le port

Pour utiliser un port different (par exemple 8080) :

```yaml
ports:
  - "8080:4000"
```

---

## D. Installation sur Raspberry Pi

Le Raspberry Pi est une excellente option comme serveur POS en boutique : compact, silencieux, faible consommation electrique.

### Materiel recommande

| Composant | Recommandation |
|-----------|---------------|
| **Modele** | Raspberry Pi 4 Model B (4 Go RAM) ou Raspberry Pi 5 |
| **Stockage** | Carte microSD 32 Go (classe 10) ou SSD USB |
| **Alimentation** | Bloc d'alimentation officiel 5V/3A (USB-C) |
| **Reseau** | WiFi integre ou cable Ethernet |

### Etape 1 : Installer le systeme d'exploitation

1. Telechargez **Raspberry Pi Imager** depuis [raspberrypi.com](https://www.raspberrypi.com/software/).
2. Flashez **Raspberry Pi OS Lite (64-bit)** sur votre carte SD.
3. Lors de la configuration dans Raspberry Pi Imager :
   - Activez le SSH.
   - Configurez le WiFi (nom du reseau + mot de passe).
   - Definissez un nom d'hote (ex: `pos-server`).
   - Definissez un nom d'utilisateur et un mot de passe.

4. Inserez la carte SD et demarrez le Raspberry Pi.

### Etape 2 : Se connecter en SSH

```bash
ssh votre-utilisateur@pos-server.local
```

### Etape 3 : Installer Docker sur ARM

```bash
# Mettre a jour le systeme
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sudo sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Se deconnecter et reconnecter pour appliquer
exit
ssh votre-utilisateur@pos-server.local

# Verifier l'installation
docker --version
docker compose version
```

### Etape 4 : Deployer l'application

```bash
# Cloner le projet
git clone https://github.com/manoverde/pos-app.git
cd pos-app

# Compiler le frontend (sur le Pi ou copier le dossier dist/ depuis un autre PC)
cd frontend && npm install && npm run build && cd ..

# Configurer le secret JWT
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Lancer avec Docker
docker compose up -d
```

### Etape 5 : Configurer le demarrage automatique

Docker avec `restart: unless-stopped` redemarrera automatiquement le conteneur apres un reboot. Assurez-vous que Docker demarre au boot :

```bash
sudo systemctl enable docker
```

Pour verifier apres un reboot :

```bash
sudo reboot

# Apres le reboot, verifier que le conteneur tourne
docker ps
```

### Etape 6 : Configurer une adresse IP fixe

Pour que les tablettes trouvent toujours le serveur, configurez une IP fixe sur le Raspberry Pi.

Editez le fichier de configuration reseau :

```bash
sudo nano /etc/dhcpcd.conf
```

Ajoutez a la fin du fichier (adaptez selon votre reseau) :

```
# WiFi - IP fixe
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8

# Ethernet - IP fixe (si cable)
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8
```

Redemarrez le service reseau :

```bash
sudo systemctl restart dhcpcd
```

L'application est maintenant toujours accessible a : `http://192.168.1.100:4000`

### Optimisations pour Raspberry Pi

```bash
# Augmenter la memoire swap (utile pour la compilation)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=512/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Desactiver les services inutiles
sudo systemctl disable bluetooth   # si vous n'utilisez pas le Bluetooth du Pi
sudo systemctl disable avahi-daemon # si vous n'utilisez pas mDNS
```

---

## E. Configuration reseau et hotspot WiFi

Pour connecter plusieurs terminaux (tablettes, telephones) au serveur POS, vous avez deux options :

1. **Routeur WiFi existant** -- Tous les appareils sont sur le meme reseau.
2. **Hotspot WiFi** -- Le serveur POS cree son propre reseau WiFi.

### Option 1 : Routeur WiFi existant (recommande)

Si votre boutique dispose deja d'un routeur WiFi :

1. Connectez le serveur POS (PC ou Raspberry Pi) au WiFi.
2. Connectez les tablettes/telephones au meme WiFi.
3. Trouvez l'adresse IP du serveur.
4. Configurez cette adresse dans les navigateurs des tablettes.

**Trouver l'adresse IP du serveur :**

```bash
# Windows
ipconfig

# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
hostname -I
```

L'adresse est generalement de la forme `192.168.x.x` ou `10.0.x.x`.

### Option 2 : Creer un hotspot WiFi sur le serveur

Si vous n'avez pas de routeur ou si vous voulez un reseau dedie pour la caisse :

#### Windows 10/11

1. Ouvrez **Parametres** > **Reseau et Internet** > **Point d'acces mobile**.
2. Activez le **Point d'acces mobile**.
3. Configurez :
   - **Nom du reseau** : `POS-ManoVerde`
   - **Mot de passe** : un mot de passe fort
   - **Bande** : 2.4 GHz (meilleure portee)
4. Notez l'adresse IP affichee (generalement `192.168.137.1`).

#### macOS

1. Ouvrez **Preferences Systeme** > **Partage**.
2. Selectionnez **Partage Internet**.
3. Partagez depuis : **Wi-Fi** (ou Ethernet si vous avez un cable).
4. Vers les ordinateurs utilisant : **Wi-Fi**.
5. Configurez les options WiFi :
   - **Nom du reseau** : `POS-ManoVerde`
   - **Securite** : WPA2
   - **Mot de passe** : un mot de passe fort
6. Activez le partage.
7. L'adresse IP du Mac est generalement `192.168.2.1`.

#### Linux (NetworkManager)

```bash
# Creer un hotspot
sudo nmcli device wifi hotspot ifname wlan0 ssid "POS-ManoVerde" password "votre-mot-de-passe"

# Rendre le hotspot persistant
sudo nmcli connection modify Hotspot connection.autoconnect yes

# Trouver l'adresse IP attribuee
ip addr show wlan0
```

L'adresse IP est generalement `10.42.0.1`.

#### Raspberry Pi (avec hostapd)

```bash
# Installer les paquets necessaires
sudo apt install hostapd dnsmasq -y

# Configurer hostapd
sudo tee /etc/hostapd/hostapd.conf > /dev/null <<EOF
interface=wlan0
driver=nl80211
ssid=POS-ManoVerde
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=votre-mot-de-passe
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

# Configurer dnsmasq
sudo tee /etc/dnsmasq.conf > /dev/null <<EOF
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF

# Configurer l'interface reseau
sudo tee -a /etc/dhcpcd.conf > /dev/null <<EOF
interface wlan0
static ip_address=192.168.4.1/24
nohook wpa_supplicant
EOF

# Activer et demarrer les services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd dnsmasq
sudo reboot
```

Apres le redemarrage, le Raspberry Pi emet le reseau WiFi `POS-ManoVerde`. L'adresse du serveur POS est `192.168.4.1`.

### Connecter les tablettes et telephones

1. Sur chaque tablette/telephone, connectez-vous au WiFi `POS-ManoVerde`.
2. Ouvrez Chrome et accedez a :
   ```
   http://192.168.x.x:4000
   ```
   (remplacez par l'adresse IP du serveur)
3. Connectez-vous avec votre email/mot de passe ou votre PIN.
4. L'application detecte automatiquement le serveur et se synchronise.

### Configurer l'URL du serveur dans les clients

Si l'application ne detecte pas automatiquement le serveur :

1. Sur le terminal client (tablette/telephone), ouvrez l'application.
2. Allez dans **Parametres** > **Serveur**.
3. Entrez l'adresse du serveur : `http://192.168.x.x:4000`.
4. Cliquez sur **Tester la connexion**.
5. Si le test reussit, cliquez sur **Enregistrer**.

> **Note** : Le serveur POS utilise mDNS (Bonjour) pour s'annoncer sur le reseau local. Les clients tentent automatiquement de decouvrir le serveur. Si la decouverte automatique ne fonctionne pas, entrez l'adresse IP manuellement.

### Schema reseau type

```
                        +-----------------+
                        |   Routeur WiFi  |
                        |  192.168.1.1    |
                        +-------+---------+
                                |
              +-----------------+------------------+
              |                 |                  |
    +---------+------+  +-------+--------+  +------+---------+
    | Serveur POS    |  | Tablette #1    |  | Tablette #2    |
    | (PC/Pi)        |  | (Caissier)     |  | (Caissier)     |
    | 192.168.1.100  |  | Chrome         |  | Chrome         |
    | Port 4000      |  |                |  |                |
    +----------------+  +----------------+  +----------------+
```

---

## Verification post-installation

Quel que soit le mode d'installation, verifiez que tout fonctionne :

1. **Endpoint de sante** :
   ```bash
   curl http://localhost:4000/api/health
   ```
   Reponse attendue :
   ```json
   {
     "status": "ok",
     "server": "POS Mano Verde",
     "version": "1.0.0"
   }
   ```

2. **Interface web** : Ouvrez `http://localhost:4000` dans un navigateur.

3. **Connexion** : Connectez-vous avec `admin@manoverde.com` / `admin123`.

4. **Test multi-terminal** : Ouvrez l'application sur un second appareil et verifiez que les donnees se synchronisent.

---

## Prochaines etapes

- [Guide utilisateur](GUIDE_UTILISATEUR.md) -- Apprendre a utiliser la caisse.
- [Guide gerant](GUIDE_GERANT.md) -- Gerer les produits, le stock et les employes.
- [Guide administrateur](GUIDE_ADMIN.md) -- Administration technique avancee.
- [FAQ](FAQ.md) -- Questions frequentes.
