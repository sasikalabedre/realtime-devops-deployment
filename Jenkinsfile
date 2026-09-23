pipeline {

    agent any

    environment {

        // ==============================
        // Docker Hub
        // ==============================
        BACKEND_IMAGE  = 'yuvarajm1810/realtime-backend-v1'
        FRONTEND_IMAGE = 'yuvarajm1810/realtime-frontend-v1'

        // ==============================
        // GitHub
        // ==============================
        GIT_REPO = 'https://github.com/yuvarajm-devops/devops-full-practice.git'
        GIT_BRANCH = 'main'

        // ==============================
        // EC2
        // ==============================
        EC2_USER    = 'ubuntu'
        EC2_HOST    = '3.110.173.66'
        EC2_APP_DIR = '/home/ubuntu/realtime-3tier-app'
    }

    stages {

        // ==========================================
        // CHECKOUT
        // ==========================================

        stage('Checkout') {
            steps {

                echo '''
========================================
CHECKOUT FROM GITHUB
========================================
'''

                checkout([
                    $class: 'GitSCM',

                    branches: [[
                        name: "*/${GIT_BRANCH}"
                    ]],

                    userRemoteConfigs: [[
                        url: "${GIT_REPO}",
                        credentialsId: 'github-credentials'
                    ]]
                ])
            }
        }


        // ==========================================
        // BUILD BACKEND
        // ==========================================

        stage('Build Backend Image') {
            steps {

                sh '''
                    set -e

                    echo "========================================"
                    echo "BUILDING BACKEND IMAGE"
                    echo "========================================"

                    docker build \
                        -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend

                    echo "Backend image build completed."
                '''
            }
        }


        // ==========================================
        // BUILD FRONTEND
        // ==========================================

        stage('Build Frontend Image') {
            steps {

                sh '''
                    set -e

                    echo "========================================"
                    echo "BUILDING FRONTEND IMAGE"
                    echo "========================================"

                    docker build \
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend

                    echo "Frontend image build completed."
                '''
            }
        }


        // ==========================================
        // PUSH TO DOCKER HUB
        // ==========================================

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

                        echo "========================================"
                        echo "LOGIN TO DOCKER HUB"
                        echo "========================================"

                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin

                        echo "========================================"
                        echo "PUSHING BACKEND"
                        echo "========================================"

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest

                        echo "========================================"
                        echo "PUSHING FRONTEND"
                        echo "========================================"

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest

                        echo "========================================"
                        echo "DOCKER HUB PUSH COMPLETED"
                        echo "========================================"

                        docker logout
                    '''
                }
            }
        }


        // ==========================================
        // PREPARE EC2
        // ==========================================

        stage('Prepare EC2 Deployment Folder') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "CONNECTING TO EC2"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            echo "Creating application directory if required..."

                            mkdir -p ${EC2_APP_DIR}

                            cd ${EC2_APP_DIR}

                            echo "Current application directory:"
                            pwd

                            echo "Existing files:"
                            ls -la

EOF
                    '''
                }
            }
        }


        // ==========================================
        // COPY COMPOSE + DATABASE FILE
        // ==========================================

        stage('Copy Docker Compose') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "COPYING DOCKER COMPOSE FILE"
                        echo "========================================"

                        scp -o StrictHostKeyChecking=no \
                            docker-compose.yml \
                            ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/docker-compose.yml

                        echo "========================================"
                        echo "CREATING DATABASE DIRECTORY"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "mkdir -p ${EC2_APP_DIR}/database"

                        echo "========================================"
                        echo "COPYING DATABASE INIT FILE"
                        echo "========================================"

                        scp -o StrictHostKeyChecking=no \
                            database/init.sql \
                            ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/database/init.sql

                        echo "Compose and database files copied."
                    '''
                }
            }
        }


        // ==========================================
        // REMOVE OLD APPLICATION CONTAINERS
        // ==========================================

        stage('Remove Old Application Containers') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "REMOVING OLD APPLICATION CONTAINERS"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            echo "Stopping backend..."

                            docker stop employee-backend 2>/dev/null || true

                            echo "Removing backend..."

                            docker rm employee-backend 2>/dev/null || true


                            echo "Stopping frontend..."

                            docker stop employee-frontend 2>/dev/null || true

                            echo "Removing frontend..."

                            docker rm employee-frontend 2>/dev/null || true


                            echo "PostgreSQL container is NOT touched."

                            docker ps -a

EOF
                    '''
                }
            }
        }


        // ==========================================
        // REMOVE OLD APPLICATION IMAGES
        // ==========================================

        stage('Remove Old Application Images') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "REMOVING OLD APPLICATION IMAGES"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            docker rmi ${BACKEND_IMAGE}:latest 2>/dev/null || true

                            docker rmi ${FRONTEND_IMAGE}:latest 2>/dev/null || true

                            echo "Old application images removed."

EOF
                    '''
                }
            }
        }


        // ==========================================
        // PULL NEW IMAGES
        // ==========================================

        stage('Pull New Images') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "PULLING NEW BACKEND IMAGE"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "docker pull ${BACKEND_IMAGE}:latest"


                        echo "========================================"
                        echo "PULLING NEW FRONTEND IMAGE"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "docker pull ${FRONTEND_IMAGE}:latest"

                    '''
                }
            }
        }


        // ==========================================
        // DEPLOY
        // ==========================================

        stage('Deploy Application') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "DEPLOYING APPLICATION"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            cd ${EC2_APP_DIR}

                            echo "Starting Docker Compose..."

                            docker compose up -d

                            echo "========================================"
                            echo "APPLICATION STATUS"
                            echo "========================================"

                            docker compose ps

EOF
                    '''
                }
            }
        }


        // ==========================================
        // VERIFY
        // ==========================================

        stage('Verify Containers') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "========================================"
                        echo "VERIFYING EC2 CONTAINERS"
                        echo "========================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            echo "Running containers:"
                            docker ps

                            echo ""
                            echo "Compose status:"
                            cd ${EC2_APP_DIR}
                            docker compose ps

                            echo ""
                            echo "Checking backend container..."
                            docker ps --filter "name=employee-backend"

                            echo ""
                            echo "Checking frontend container..."
                            docker ps --filter "name=employee-frontend"

                            echo ""
                            echo "Checking database container..."
                            docker ps --filter "name=employee-db"

EOF
                    '''
                }
            }
        }


        // ==========================================
        // CLEAN JENKINS DOCKER CACHE
        // ==========================================

        stage('Cleanup Jenkins Docker Images') {

            steps {

                sh '''
                    set -e

                    echo "========================================"
                    echo "CLEANING UNUSED JENKINS IMAGES"
                    echo "========================================"

                    docker image prune -f

                    echo "Jenkins Docker cleanup completed."
                '''
            }
        }
    }


    // ==========================================
    // POST ACTIONS
    // ==========================================

    post {

        success {

            echo '''
========================================
DEPLOYMENT SUCCESSFUL
========================================

Backend image built and pushed.
Frontend image built and pushed.
EC2 application deployed successfully.
PostgreSQL/database was preserved.
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
