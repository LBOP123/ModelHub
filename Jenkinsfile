pipeline {
    agent any

    environment {
        APP_NAME = 'modelhub'
    }

    stages {
        stage('拉取代码') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/LBOP123/ModelHub.git',
                    credentialsId: 'github_token'
            }
        }

        stage('构建镜像') {
            steps {
                sh "docker build -t ${APP_NAME}:latest ."
            }
        }

        stage('部署') {
            steps {
                sh """
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    docker run -d \
                        --name ${APP_NAME} \
                        --restart always \
                        -p 3000:3000 \
                        --env-file .env \
                        ${APP_NAME}:latest
                """
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
    }
}
