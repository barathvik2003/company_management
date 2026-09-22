pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh 'echo "GitHub code successfully downloaded by Jenkins"'
                sh 'ls -la'
            }
        }
    }
}
