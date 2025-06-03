<template>
  <view class="home-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 用户信息区 -->
    <view class="user-info-section">
      <view class="user-avatar-name">
        <image class="user-avatar" :src="userInfo.avatar" mode="aspectFill"></image>
        <view class="user-name-signature">
          <view class="user-name">
            <text class="user-tag">GM</text>
            <text class="user-name-text">{{userInfo.realname}}</text>
            <view class="edit-btn" @click="goToEdit">
              <image class="edit-icon" src="https://pic1.imgdb.cn/item/68121c1358cb8da5c8d56aa4.png" mode="aspectFit" style="width: 30rpx; height: 30rpx;"></image>
            </view>
          </view>
          <text class="user-signature">{{userInfo.signature}}</text>
        </view>
      </view>
      
      <view class="user-status-info">
        <view class="user-status">
          <text class="status-label">在线状态</text>
          <text class="status-value">Online Now</text>
        </view>
        <view class="user-register">
          <text class="register-label">注册时间</text>
          <text class="register-value">{{userInfo.registerDate}}</text>
        </view>
      </view>
    </view>
    
    <!-- 统计数据区 -->
    <view class="stats-section">
      <view class="season-trophy">
        <image class="trophy-icon" src="https://pic1.imgdb.cn/item/67f3c667e381c3632bee903e.png" mode="aspectFit"></image>
      </view>
      <view class="stats-item">
        <text class="stats-label">场次</text>
        <text class="stats-value">{{gameStatistics.totalGames}}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">积分</text>
        <text class="stats-value">{{gameStatistics.currentScore}}</text>
      </view>
      <view class="stats-item">
        <text class="stats-label">胜率</text>
        <text class="stats-value">{{gameStatistics.winRate}}%</text>
      </view>
    </view>
    
    <!-- 历史对局区 -->
    <view class="history-section">
      <view class="history-header">
        <text class="history-title">历史对局</text>
        <text class="history-more">...</text>
      </view>
      
      <view class="match-table">
        <view class="table-header">
          <text class="cell-player">棋手</text>
          <text class="cell-result">结果</text>
          <text class="cell-date">日期</text>
        </view>
        
        <!-- 动态对局记录 -->
        <view v-if="historyGames.length === 0" class="no-games">
          <text class="no-games-text">暂无历史对局</text>
        </view>
        
        <view v-for="(game) in historyGames" :key="game.id" class="match-record" @tap="goToReplay(game.id)">
          <view class="match-players">
            <view class="match-row">
              <view class="cell-player">
                <view class="player-indicator" :class="game.whitePlayer.result === 1 ? 'win' : game.whitePlayer.result === 0.5 ? 'draw' : 'lose'"></view>
                <view class="player-info">
                  <text class="player-name">{{game.whitePlayer.name}}</text>
                  <text class="player-rating">({{game.whitePlayer.rating}})</text>
                </view>
              </view>
              <text class="cell-result">{{game.whitePlayer.result}}</text>
              <text class="cell-date">{{game.date}}</text>
            </view>
            <view class="match-row opponent">
              <view class="cell-player">
                <view class="player-indicator" :class="game.blackPlayer.result === 1 ? 'win' : game.blackPlayer.result === 0.5 ? 'draw' : 'lose'"></view>
                <view class="player-info">
                  <text class="player-name">{{game.blackPlayer.name}}</text>
                  <text class="player-rating">({{game.blackPlayer.rating}})</text>
                </view>
              </view>
              <text class="cell-result">{{game.blackPlayer.result}}</text>
              <text class="cell-date"></text>
            </view>
          </view>
          <view class="match-result" :class="getGameResultClass(game.gameResult)">
            <text class="result-text">{{getGameResultText(game.gameResult)}}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-btn" @click="handleLogout">
      <image class="logout-icon" src="https://pic1.imgdb.cn/item/67f3c667e381c3632bee903d.png" mode="aspectFit"></image>
      <text class="logout-text">退出登录</text>
    </view>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import { getUserData } from '@/api/system/user'
import { getMyGameHistory } from '@/api/game'
import { getCurrentUserGameStatistics } from '@/api/score'

export default {
  components: {
    TopSpacing
  },
  data() {
    return {
      statusBarHeight: 0,
      userInfo: {
        avatar: '',
        username: '',
        realname: '',
        signature: '',
        registerDate: ''
      },
      historyGames: [],
      gameStatistics: {
        totalGames: 0,
        currentScore: 0,
        winRate: 0
      }
    }
  },
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 获取用户信息
    this.getUserInfo()
    
    // 获取历史对局
    this.getHistoryGames()
    
    // 获取对局统计
    this.getGameStatistics()
  },
  methods: {
    async getUserInfo() {
      try {
        const res = await getUserData()
        if (res.success) {
          this.userInfo = {
            avatar: res.result.avatar || 'https://pic1.imgdb.cn/item/67f3c5c7e381c3632bee8ff9.png',
            username: res.result.username || 'NikoTheodorou',
            realname: res.result.realname || 'NikoTheodorou',
            signature: res.result.signature || '这个地方是个性签名......',
            registerDate: res.result.createTime || 'Nov 12, 2023'
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    async getGameStatistics() {
      try {
        const res = await getCurrentUserGameStatistics()
        if (res.success && res.result) {
          this.gameStatistics = {
            totalGames: res.result.totalGames || 0,
            currentScore: res.result.currentScore || 0,
            winRate: res.result.winRate ? res.result.winRate.toFixed(1) : '0.0'
          }
        }
      } catch (error) {
        console.error('获取对局统计失败:', error)
        // 保持默认值
      }
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '已退出登录',
              icon: 'none'
            });
            // 实际退出逻辑
            // uni.removeStorageSync('token');
            // uni.reLaunch({
            //   url: '/pages/login'
            // });
          }
        }
      });
    },
    async getHistoryGames() {
      try {
        const res = await getMyGameHistory({
          pageNo: 1,
          pageSize: 20,
          userId: 'e9ca23d68d884d4ebb19d07889727dae'
        })
        
        if (res.success && res.result && res.result.records) {
          this.historyGames = res.result.records.map(game => {
            // 根据游戏状态判断结果
            let gameResult = '进行中'
            let whiteResult = 0
            let blackResult = 0
            
            if (game.gameState === 1) { // 游戏结束
              // 这里需要根据实际的胜负判断逻辑来设置结果
              // 暂时设置为平局，实际应该根据API文档或后端逻辑判断
              gameResult = 'DRAW'
              whiteResult = 0.5
              blackResult = 0.5
            }
            
            return {
              id: game.id,
              whitePlayer: {
                name: game.whitePlayAccount || 'Unknown',
                rating: game.whitePlayerScore || 0,
                result: whiteResult
              },
              blackPlayer: {
                name: game.blackPlayAccount || 'Unknown', 
                rating: game.blackPlayerScore || 0,
                result: blackResult
              },
              date: this.formatDate(game.createTime),
              gameResult: gameResult
            }
          })
        }
      } catch (error) {
        console.error('获取历史对局失败:', error)
        // 如果API失败，使用默认数据
        this.historyGames = []
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const year = date.getFullYear().toString().slice(-2)
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    goToEdit() {
      uni.navigateTo({
        url: '/pages/mine/info/edit'
      });
    },
     getGameResultClass(gameResult) {
       switch(gameResult) {
         case 'WHITE_WIN':
         case 'BLACK_WIN':
           return 'win'
         case 'DRAW':
           return 'draw'
         default:
           return 'lose'
       }
     },
     getGameResultText(gameResult) {
       switch(gameResult) {
         case 'WHITE_WIN':
           return '胜'
         case 'BLACK_WIN':
           return '负'
         case 'DRAW':
           return '和'
         default:
           return '负'
       }
     },
     goToReplay(gameId) {
       console.log('跳转到回看界面:', gameId)
       uni.navigateTo({
         url: `/pages/play/replay/index?id=${gameId}`,
         success: () => {
           console.log('跳转成功')
         },
         fail: (err) => {
           console.error('跳转失败:', err)
           uni.showToast({
             title: '跳转失败',
             icon: 'none'
           })
         }
       })
     }
  }
}
</script>

<style lang="scss" scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
}

// 用户信息区
.user-info-section {
  display: flex;
  flex-direction: column;
  background-color: rgba(40, 25, 12, 0.6);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .user-avatar-name {
    display: flex;
    margin-bottom: 30rpx;
    
    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 20rpx;
    }
    
    .user-name-signature {
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      
      .user-name {
        display: flex;
        align-items: center;
        margin-bottom: 10rpx;
        
        .user-tag {
          background-color: #a31212;
          color: white;
          font-size: 28rpx;
          padding: 0 10rpx;
          border-radius: 6rpx;
          margin-right: 10rpx;
        }
        
        .user-name-text {
          color: white;
          font-size: 36rpx;
          font-weight: bold;
        }
      }
      
      .user-signature {
        color: #cccccc;
        font-size: 32rpx;
      }
    }
  }
  
  .user-status-info {
    display: flex;
    justify-content: space-around;
    
    .user-status, .user-register {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .status-label, .register-label {
        color: white;
        font-size: 28rpx;
        margin-bottom: 10rpx;
      }
      
      .status-value, .register-value {
        color: white;
        font-size: 28rpx;
      }
    }
  }
}

// 统计数据区
.stats-section {
  display: flex;
  background-color: rgba(40, 25, 12, 0.6);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .season-trophy {
    display: flex;
    justify-content: center;
    align-items: center;
    
    .trophy-icon {
      width: 100rpx;
      height: 100rpx;
    }
  }
  
  .stats-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stats-label {
      color: white;
      font-size: 36rpx;
      margin-bottom: 10rpx;
    }
    
    .stats-value {
      color: white;
      font-size: 50rpx;
      font-weight: bold;
    }
  }
}

// 历史对局区
.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(40, 25, 12, 0.6);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .history-title {
      color: white;
      font-size: 36rpx;
      font-weight: bold;
    }
    
    .history-more {
      color: white;
      font-size: 36rpx;
    }
  }
  
  .match-table {
    flex: 1;
    
    .table-header {
      display: flex;
      padding: 20rpx 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(60, 60, 60, 0.5);
      
      text {
        color: white;
        font-size: 24rpx;
        font-weight: bold;
      }
      
      .cell-player {
        flex: 3;
        padding-left: 20rpx;
      }
      
      .cell-result, .cell-steps, .cell-date {
        flex: 1;
        text-align: center;
      }
    }
    
    .match-record {
      display: flex;
      margin: 30rpx auto;
      position: relative;
      
      .match-players {
        flex: 1;
      }
      
      .match-result {
        position: absolute;
        right: 35%;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        
        &.win {
          .result-text {
            color: #81b64c;
            font-size: 24rpx;
            font-weight: bold;
          }
        }
        
        &.lose {
          .result-text {
            color: #e84118;
            font-size: 22rpx;
            font-weight: bold;
          }
        }
        
        &.draw {
          .result-text {
            color: #f39c12;
            font-size: 22rpx;
            font-weight: bold;
          }
        }
      }
    }
    
    .no-games {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60rpx 0;
      
      .no-games-text {
        color: #999;
        font-size: 28rpx;
      }
    }
    
    .match-row {
      display: flex;
      align-items: center;
      padding: 0rpx 0;
      
      &.opponent {
        padding-top: 0;
        margin-bottom: 0rpx;
      }
      
      .cell-player {
        flex: 3;
        display: flex;
        align-items: center;
        padding-left: 20rpx;
        
        .player-indicator {
          width: 20rpx;
          height: 20rpx;
          border-radius: 4rpx;
          margin-right: 15rpx;
          
          &.win {
            background-color: #81b64c;
          }
          
          &.lose {
            background-color: #a2a2a2;
          }
          
          &.draw {
            background-color: #f39c12;
          }
        }
        
        .player-info {
          display: flex;
          
          .player-name {
            color: white;
            font-size: 24rpx;
            margin-right: 10rpx;
          }
          
          .player-rating {
            color: #cccccc;
            font-size: 24rpx;
          }
        }
      }
      
      .cell-result, .cell-steps, .cell-date {
        flex: 1;
        color: white;
        font-size: 24rpx;
        text-align: center;
        justify-content: center;
      }
    }
  }
}

// 退出登录按钮
.logout-btn {
  display: flex;
  align-items: center;
    justify-content: center;
  margin-bottom: 40rpx;
  
  .logout-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 10rpx;
  }
  
  .logout-text {
    color: white;
    font-size: 36rpx;
  }
}
</style>
