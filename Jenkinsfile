pipeline {
    agent any

    environment {
        APP_NAME = 'modelhub'
    }

    stages {
        stage('构建镜像') {
            steps {
                sh "docker build -t ${APP_NAME}:latest ."
            }
        }
        
        stage('准备环境变量') {
            steps {
                withCredentials([file(credentialsId: 'env-file-secret', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                }
            }
        }

        stage('部署') {
            steps {
                sh '''
                    docker stop modelhub || true
                    docker rm modelhub || true
                    
                    docker run -d --name modelhub --restart always -p 3000:3000 --network app-net --env-file .env modelhub:latest
                '''
            }
        }
    }

    post {
        success {
            echo '部署成功！'
        }
        failure {
            echo '部署失败，请检查日志'
        }
        always {
            sh 'rm -f .env'
        }
    }
}