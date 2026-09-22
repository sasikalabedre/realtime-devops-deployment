pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        DOCKERHUB_USERNAME = "${DOCKERHUB_CREDENTIALS_USR}"

        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/devops-3tier-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB_USERNAME}/devops-3tier-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"

        EC2_SSH_CREDENTIALS = 'ec2-ssh-key'
        EC2_HOST = 'YOUR_EC2_PUBLIC_IP_OR_DNS'
        EC2_USER = 'ubuntu'
        DEPLOY_DIR = '/opt/devops-3tier-app'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    set -e
                    docker build \
                      -t "$FRONTEND_IMAGE:$IMAGE_TAG" \
                      -t "$FRONTEND_IMAGE:latest" \
                      ./frontend
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    set -e
                    docker build \
                      -t "$BACKEND_IMAGE:$IMAGE_TAG" \
                      -t "$BACKEND_IMAGE:latest" \
                      ./backend
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                    set -e
                    echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login \
                      --username "$DOCKERHUB_CREDENTIALS_USR" \
                      --password-stdin

                    docker push "$FRONTEND_IMAGE:$IMAGE_TAG"
                    docker push "$FRONTEND_IMAGE:latest"

                    docker push "$BACKEND_IMAGE:$IMAGE_TAG"
                    docker push "$BACKEND_IMAGE:latest"

                    docker logout
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: [env.EC2_SSH_CREDENTIALS]) {
                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" \
                          "sudo mkdir -p '$DEPLOY_DIR' && sudo chown '$EC2_USER':'$EC2_USER' '$DEPLOY_DIR'"

                        scp -o StrictHostKeyChecking=no \
                          docker-compose.yml \
                          database/init.sql \
                          "$EC2_USER@$EC2_HOST:$DEPLOY_DIR/"

                        ssh -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "
                          set -e
                          cd '$DEPLOY_DIR'

                          export FRONTEND_IMAGE='$FRONTEND_IMAGE'
                          export BACKEND_IMAGE='$BACKEND_IMAGE'
                          export IMAGE_TAG='$IMAGE_TAG'
                          export POSTGRES_DB='employee_db'
                          export POSTGRES_USER='postgres'
                          export POSTGRES_PASSWORD='CHANGE_ME_ON_EC2'

                          echo 'Pulling images...'
                          docker compose pull

                          echo 'Starting application...'
                          docker compose up -d --remove-orphans

                          echo 'Running containers...'
                          docker compose ps

                          echo 'Testing backend health...'
                          sleep 10
                          curl -fsS http://127.0.0.1/api/health

                          echo 'Deployment successful.'
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Build ${BUILD_NUMBER}: images pushed and EC2 deployment completed."
        }
        failure {
            echo "Build ${BUILD_NUMBER}: pipeline failed."
        }
    }
}
