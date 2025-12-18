pipeline {
    agent any

    stages {

        stage('Checkout & Install Dependencies') {
            steps {
                echo "🔄 Checkout du code"
                checkout scm

                echo "📦 Installation des dépendances npm"
                sh 'npm install'
            }
        }

        stage('Linting') {
            steps {
                echo "📝 Lint du code"
                sh '''
                    npx eslint . --ext .ts,.tsx,.js || true
                '''
            }
        }

        stage('Unit Tests') {
            steps {
                echo "🧪 Tests unitaires"
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "🔍 Analyse SonarQube"

                withCredentials([string(credentialsId: 'SONARQUBE_TOKEN', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQubeServer') {
                        sh '''
                            sonar-scanner \
                            -Dsonar.projectKey=reservation_front \
                            -Dsonar.sources=./src \
                            -Dsonar.host.url=http://localhost:9000 \
                            -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def IMAGE_NAME = "ghcr.io/aminehamzaoui443/reservation-frontend-jenkins"
                    def IMAGE_TAG  = "${env.BUILD_NUMBER}"
                    echo "🐳 Build de l’image Docker frontend : ${IMAGE_NAME}:${IMAGE_TAG} et ${IMAGE_NAME}:latest"

                    sh """
                        docker build --no-cache -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .
                    """
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    def IMAGE_NAME = "ghcr.io/aminehamzaoui443/reservation-frontend-jenkins"
                    def IMAGE_TAG  = "${env.BUILD_NUMBER}"
                    echo "🔒 Scan Trivy sur l'image ${IMAGE_NAME}:${IMAGE_TAG}"

                    sh """
                        trivy clean --scan-cache
                        trivy image --exit-code 1 --severity HIGH,CRITICAL ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    def IMAGE_NAME = "ghcr.io/aminehamzaoui443/reservation-frontend-jenkins"
                    def IMAGE_TAG  = "${env.BUILD_NUMBER}"
                    echo "🚀 Push des images ${IMAGE_NAME}:${IMAGE_TAG} et ${IMAGE_NAME}:latest vers GHCR"

                    withCredentials([string(credentialsId: 'GITHUB_PAT', variable: 'GITHUB_PAT')]) {
                        sh """
                            echo \$GITHUB_PAT | docker login ghcr.io -u AmineHamzaoui443 --password-stdin
                            docker push ${IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline complète : Lint + Tests + Sonar + Docker + Trivy + Push !"
        }
        failure {
            echo "❌ Pipeline échouée. Vérifie les logs."
        }
    }
}
