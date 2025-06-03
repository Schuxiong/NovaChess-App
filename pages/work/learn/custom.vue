<template>
  <view class="custom-course-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="iconfont icon-left"></text>
      </view>
      <view class="title">
        <text>自定义课程</text>
      </view>
      <view class="header-right"></view>
    </view>
    
    <!-- 引导文本 -->
    <view class="guide-text">
      <text>学习您创建的自定义国际象棋课程</text>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text>加载中...</text>
    </view>
    
    <!-- 课程列表 -->
    <view v-else class="lesson-list">
      <view 
        v-for="course in courseList" 
        :key="course.id" 
        class="lesson-item"
        @click="goToCourse(course)"
      >
        <view class="lesson-icon">
          <image :src="course.icon" mode="aspectFit"></image>
        </view>
        <view class="lesson-content">
          <view class="lesson-title">
            <text>{{ course.title }}</text>
          </view>
          <view class="lesson-desc">
            <text>{{ course.description }}</text>
          </view>
          <view class="lesson-meta">
            <text class="category-tag">{{ getCategoryName(course.category) }}</text>
            <text class="steps-count">{{ (course.steps && course.steps.length) || 0 }}个步骤</text>
          </view>
        </view>
        <view class="lesson-status">
          <view class="arrow-icon">
            <text class="iconfont icon-right"></text>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="courseList.length === 0" class="empty-state">
        <image src="https://pic1.imgdb.cn/item/67f3eb4ce381c3632beea0b4.png" mode="aspectFit"></image>
        <text class="empty-text">还没有自定义课程</text>
        <text class="empty-desc">去课程管理创建您的第一个课程吧！</text>
        <view class="create-btn" @click="goToAdmin">
          <text>创建课程</text>
        </view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <tab-bar active-tab="learn"></tab-bar>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import TabBar from '@/components/TabBar.vue'
import { getCourseList } from '@/api/course'

export default {
  components: {
    TopSpacing,
    TabBar
  },
  data() {
    return {
      statusBarHeight: 0,
      loading: false,
      courseList: []
    }
  },
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 加载课程数据
    this.loadCourseData()
  },
  onShow() {
    // 页面显示时刷新数据
    this.loadCourseData()
  },
  methods: {
    // 加载课程数据
    async loadCourseData() {
      this.loading = true
      try {
        const response = await getCourseList()
        
        if (response && response.result) {
          const courseData = response.result?.records || []
          
          // 转换数据格式以匹配前端期望的结构
          this.courseList = courseData.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            icon: course.iconUrl || this.getDefaultIcon(course.category),
            category: course.category,
            steps: course.steps || [],
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
          }))
        } else {
          this.courseList = []
        }
      } catch (error) {
        console.error('加载课程数据失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        this.courseList = []
      } finally {
        this.loading = false
      }
    },
    
    // 获取默认图标
    getDefaultIcon(category) {
      const iconMap = {
        'basic': 'https://pic1.imgdb.cn/item/67f3d477e381c3632bee96e5.png',
        'advanced': 'https://pic1.imgdb.cn/item/67f3d477e381c3632bee96e6.png',
        'strategy': 'https://pic1.imgdb.cn/item/67f3d491e381c3632bee96f9.png',
        'endgame': 'https://pic1.imgdb.cn/item/67f3d490e381c3632bee96f8.png'
      }
      return iconMap[category] || 'https://pic1.imgdb.cn/item/67f3d477e381c3632bee96e5.png'
    },
    
    // 获取分类名称
    getCategoryName(category) {
      const categoryMap = {
        'basic': '基础',
        'advanced': '进阶',
        'strategy': '策略',
        'endgame': '残局'
      }
      return categoryMap[category] || '其他'
    },
    
    // 前往课程学习
    goToCourse(course) {
      // 跳转到课程详情学习页面
      uni.navigateTo({
        url: `/pages/work/learn/course-detail?id=${course.id}`
      })
    },
    
    // 前往课程管理
    goToAdmin() {
      uni.navigateTo({
        url: '/pages/work/admin/course/index'
      })
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-course-container {
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  padding-bottom: 30rpx;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  
  .back-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      color: #ffffff;
      font-size: 44rpx;
    }
  }
  
  .title {
    flex: 1;
    text-align: center;
    
    text {
      color: #ffffff;
      font-size: 44rpx;
      font-weight: bold;
    }
  }
  
  .header-right {
    width: 80rpx;
  }
}

/* 引导文本 */
.guide-text {
  padding: 0 30rpx 40rpx;
  text-align: center;
  
  text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 28rpx;
    line-height: 1.5;
  }
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    color: #ffffff;
    font-size: 32rpx;
  }
}

/* 课程列表 */
.lesson-list {
  flex: 1;
  padding: 0 30rpx;
  margin-bottom: 120rpx;
  
  .lesson-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    display: flex;
    align-items: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    
    &:active {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(0.98);
    }
    
    .lesson-icon {
      width: 120rpx;
      height: 120rpx;
      margin-right: 30rpx;
      
      image {
        width: 100%;
        height: 100%;
        border-radius: 16rpx;
      }
    }
    
    .lesson-content {
      flex: 1;
      
      .lesson-title {
        margin-bottom: 10rpx;
        
        text {
          color: #ffffff;
          font-size: 36rpx;
          font-weight: bold;
        }
      }
      
      .lesson-desc {
        margin-bottom: 15rpx;
        
        text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 28rpx;
          line-height: 1.4;
        }
      }
      
      .lesson-meta {
        display: flex;
        align-items: center;
        gap: 20rpx;
        
        .category-tag {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 24rpx;
          padding: 8rpx 16rpx;
          border-radius: 12rpx;
        }
        
        .steps-count {
          color: rgba(255, 255, 255, 0.6);
          font-size: 24rpx;
        }
      }
    }
    
    .lesson-status {
      .arrow-icon {
        .iconfont {
          color: rgba(255, 255, 255, 0.6);
          font-size: 32rpx;
        }
      }
    }
  }
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 60rpx;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
    opacity: 0.8;
  }
  
  .empty-text {
    color: #ffffff;
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
  }
  
  .empty-desc {
    color: rgba(255, 255, 255, 0.7);
    font-size: 28rpx;
    text-align: center;
    line-height: 1.5;
    margin-bottom: 60rpx;
  }
  
  .create-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    padding: 24rpx 48rpx;
    border-radius: 50rpx;
    font-size: 32rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
    }
    
    text {
      color: #ffffff;
    }
  }
}
</style>