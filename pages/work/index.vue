<template>
  <view class="learn-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 顶部标题区 -->
    <view class="header">
      <image class="title-icon" src="https://pic1.imgdb.cn/item/67f3c634e381c3632bee9026.png" mode="aspectFit"></image>
      <text class="title">学习国际象棋</text>
    </view>
    
    <!-- 引导对话区 -->
    <view class="guide-dialog">
      <image class="avatar" src="https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png" mode="aspectFit"></image>
      <view class="dialog-bubble">
        <text class="dialog-text">让我教你如何下国际象棋吧！</text>
      </view>
    </view>
    
    <!-- 功能模块区 -->
    <view class="modules">
      <!-- 规则入门 -->
      <view class="module-item" @click="handleModuleClick('rules')">
        <view class="module-icon">
          <image src="https://pic1.imgdb.cn/item/67f3c634e381c3632bee9029.png" mode="aspectFit"></image>
        </view>
        <view class="module-content">
          <text class="module-title">规则入门</text>
        </view>
      </view>
      

      <!-- 资料仓库 -->
      <view class="module-item" @click="handleModuleClick('library')">
        <view class="module-icon">
          <image src="https://pic1.imgdb.cn/item/67f3c634e381c3632bee9027.png" mode="aspectFit"></image>
        </view>
        <view class="module-content">
          <text class="module-title">资料仓库</text>
        </view>
      </view>
      
      <!-- 自定义课程 -->
      <view class="module-item" @click="handleModuleClick('custom')">
        <view class="module-icon">
          <image src="https://pic1.imgdb.cn/item/683d57b258cb8da5c824230d.png" mode="aspectFit"></image>
        </view>
        <view class="module-content">
          <text class="module-title">自定义课程</text>
        </view>
      </view>
      
      <!-- 课程管理 -->
      <view class="module-item" @click="handleModuleClick('admin')">
        <view class="module-icon">
          <view class="iconfont icon-setting"></view>
        </view>
        <view class="module-content">
          <text class="module-title">课程管理</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import TabBar from '@/components/TabBar.vue'

export default {
  components: {
    TopSpacing,
    TabBar
  },
  data() {
    return {
      statusBarHeight: 0
    }
  },
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
  },
  
  methods: {

    
    // 处理模块点击
    handleModuleClick(type) {
      switch (type) {
        case 'rules':
          uni.navigateTo({
            url: '/pages/work/learn/index'
          });
          break;
        case 'library':
          uni.navigateTo({
            url: '/pages/work/repository/index'
          });
          break;
        case 'custom':
          uni.navigateTo({
            url: '/pages/work/learn/custom'
          });
          break;
        case 'admin':
          uni.navigateTo({
            url: '/pages/work/admin/index'
          });
          break;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.learn-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  
  .title-icon {
    width: 64rpx;
    height: 64rpx;
    margin-right: 20rpx;
  }
  
  .title {
    color: #ffffff;
    font-size: 64rpx;
    font-weight: bold;
    text-align: center;
  }
}

.guide-dialog {
  display: flex;
  align-items: flex-start;
  margin-bottom: 60rpx;
  
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    margin-right: 20rpx;
  }
  
  .dialog-bubble {
    background-color: #ffffff;
    border-radius: 30rpx;
    padding: 20rpx 30rpx;
    position: relative;
    max-width: 70%;
    
    &:before {
      content: '';
      position: absolute;
      left: -20rpx;
      top: 40rpx;
      border-width: 10rpx;
      border-style: solid;
      border-color: transparent #ffffff transparent transparent;
    }
    
    .dialog-text {
      color: #565656;
      font-size: 34rpx;
      font-weight: bold;
    }
  }
}

.modules {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .module-item {
    display: flex;
    align-items: center;
    background-color: rgba(40, 25, 12, 0.6);
    border-radius: 20rpx;
    font-weight: bold;
    padding: 30rpx;
    margin-bottom: 30rpx;
    
    .module-icon {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      
      image {
        width: 80rpx;
        height: 80rpx;
      }
      
      .iconfont {
        color: #ffffff;
        font-weight: bold;
        font-size: 60rpx;
      }
    }
    
    .module-content {
      margin-left: 30rpx;
      display: flex;
      font-weight: bold;
      flex-direction: column;
      
      .module-title {
        color: #ffffff;
        font-weight: bold;
        font-size: 48rpx;
      }
    }
    

  }
}

.card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  
  .card-icon {
    width: 90rpx;
    height: 90rpx;
    border-radius: 45rpx;
    background-color: rgba(33, 150, 243, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20rpx;
    
    image {
      width: 50rpx;
      height: 50rpx;
    }
    
    &.admin-icon {
      background-color: rgba(255, 87, 34, 0.3);
      
      .iconfont {
        font-size: 40rpx;
        color: #FF5722;
      }
    }
  }
}
</style>
