# Realtime 3-Tier DevOps Application

This project is structured for a realistic beginner/junior DevOps workflow:

GitHub
  -> Jenkins
   -> Docker build
  -> Docker Hub
  -> AWS EC2
    O
  -> Docker Compose
  -> Nginx/React frontend
  -> Node.js backend
  -> PostgreSQL

# Application

- Frontend: React + Vite, served by Nginx
- Backend: Node.js + Express
- Database: PostgreSQL 17
- Containers: Docker
- Multi-container runtime: Docker Compose
- Registry: Docker Hub
- CI/CD: Jenkins
- Server: AWS EC2 Ubuntu

## Important

There are NO real passwords, Docker Hub credentials, or EC2 keys in this repository.

The following are intentionally placeholders and must be configured by you:

- `YOUR_DOCKERHUB_USERNAME`
- `CHANGE_ME`
- `YOUR_EC2_PUBLIC_IP_OR_DNS`
- Jenkins credential IDs such as `dockerhub-creds` and `ec2-ssh-key`

Do not commit real secrets to GitHub.

## Local test

1. Copy `.env.example` to  `.env`.
2. Set a local practice PostgreSQL password.
3. Build and start:

   docker compose up -d --build

4. Check:

   docker compose ps
   curl http://localhost/api/health
   curl http://localhost/api/employees

5. Open:

   http://localhost

## Docker Hub

Create two Docker Hub repositories:

- YOUR_DOCKERHUB_USERNAME/devops-3tier-frontend
- YOUR_DOCKERHUB_USERNAME/devops-3tier-backend

Jenkins builds and pushes both images with:

- a unique Jenkins build number tag
- the `latest` tag

Example:

frontend:15
frontend:latest

backend:15
backend:latest

## EC2

The EC2 deployment uses the images from Docker Hub. It does NOT rebuild the application source on EC2.

Only port 80 should be publicly exposed for the application. PostgreSQL 5432 and backend 5000 should not be opened in the EC2 security group.

## Jenkins credentials

Create:

1. `dockerhub-creds`
   - Username: your Docker Hub username
   - Password: Docker Hub access token

2. `ec2-ssh-key`
   - SSH private key credential for the EC2 Ubuntu user

Update `EC2_HOST` in the Jenkinsfile with the real EC2 public IP or DNS.

For a production environment, move database credentials to a proper secret store instead of putting them in the Jenkinsfile or shell environment.Thank you
