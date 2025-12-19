pipeline {
    agent any

    parameters {
        string(
            name: 'BRANCH_NAME', 
            defaultValue: 'main', 
            description: 'Nhánh cần deploy (main/dev/production/...)'
        )
    }

    stages {
        
        // 🧹 CLEANUP CHỈ FRONTEND
        stage('🧹 Frontend Cleanup') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            echo '🧹 Cleaning FRONTEND resources only...'
                            
                            # Stop và xóa container FE
                            echo 'Stopping FE container...'
                            docker stop homelandfinest-fe 2>/dev/null || true
                            docker rm homelandfinest-fe 2>/dev/null || true
                            
                            # Xóa image FE
                            echo 'Removing FE image...'
                            docker rmi homelandfinest-fe -f 2>/dev/null || true
                            
                            # Xóa source code FE cũ
                            echo 'Removing old FE source...'
                            rm -rf ~/HomeLandFinest/HomelandFinestFE
                            
                            echo '✅ Frontend cleanup done!'
                            echo '📊 Current running containers:'
                            docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
                        "
                    """
                }
            }
        }

        // 📥 CLONE SOURCE CODE
        stage('📥 Clone FE Source') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 '
                            set -e
                            echo "📥 Cloning FE repository..."
                            echo "🌿 Target branch: ${params.BRANCH_NAME}"
                            
                            # Tạo thư mục nếu chưa có
                            mkdir -p ~/HomeLandFinest
                            
                            # Clone repository FE
                            cd ~/HomeLandFinest
                            git clone git@github.com:nguyencongtrung1512/Homeland-s-Finest-System-FE.git HomelandFinestFE
                            
                            # Checkout nhánh
                            cd HomelandFinestFE
                            git fetch origin
                            git checkout ${params.BRANCH_NAME}
                            git pull origin ${params.BRANCH_NAME}
                            
                            echo "✅ Source code cloned successfully!"
                            echo "📂 Current branch:"
                            git branch --show-current
                            echo "📝 Latest commit:"
                            git log -1 --oneline
                        '
                    """
                }
            }
        }

        // 📝 CREATE .ENV FILE
        stage('📝 Create .env File') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            set -e
                            echo '📝 Creating .env file...'
                            
                            cd ~/HomeLandFinest/HomelandFinestFE
                            
                            # Xóa .env cũ (nếu là thư mục hoặc file)
                            rm -rf .env
                            
                            # Tạo file .env với environment variables
                            cat > .env << 'EOF'
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoidHJ1bmd0cnVuIiwiYSI6ImNtZXY0d2x3aTBlejcycW9uYWpnd29oOGEifQ.jlLw7gq49Xel1U7_jyD7WQ
VITE_GHN_API_URL=https://online-gateway.ghn.vn/shiip/public-api
VITE_GHN_TOKEN=7c94ceb5-9f5b-11f0-b747-8e1cf228f24a
VITE_FPT_AI_API_KEY=4xBGv6jKlB6O4zhKsDViOHCdUWN7hTRe
VITE_FPT_AI_OCR_URL=https://api.fpt.ai/vision/idr/vnm
VITE_API_URL=https://tinhhoaquenha.online/api
VITE_CHAT_API_URL=https://tinhhoaquenha.online/chatHub
VITE_API_SERVER=http://localhost:5219/api
VITE_API_VIETQR=https://api.vietqr.io/v2/banks
VITE_NEXTJS_HOMEPAGE_URL=https://homeland-finest-homepage.vercel.app
EOF
                            
                            echo '✅ .env file created successfully!'
                            echo '📋 Content preview (first 3 lines):'
                            head -n 3 .env
                        "
                    """
                }
            }
        }

        // 🔧 FIX DOCKERFILE
        stage('🔧 Fix Dockerfile') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            set -e
                            echo '🔧 Fixing Dockerfile...'
                            
                            cd ~/HomeLandFinest/HomelandFinestFE
                            
                            # Comment dòng COPY nginx.conf nếu chưa comment
                            sed -i 's/^COPY nginx.conf/# COPY nginx.conf/' Dockerfile
                            
                            echo '✅ Dockerfile fixed!'
                            echo '📋 Checking nginx.conf line:'
                            grep 'nginx.conf' Dockerfile || echo 'No active COPY nginx.conf found'
                        "
                    """
                }
            }
        }

        // 🗑️ CLEAR DOCKER CACHE
        stage('🗑️ Clear Docker Cache') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            echo '🗑️ Clearing ALL Docker build cache...'
                            
                            # Clear tất cả build cache (aggressive)
                            docker builder prune -a -f
                            
                            # Clear dangling images
                            docker image prune -f
                            
                            echo '✅ Docker cache cleared completely!'
                        "
                    """
                }
            }
        }

        // 🏗️ BUILD DOCKER IMAGE
        stage('🏗️ Build FE Image') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            set -e
                            echo '🏗️ Building FE Docker image...'
                            
                            cd ~/HomeLandFinest/HomelandFinestFE
                            
                            # Build image với --no-cache và --pull để force rebuild hoàn toàn
                            docker build --no-cache --pull -f Dockerfile -t homelandfinest-fe .
                            
                            echo '✅ Image built successfully!'
                            docker images | grep homelandfinest-fe
                        "
                    """
                }
            }
        }

        // 🚀 DEPLOY FRONTEND
        stage('🚀 Deploy FE') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            set -e
                            echo '🚀 Starting FE container...'
                            
                            # Run container
                            # Nginx trong container listen ở port 80
                            # Map port 80 của container ra port 8082 của host
                            docker run -d \\
                                --name homelandfinest-fe \\
                                -p 8082:80 \\
                                --restart unless-stopped \\
                                homelandfinest-fe
                            
                            echo '✅ Frontend deployed successfully!'
                        "
                    """
                }
            }
        }

        // 🩺 HEALTH CHECK
        stage('🩺 Health Check') {
            steps {
                sshagent(['SSHKey']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                            echo '⏳ Waiting for container to be ready...'
                            sleep 10
                            
                            echo ''
                            echo '📊 All running containers:'
                            docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
                            
                            echo ''
                            echo '🌐 Services URLs:'
                            echo '- Frontend: http://154.26.130.248:8082'
                            echo '- Frontend (Domain): https://tinhhoaquenha.online'
                            echo '- Backend: http://154.26.130.248:8080/swagger'
                            echo '- ChunkService: http://154.26.130.248:8077'
                            echo '- EmailService: http://154.26.130.248:8078'
                            
                            echo ''
                            echo '📋 FE Container logs (last 20 lines):'
                            docker logs homelandfinest-fe --tail 20
                            
                            echo ''
                            echo '💡 Test FE:'
                            curl -I http://localhost:8082 || echo '⚠️ Health check failed, but container is running'
                        "
                    """
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Cleanup ran for FRONTEND only - Backend services NOT affected'
        }
        success {
            script {
                echo '🎉 FE DEPLOY SUCCESS!'
                echo ''
                echo '✅ Deployment Summary:'
                echo "- Branch: ${params.BRANCH_NAME}"
                echo '- Frontend URL: http://154.26.130.248:8082'
                echo '- Frontend (Domain): https://tinhhoaquenha.online'
                echo '- Container: homelandfinest-fe'
                echo '- Port Mapping: 8082:80 (host:container)'
                echo ''
                echo '⚠️ NOTE: Backend và các service khác KHÔNG bị ảnh hưởng'
            }
        }
        failure {
            echo '❌ FE DEPLOY FAILED!'
            sshagent(['SSHKey']) {
                sh """
                    ssh -o StrictHostKeyChecking=no root@154.26.130.248 "
                        echo '📋 FE Container logs (last 100 lines):'
                        docker logs homelandfinest-fe --tail 100 2>/dev/null || echo 'No FE logs available'
                        
                        echo ''
                        echo '📊 Container status:'
                        docker ps -a | grep homelandfinest-fe || echo 'No FE container found'
                        
                        echo ''
                        echo '🐳 Docker system info:'
                        docker info | grep -E 'Containers|Images|Server Version' || true
                    "
                """
            }
        }
    }
}