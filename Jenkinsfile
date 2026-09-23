pipeline {

    agent any

    environment {

        // Docker Hub
        BACKEND_IMAGE  = 'yuvarajm1810/realtime-backend-v1'
        FRONTEND_IMAGE = 'yuvarajm1810/realtime-frontend-v1'

        // EC2
        EC2_USER    = 'ubuntu'
        EC2_HOST    = '3.110.173.66'
        EC2_APP_DIR = '/home/ubuntu/realtime-3tier-jenkins'
    }

    stages {

        stage('Checkout') {
            steps {

                echo '======================================'
                echo 'CHECKOUT FROM GITHUB'
                echo '======================================'

                git(
                    branch: 'main',
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/yuvarajm-devops/devops-full-practice.git'
                )
            }
        }

        stage('Build Backend Image') {
            steps {

                sh '''
                    set -e

                    echo '======================================'
                    echo 'BUILDING BACKEND IMAGE'
                    echo '======================================'

                    docker build \
                        -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend

                    echo 'Backend image build completed.'
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {

                sh '''
                    set -e

                    echo '======================================'
                    echo 'BUILDING FRONTEND IMAGE'
                    echo '======================================'

                    docker build \
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend

                    echo 'Frontend image build completed.'
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'LOGIN TO DOCKER HUB'
                        echo '======================================'

                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin

                        echo '======================================'
                        echo 'PUSHING BACKEND'
                        echo '======================================'

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest

                        echo '======================================'
                        echo 'PUSHING FRONTEND'
                        echo '======================================'

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest

                        docker logout

                        echo 'Docker Hub push completed.'
                    '''
                }
            }
        }

        stage('Prepare EC2 Deployment Folder') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'PREPARING EC2'
                        echo '======================================'

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "mkdir -p ${EC2_APP_DIR}"

                        echo 'EC2 deployment folder ready.'
                    '''
                }
            }
        }

        stage('Copy Docker Compose') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'COPYING DOCKER COMPOSE TO EC2'
                        echo '======================================'

                        scp -o StrictHostKeyChecking=no \
                            docker-compose.yml \
                            ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/docker-compose.yml

                        echo 'docker-compose.yml copied successfully.'
                    '''
                }
            }
        }

        stage('Verify EC2 Environment') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'VERIFYING EC2 ENVIRONMENT'
                        echo '======================================'

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            cd ${EC2_APP_DIR}

                            echo "Checking .env..."
                            test -f .env

                            echo ".env exists."

                            echo "Checking database directory..."
                            test -f database/init.sql

                            echo "database/init.sql exists."

EOF

                        echo 'EC2 environment verification completed.'
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'DEPLOYING APPLICATION'
                        echo '======================================'

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            cd ${EC2_APP_DIR}

                            echo "======================================"
                            echo "PULLING BACKEND IMAGE"
                            echo "======================================"

                            docker compose pull backend

                            echo "======================================"
                            echo "PULLING FRONTEND IMAGE"
                            echo "======================================"

                            docker compose pull frontend

                            echo "======================================"
                            echo "STARTING APPLICATION"
                            echo "======================================"

                            docker compose up -d

                            echo "======================================"
                            echo "APPLICATION STATUS"
                            echo "======================================"

                            docker compose ps

EOF

                        echo 'Application deployment completed.'
                    '''
                }
            }
        }

        stage('Verify Containers') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo '======================================'
                        echo 'VERIFYING CONTAINERS'
                        echo '======================================'

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "docker ps"

                        echo 'Container verification completed.'
                    '''
                }
            }
        }

        stage('Cleanup Jenkins Docker Images') {
            steps {

                sh '''
                    set -e

                    echo '======================================'
                    echo 'CLEANING JENKINS DOCKER CACHE'
                    echo '======================================'

                    docker image prune -f

                    echo 'Jenkins Docker cleanup completed.'
                '''
            }
        }
    }

    post {

        success {
            echo '''
========================================
DEPLOYMENT SUCCESSFUL
========================================

Realtime 3-tier application deployed successfully.
'''
        }

        failure {
            echo '''
========================================
DEPLOYMENT FAILED
========================================

Check the Jenkins Console Output.
'''
        }

        always {
            echo '''
========================================
JENKINS PIPELINE COMPLETED
========================================
'''
        }
    }
}
