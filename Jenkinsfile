pipeline {

    agent any

    environment {
        DOCKERHUB_USERNAME = 'sasikalabedre'

        FRONTEND_IMAGE = 'sasikalabedre/realtime-frontend'
        BACKEND_IMAGE  = 'sasikalabedre/realtime-backend'

        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
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
                    docker build \
                      -t ${FRONTEND_IMAGE}:latest \
                      ./frontend
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    docker build \
                      -t ${BACKEND_IMAGE}:latest \
                      ./backend
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                sh '''
                    echo "${DOCKER_CREDENTIALS_PSW}" | docker login \
                      -u "${DOCKER_CREDENTIALS_USR}" \
                      --password-stdin
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                    docker push ${FRONTEND_IMAGE}:latest
                    docker push ${BACKEND_IMAGE}:latest
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    docker logout
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo 'Docker images built and pushed successfully to Docker Hub.'
        }

        failure {
            echo 'Jenkins pipeline failed.'
        }
    }
}
