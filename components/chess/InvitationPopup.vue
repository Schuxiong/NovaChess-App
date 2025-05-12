<!-- components/chess/InvitationPopup.vue -->
<template>
  <uni-popup ref="invitationPopup" type="center" background-color="#333" @close="onClose">
    <view class="invitation-popup">
      <view class="invitation-title">对战邀请</view>
      
      <view class="invitation-content">
        <image class="inviter-avatar" :src="getAvatar()" mode="aspectFit"></image>
        <view class="inviter-name">{{ getInviterName() }}</view>
        <view class="invitation-info">邀请你进行对战</view>
        
        <!-- 显示执棋颜色 -->
        <view class="play-as-info">
          <text class="play-as-text">您将执{{ getYourColor() }}子</text>
          <view class="color-display" :class="getColorClass()"></view>
        </view>
        
        <view class="time-control">
          <image class="clock-icon" src="https://pic1.imgdb.cn/item/67f3c5ffe381c3632bee9011.png" mode="aspectFit"></image>
          <text class="time-text">{{ inviter.timeControl || '10 min' }}</text>
        </view>
      </view>
      
      <view class="invitation-actions">
        <view class="action-btn decline-btn" @click="onDecline">
          <text class="btn-text">拒绝</text>
        </view>
        <view class="action-btn accept-btn" @click="onAccept">
          <text class="btn-text">接受</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script>
export default {
  name: 'InvitationPopup',
  props: {
    inviter: {
      type: Object,
      default: () => ({
        id: 0,
        name: '',
        sourceUserAccount: '',
        rating: 0,
        avatar: '',
        timeControl: '10 min',
        inviteId: '',
        playAs: 'white', // 邀请者执棋的颜色
        sourceOnePart: 2, // 1表示黑色，2表示白色
        acceptOnePart: 1  // 1表示黑色，2表示白色
      })
    }
  },
  methods: {
    // 打开弹窗
    open() {
      this.$refs.invitationPopup.open('center');
    },
    
    // 关闭弹窗
    close() {
      this.$refs.invitationPopup.close();
    },
    
    // 获取邀请者名称
    getInviterName() {
      // 尝试从多个可能的字段获取名称
      return this.inviter.name || 
             this.inviter.userName || 
             this.inviter.username || 
             this.inviter.sourceUserAccount || 
             this.inviter.sourceUsername || 
             this.inviter.realname || 
             '未知玩家';
    },
    
    // 获取邀请者头像
    getAvatar() {
      // 尝试从多个可能的字段获取头像
      return this.inviter.avatar || 
             this.inviter.headImgUrl || 
             this.inviter.headImg || 
             this.inviter.pic || 
             '/static/images/match/avatar-default.png';
    },
    
    // 获取你要执的棋子颜色
    getYourColor() {
      // 从多种可能的属性中获取颜色信息
      if (this.inviter.acceptOnePart === 1) {
        return '黑';
      } else if (this.inviter.acceptOnePart === 2) {
        return '白';
      } else if (this.inviter.playAs === 'white') {
        return '黑'; // 如果邀请者执白，那么你执黑
      } else if (this.inviter.playAs === 'black') {
        return '白'; // 如果邀请者执黑，那么你执白
      }
      return '随机'; // 默认
    },
    
    // 获取颜色样式类
    getColorClass() {
      const color = this.getYourColor();
      if (color === '白') {
        return 'white-color';
      } else if (color === '黑') {
        return 'black-color';
      }
      return 'random-color';
    },
    
    // 接受邀请
    onAccept() {
      this.$emit('accept', this.inviter);
      this.close();
    },
    
    // 拒绝邀请
    onDecline() {
      this.$emit('decline', this.inviter);
      this.close();
    },
    
    // 弹窗关闭事件
    onClose() {
      this.$emit('close');
    }
  }
}
</script>

<style lang="scss" scoped>
.invitation-popup {
  width: 550rpx;
  background-color: #333;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.3);
  
  .invitation-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #FFFFFF;
    text-align: center;
    margin-bottom: 30rpx;
  }
  
  .invitation-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
    
    .inviter-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      margin-bottom: 20rpx;
      border: 2rpx solid rgba(255, 255, 255, 0.2);
    }
    
    .inviter-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 10rpx;
    }
    
    .invitation-info {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 20rpx;
    }
    
    .play-as-info {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      
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
    
    .time-control {
      display: flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 30rpx;
      padding: 10rpx 30rpx;
      
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
  }
  
  .invitation-actions {
    display: flex;
    justify-content: space-between;
    
    .action-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10rpx;
      
      .btn-text {
        font-size: 30rpx;
        font-weight: bold;
      }
    }
    
    .decline-btn {
      background-color: rgba(255, 255, 255, 0.1);
      margin-right: 20rpx;
      
      .btn-text {
        color: #FFFFFF;
      }
    }
    
    .accept-btn {
      background-color: #81B64C;
      
      .btn-text {
        color: #FFFFFF;
      }
    }
  }
}
</style> 