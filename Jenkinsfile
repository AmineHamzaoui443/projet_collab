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

                // Sonar token enregistré dans Jenkins Credentials
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
                echo "🐳 Build de l’image Docker"
                sh '''
                    docker build -t ghcr.io/aminehamzaoui443/reservation-frontend:latest .
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
                echo "🔒 Scan Trivy"
                sh '''
                    trivy image --exit-code 1 --severity HIGH,CRITICAL ghcr.io/aminehamzaoui443/reservation-frontend:latest
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "🚀 Push vers GitHub Container Registry"

                // PAT GitHub enregistré dans Jenkins Credentials
                withCredentials([string(credentialsId: 'GITHUB_PAT', variable: 'GITHUB_PAT')]) {
                    sh '''
                        echo $GITHUB_PAT | docker login ghcr.io -u aminehamzaoui443 --password-stdin
                        docker push ghcr.io/aminehamzaoui443/reservation-frontend:latest
                    '''
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