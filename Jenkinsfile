pipeline {

    agent any

    environment {

        // Docker Hub
        BACKEND_IMAGE  = 'yuvarajm1810/realtime-backend-v1'
        FRONTEND_IMAGE = 'yuvarajm1810/realtime-frontend-v1'

        // EC2
        EC2_USER    = 'ubuntu'
        EC2_HOST    = '13.206.69.111'
        EC2_APP_DIR = '/home/ubuntu/realtime-3tier-app'
    }

    stages {

        stage('Checkout') {
            steps {

                echo 'Checking out code from GitHub...'

                git(
                    branch: 'main',
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/yuvarajm-devops/devops-full-practice.git'
                )
            }
        }


        stage('Build Docker Images') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "Building Backend Image"
                    echo "======================================"

                    docker build \
                        -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend


                    echo "======================================"
                    echo "Building Frontend Image"
                    echo "======================================"

                    docker build \
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend


                    echo "Images built successfully."

                    docker images | grep realtime
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

                        echo "======================================"
                        echo "Logging into Docker Hub"
                        echo "======================================"

                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USERNAME" \
                            --password-stdin


                        echo "======================================"
                        echo "Pushing Backend Image"
                        echo "======================================"

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest


                        echo "======================================"
                        echo "Pushing Frontend Image"
                        echo "======================================"

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest


                        echo "Docker images pushed successfully."

                        docker logout
                    '''
                }
            }
        }


        stage('Prepare EC2') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "======================================"
                        echo "Preparing EC2"
                        echo "======================================"

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            mkdir -p ${EC2_APP_DIR}

                            cd ${EC2_APP_DIR}

                            echo "Stopping existing containers..."

                            docker compose down --remove-orphans || true

                            echo "EC2 is ready for new deployment."

EOF
                    '''
                }
            }
        }


        stage('Copy Docker Compose') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "======================================"
                        echo "Copying docker-compose.yml to EC2"
                        echo "======================================"

                        scp -o StrictHostKeyChecking=no \
                            docker-compose.yml \
                            ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/


                        echo "Copying database initialization file..."

                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} \
                            "mkdir -p ${EC2_APP_DIR}/database"


                        scp -o StrictHostKeyChecking=no \
                            database/init.sql \
                            ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/database/
                    '''
                }
            }
        }


        stage('Deploy to EC2') {
            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                        set -e

                        echo "======================================"
                        echo "Deploying Application to EC2"
                        echo "======================================"


                        ssh -o StrictHostKeyChecking=no \
                            ${EC2_USER}@${EC2_HOST} << EOF

                            set -e

                            cd ${EC2_APP_DIR}


                            echo "Pulling latest backend image..."

                            docker pull ${BACKEND_IMAGE}:latest


                            echo "Pulling latest frontend image..."

                            docker pull ${FRONTEND_IMAGE}:latest


                            echo "Starting application..."

                            docker compose up -d


                            echo "======================================"
                            echo "Removing unused Docker images"
                            echo "======================================"

                            docker image prune -f


                            echo "======================================"
                            echo "Deployment Status"
                            echo "======================================"

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
Please check the Jenkins console output.
'''
        }

        always {

            echo 'Jenkins pipeline execution completed.'
        }
    }
}
