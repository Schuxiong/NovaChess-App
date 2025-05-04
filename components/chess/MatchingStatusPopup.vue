<!-- components/chess/MatchingStatusPopup.vue -->
<template>
  <uni-popup ref="matchingPopup" type="center" background-color="#333" @close="onClose">
    <view class="matching-popup">
      <view class="matching-title">等待对手接受邀请</view>
      
      <view class="matching-content">
        <image v-if="opponent.avatar" class="opponent-avatar" :src="opponent.avatar" mode="aspectFit"></image>
        <image v-else class="piece-icon" src="/static/images/match/pieces/white-pawn.png" mode="aspectFit"></image>
        
        <view class="opponent-name">{{ getOpponentName() }}</view>
        
        <view class="time-control">
          <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
          <text class="time-text">{{ timeControl }}</text>
        </view>
        
        <view class="play-as-info">
          <text class="play-as-text">您将执{{ getYourColor() }}子</text>
          <view class="color-display" :class="getColorClass()"></view>
        </view>
        
        <view class="loading-indicator">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
      </view>
      
      <view class="matching-actions">
        <view class="cancel-btn" @click="onCancel">
          <text class="btn-text">取消邀请</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script>
export default {
  name: 'MatchingStatusPopup',
  props: {
    opponent: {
      type: Object,
      default: () => ({
        id: 0,
        userName: '',
        rating: 0,
        avatar: ''
      })
    },
    inviteId: {
      type: String,
      default: ''
    },
    timeControl: {
      type: String,
      default: '10 min'
    },
    playAs: {
      type: String,
      default: 'white' // 'white'或'black'
    }
  },
  methods: {
    // 打开弹窗
    open() {
      this.$refs.matchingPopup.open('center');
    },
    
    // 关闭弹窗
    close() {
      this.$refs.matchingPopup.close();
    },
    
    // 获取对手名称
    getOpponentName() {
      return this.opponent.userName || 
             this.opponent.username || 
             this.opponent.name || 
             '等待对手加入';
    },
    
    // 获取执棋颜色
    getYourColor() {
      if (this.playAs === 'white') {
        return '白';
      } else if (this.playAs === 'black') {
        return '黑';
      }
      return '随机';
    },
    
    // 获取颜色样式类
    getColorClass() {
      if (this.playAs === 'white') {
        return 'white-color';
      } else if (this.playAs === 'black') {
        return 'black-color';
      }
      return 'random-color';
    },
    
    // 取消匹配
    onCancel() {
      this.$emit('cancel', this.inviteId);
    },
    
    // 关闭事件
    onClose() {
      this.$emit('close');
    }
  }
}
</script>

<style lang="scss" scoped>
.matching-popup {
  width: 550rpx;
  background-color: #333;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.3);
  
  .matching-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #FFFFFF;
    text-align: center;
    margin-bottom: 30rpx;
  }
  
  .matching-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
    
    .opponent-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      margin-bottom: 20rpx;
      border: 2rpx solid rgba(255, 255, 255, 0.2);
    }
    
    .piece-icon {
      width: 100rpx;
      height: 100rpx;
      margin-bottom: 20rpx;
    }
    
    .opponent-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 20rpx;
    }
    
    .time-control {
      display: flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 30rpx;
      padding: 10rpx 30rpx;
      margin-bottom: 20rpx;
      
      .clock-icon {
        width: 40rpx;
        height: 40rpx;
        margin-right: 10rpx;
      }
      
      .time-text {
        font-size: 28rpx;
        color: #FFFFFF;
      }
    }
    
    .play-as-info {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;
      
      .play-as-text {
        font-size: 28rpx;
        color: #FFFFFF;
        margin-right: 10rpx;
      }
      
      .color-display {
        width: 30rpx;
        height: 30rpx;
        border-radius: 50%;
        
        &.white-color {
          background-color: #FFFFFF;
          border: 1px solid #AAA;
        }
        
        &.black-color {
          background-color: #000000;
        }
        
        &.random-color {
          background: linear-gradient(to right, white 0%, white 50%, black 50%, black 100%);
        }
      }
    }
    
    .loading-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 10rpx;
      
      .dot {
        width: 16rpx;
        height: 16rpx;
        background-color: #81B64C;
        border-radius: 50%;
        margin: 0 8rpx;
        opacity: 0.6;
        animation: pulse 1.4s infinite ease-in-out;
        
        &:nth-child(1) {
          animation-delay: 0s;
        }
        
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
  
  .matching-actions {
    display: flex;
    justify-content: center;
    
    .cancel-btn {
      width: 80%;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10rpx;
      background-color: rgba(255, 255, 255, 0.15);
      
      .btn-text {
        font-size: 30rpx;
        color: #FFFFFF;
      }
    }
  }
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 