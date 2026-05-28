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
        
        // 新增阶段：从 Jenkins 凭据中读取文本，并生成 .env 文件
        stage('准备环境变量') {
            steps {
                withCredentials([string(credentialsId: 'env-content', variable: 'ENV_SECRET')]) {
                    // 将机密文本的内容写入当前目录的 .env 文件
                    sh 'echo "$ENV_SECRET" > .env'
                }
            }
        }

        stage('部署') {
            steps {
                sh """
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    
                    # 此时当前目录下已经有了刚才生成的 .env 文件
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
        // 建议加上清理，确保密码文件不在服务器的工作区残留
        always {
            sh 'rm -f .env'
        }
    }
}