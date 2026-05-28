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
                // 注意：credentialsId 后面的值必须和你刚才上传机密文件时填的 ID 保持一致！
                // 假设你填的 ID 是 'env-file-secret'
                withCredentials([file(credentialsId: 'env-file-secret', variable: 'ENV_FILE')]) {
                    // 把 Jenkins 临时生成的机密文件复制到当前目录下并命名为 .env
                    sh 'cp $ENV_FILE .env'
                }
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
        always {
            // 部署完成后，无论成功还是失败，都清理掉 .env 文件，防止密码泄露
            sh 'rm -f .env'
        }
    }
}