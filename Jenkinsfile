pipeline {

    agent any

    environment {

        // Docker Hub
        BACKEND_IMAGE  = 'yuvarajm1810/realtime-backend-v1'
        FRONTEND_IMAGE = 'yuvarajm1810/realtime-frontend-v1'

        // GitHub
        GIT_REPO   = 'https://github.com/yuvarajm-devops/devops-full-practice.git'
        GIT_BRANCH = 'main'

        // EC2
        EC2_USER    = 'ubuntu'
        EC2_HOST    = '3.110.173.66'
        EC2_APP_DIR = '/home/ubuntu/realtime-3tier-app'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'

                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${GIT_REPO}",
                        credentialsId: 'github-credentials'
                    ]]
                ])
            }
        }

        stage('Build Backend Image') {
            steps {
                echo 'Building backend Docker image...'

                sh '''
                    set -e

                    docker build \
                        -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo 'Building frontend Docker image...'

                sh '''
                    set -e

                    docker build \
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo 'Logging in to Docker Hub...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                echo 'Pushing Docker images to Docker Hub...'

                sh '''
                    set -e

                    docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${BACKEND_IMAGE}:latest

                    docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Logout Docker Hub') {
            steps {
                sh '''
                    docker logout || true
                '''
            }
        }

        stage('Test EC2 SSH Connection') {
            steps {
                echo 'Testing Jenkins to EC2 SSH connection...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" \
                            "echo 'SSH connection to EC2 successful'; hostname; docker --version"
                    '''
                }
            }
        }

        stage('Prepare EC2 Deployment Folder') {
            steps {
                echo 'Preparing EC2 deployment folder...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" \
                            "mkdir -p ${EC2_APP_DIR}/database"
                    '''
                }
            }
        }

        stage('Copy Docker Compose File') {
            steps {
                echo 'Copying docker-compose.yml to EC2...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        scp \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            docker-compose.yml \
                            "$SSH_USERNAME@$EC2_HOST:${EC2_APP_DIR}/docker-compose.yml"
                    '''
                }
            }
        }

        stage('Copy Database File') {
            steps {
                echo 'Copying database initialization file to EC2...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        scp \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            database/init.sql \
                            "$SSH_USERNAME@$EC2_HOST:${EC2_APP_DIR}/database/init.sql"
                    '''
                }
            }
        }

        stage('Stop Old Application Containers') {
            steps {
                echo 'Stopping old backend and frontend containers...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" << EOF

docker stop employee-backend employee-frontend 2>/dev/null || true

docker rm employee-backend employee-frontend 2>/dev/null || true

EOF
                    '''
                }
            }
        }

        stage('Remove Old Application Images') {
            steps {
                echo 'Removing old backend and frontend images from EC2...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" << EOF

docker image rm -f ${BACKEND_IMAGE}:latest 2>/dev/null || true
docker image rm -f ${FRONTEND_IMAGE}:latest 2>/dev/null || true

EOF
                    '''
                }
            }
        }

        stage('Pull Latest Images on EC2') {
            steps {
                echo 'Pulling latest images on EC2...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" << EOF

docker pull ${BACKEND_IMAGE}:latest
docker pull ${FRONTEND_IMAGE}:latest

EOF
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Deploying application with Docker Compose...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" << EOF

cd ${EC2_APP_DIR}

docker compose up -d --no-build --force-recreate

EOF
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Verifying deployed containers...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" << EOF

echo "===== ALL CONTAINERS ====="
docker ps

echo "===== BACKEND ====="
docker ps --filter "name=employee-backend"

echo "===== FRONTEND ====="
docker ps --filter "name=employee-frontend"

echo "===== DATABASE ====="
docker ps --filter "name=employee-db"

EOF
                    '''
                }
            }
        }

        stage('Cleanup Old Docker Images') {
            steps {
                echo 'Cleaning unused Docker images on EC2...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {

                    sh '''
                        set -e

                        chmod 600 "$EC2_KEY"

                        ssh \
                            -i "$EC2_KEY" \
                            -o StrictHostKeyChecking=no \
                            "$SSH_USERNAME@$EC2_HOST" \
                            "docker image prune -f"
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '''
=========================================
DEPLOYMENT SUCCESSFUL
=========================================
'''
            echo "Build Number: ${BUILD_NUMBER}"
            echo "Backend Image: ${BACKEND_IMAGE}:${BUILD_NUMBER}"
            echo "Frontend Image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
            echo "EC2 Server: ${EC2_HOST}"
        }

        failure {
            echo '''
=========================================
DEPLOYMENT FAILED
=========================================
'''
            echo "Check the failed stage above."
        }

        always {
            echo 'Jenkins pipeline completed.'
        }
    }
}
