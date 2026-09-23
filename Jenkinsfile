pipeline {

    agent any

    environment {
        FRONTEND_IMAGE = 'yuvarajm1810/realtime-frontend-v1'
        BACKEND_IMAGE  = 'yuvarajm1810/realtime-backend-v1'

        EC2_USER = 'ubuntu'
        EC2_HOST = '13.206.69.111'
        EC2_APP_DIR = '/home/ubuntu/realtime-3tier-app'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'

                checkout scm
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


        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest

                        docker logout
                    '''
                }
            }
        }


        stage('Deploy to EC2') {
            steps {
                echo 'Deploying to EC2...'

                sshagent(credentials: ['ec2-ssh']) {

                    sh '''
                        set -e

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << 'EOF'

                            set -e

                            echo "Entering application directory..."

                            cd ${EC2_APP_DIR}

                            echo "Removing old containers..."

                            docker rm -f \
                                employee-frontend \
                                employee-backend \
                                employee-db \
                                2>/dev/null || true

                            echo "Pulling latest images..."

                            docker compose pull

                            echo "Starting application..."

                            docker compose up -d

                            echo "Checking container status..."

                            docker compose ps

EOF
                    '''
                }
            }
        }
    }


    post {

        success {
            echo '''
            ==========================================
            DEPLOYMENT SUCCESSFUL
            ==========================================
            Frontend, Backend and Database are running
            successfully on EC2.
            ==========================================
            '''
        }

        failure {
            echo '''
            ==========================================
            DEPLOYMENT FAILED
            ==========================================
            Please check the Jenkins console output.
            ==========================================
            '''
        }

        always {
            echo 'Cleaning unused Docker images on Jenkins...'

            sh '''
                docker image prune -f || true
            '''
        }
    }
}
