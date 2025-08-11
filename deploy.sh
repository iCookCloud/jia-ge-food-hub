#!/bin/bash

# =============================================================================
# 部署脚本
# 支持非交互式 SSH 执行: ssh user@server 'bash deploy.sh'
# 用法: ./deploy.sh [分支名] 或 ./deploy.sh --branch [分支名]
# =============================================================================

set -e  # 遇到错误立即退出

# 解析命令行参数
COMMAND_LINE_BRANCH=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --branch|-b)
            COMMAND_LINE_BRANCH="$2"
            shift 2
            ;;
        --help|-h)
            echo "用法: $0 [分支名] 或 $0 --branch [分支名]"
            echo "示例: $0 feature-branch"
            echo "示例: $0 --branch develop"
            exit 0
            ;;
        -*)
            echo "未知选项: $1"
            exit 1
            ;;
        *)
            # 如果不是选项，认为是分支名
            COMMAND_LINE_BRANCH="$1"
            shift
            ;;
    esac
done

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 环境初始化 - 解决非交互式 SSH 的环境变量问题
# =============================================================================

log_info "初始化环境变量..."

# 加载用户的环境变量文件
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi

if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile
fi

if [ -f ~/.profile ]; then
    source ~/.profile
fi

# 添加常见的 Node.js 路径
export PATH="/usr/local/bin:$PATH"
export PATH="$HOME/.local/bin:$PATH"
export PATH="./node_modules/.bin:$PATH"

# 确定项目目录（从脚本所在位置推断）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# 切换到项目目录
cd "$PROJECT_DIR"
log_info "切换到项目目录: $(pwd)"

# 加载环境变量
log_info "加载项目环境变量..."

# 初始化 direnv 并加载环境变量
if command -v direnv &> /dev/null; then
    eval "$(direnv hook bash)"
    direnv allow
    log_success "direnv 初始化并加载完成"
else
    log_warning "direnv 未安装，尝试手动加载环境变量"
    # 手动加载 .envrc 文件
    if [ -f ".envrc" ]; then
        source .envrc
        log_success "手动加载 .envrc 完成"
    else
        log_warning ".envrc 文件不存在，使用默认配置"
    fi
fi

# 设置最终的部署分支（优先级：命令行参数 > 环境变量 > 默认值）
if [ -n "$COMMAND_LINE_BRANCH" ]; then
    DEPLOY_BRANCH="$COMMAND_LINE_BRANCH"
    log_info "使用命令行指定的分支: $DEPLOY_BRANCH"
elif [ -n "$DEPLOY_BRANCH" ]; then
    log_info "使用环境变量中的分支: $DEPLOY_BRANCH"
else
    DEPLOY_BRANCH="main"
    log_info "使用默认分支: $DEPLOY_BRANCH"
fi

# 显示部署信息
log_info "部署配置信息:"
echo "项目名称: ${PROJECT_NAME:-product-pal-shelf}"
echo "部署分支: $DEPLOY_BRANCH"
echo "容器名称: ${CONTAINER_NAME:-product-pal-shelf}"
echo "外部端口: ${EXTERNAL_PORT:-5176}"



# =============================================================================
# 检查依赖
# =============================================================================

log_info "检查依赖..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装或不在 PATH 中"
    exit 1
fi
log_success "Node.js 版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "npm 未安装或不在 PATH 中"
    exit 1
fi
log_success "npm 版本: $(npm --version)"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    exit 1
fi
log_success "Docker 版本: $(docker --version)"

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose 未安装"
    exit 1
fi
log_success "Docker Compose 已安装"

# =============================================================================
# 代码更新
# =============================================================================

log_info "更新代码..."

# 检查是否是 git 仓库
if [ -d ".git" ]; then
    log_info "拉取最新代码 (分支: $DEPLOY_BRANCH)..."
    git fetch origin
    
    # 验证分支是否存在
    if ! git show-ref --verify --quiet refs/remotes/origin/$DEPLOY_BRANCH; then
        log_error "分支 $DEPLOY_BRANCH 不存在于远程仓库"
        log_info "可用分支:"
        git branch -r
        exit 1
    fi
    
    git reset --hard origin/$DEPLOY_BRANCH
    log_success "代码更新完成"
else
    log_warning "不是 git 仓库，跳过代码拉取"
fi

# =============================================================================
# 安装依赖
# =============================================================================

log_info "安装依赖..."
npm ci --production=false
log_success "依赖安装完成"

# =============================================================================
# 构建项目
# =============================================================================

log_info "构建项目..."

# 确保环境变量正确加载
log_info "加载环境变量..."
if [ -f ".envrc" ]; then
    source .envrc
    log_success "环境变量加载完成"
else
    log_warning ".envrc 文件不存在"
fi


log_success "环境变量验证通过"
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    log_error "构建失败，dist 目录不存在"
    exit 1
fi
log_success "项目构建完成"

# =============================================================================
# 部署应用
# =============================================================================

log_info "部署应用..."

log_info "使用 Docker 部署..."

# 停止旧容器
if docker ps -q --filter "name=${CONTAINER_NAME:-product-pal-shelf}" | grep -q .; then
    log_info "停止旧容器..."
    docker-compose down
fi

# 启动新容器
log_info "启动 Docker 容器..."
docker-compose up -d

# 检查容器状态
sleep 5
CONTAINER_NAME=${CONTAINER_NAME:-product-pal-shelf}
if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q $CONTAINER_NAME; then
    log_success "Docker 容器启动成功！"
    
    # 显示应用信息
    echo ""
    log_info "=== 部署信息 ==="
    echo "项目名称: ${PROJECT_NAME:-product-pal-shelf}"
    echo "容器名称: $CONTAINER_NAME"
    echo "部署分支: $DEPLOY_BRANCH"
    echo "项目目录: $PROJECT_DIR"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):${EXTERNAL_PORT:-5176}"
    echo ""
    
    # 显示容器状态
    docker ps --filter "name=$CONTAINER_NAME"
    echo ""
    log_info "容器资源使用:"
    docker stats $CONTAINER_NAME --no-stream
    
else
    log_error "Docker 容器启动失败！"
    docker-compose logs
    exit 1
fi