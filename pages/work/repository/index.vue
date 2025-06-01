<template>
  <view class="repository-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 顶部课程引导模块 -->
    <view class="header-section">
      <view class="progress-path">
        <image class="rook-icon" src="/static/images/chess/rook.png" mode="aspectFit"></image>
        <view class="title-container">
          <text class="title">学习下棋</text>
        </view>
      </view>
      <view class="start-course-btn" @click="startCourse">
        <text>开始课程</text>
      </view>
    </view>
    
    <!-- 中部课程展示模块 -->
    <view class="main-section">
      <!-- 标签切换 -->
      <view class="tabs">
        <view class="tab" :class="{active: activeTab === 'repository'}" @click="switchTab('repository')">
          <text>课程库</text>
          <view class="underline" v-if="activeTab === 'repository'"></view>
        </view>
        <view class="tab" :class="{active: activeTab === 'guide'}" @click="switchTab('guide')">
          <text>指导</text>
          <view class="underline" v-if="activeTab === 'guide'"></view>
        </view>
      </view>
      
      <!-- 分类图标区域 -->
      <view class="category-icons">
        <view 
          class="icon-item" 
          v-for="(category, index) in categories" 
          :key="index" 
          @click="switchCategory(category)"
          :class="{active: currentCategory === category.name}"
        >
          <image :src="category.icon" mode="aspectFit"></image>
          <text>{{ category.name }}</text>
        </view>
      </view>
      
      <!-- 课程卡片列表 -->
      <view class="course-list">
        <view 
          class="course-card" 
          v-for="(course, index) in filteredCourses" 
          :key="index" 
          @click="viewCourse(course)"
        >
          <view class="course-image">
            <image :src="course.image" mode="aspectFill"></image>
          </view>
          <view class="course-content">
            <view class="course-header">
              <view class="course-title">{{ course.title }}</view>
              <view class="course-badges">
                <view class="course-level">
                  <text>{{ course.level }}</text>
                </view>
                <view class="rating-badge" v-if="course.rating">
                  <text class="rating-star">⭐</text>
                  <text class="rating-text">{{ course.rating }}</text>
                </view>
              </view>
            </view>
            <view class="course-desc">{{ course.description }}</view>
            <view class="course-stats" v-if="course.students || course.duration">
              <view class="stat-item" v-if="course.students">
                <text class="stat-icon">👥</text>
                <text class="stat-text">{{ course.students }}</text>
              </view>
              <view class="stat-item" v-if="course.duration">
                <text class="stat-icon">⏱️</text>
                <text class="stat-text">{{ course.duration }}</text>
              </view>
              <view class="stat-item" v-if="course.price">
                <text class="stat-icon">💰</text>
                <text class="stat-text">{{ course.price }}</text>
              </view>
            </view>
            <view class="course-meta">
              <view class="course-author">
                <image v-if="course.authorAvatar" :src="course.authorAvatar" mode="aspectFit" class="author-avatar"></image>
                <text>{{ course.author }}</text>
              </view>
              <view class="external-link-indicator">
                <text class="link-icon">🔗</text>
                <text class="link-text">外部链接</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 分页指示器 -->
      <view class="pagination" v-if="totalPages > 1">
        <view 
          class="page-dot" 
          v-for="n in totalPages" 
          :key="n" 
          :class="{active: currentPage === n}"
          @click="goToPage(n)"
        ></view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <tab-bar active-tab="learn"></tab-bar>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue';
import TabBar from '@/components/TabBar.vue';

export default {
  components: {
    TopSpacing,
    TabBar
  },
  data() {
    return {
      statusBarHeight: 0,
      activeTab: 'repository',
      currentCategory: '全部',
      currentPage: 1,

      categories: [
        { name: '全部', icon: '/static/images/learn/chess-library.png' },
        { name: '开局', icon: '/static/images/learn/chess-move.png' },
        { name: '战术', icon: '/static/images/learn/knight-move.png' },
        { name: '策略', icon: '/static/images/learn/graduation-cap.png' },
        { name: '残局', icon: '/static/images/chess/king.png' },
        { name: '大师', icon: '/static/images/match/crown.png' },
      ],
      courses: [
        {
          id: 1,
          title: 'Chess.com 完整学习课程',
          description: '世界最大的国际象棋平台，提供从入门到大师级的完整课程体系，包含互动课程、战术训练和实战对弈。',
          author: 'Chess.com',
          authorAvatar: 'https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/SamCopeland/phpmeXx6V.png',
          level: '全等级',
          image: 'https://betacssjs.chesscomfiles.com/bundles/web/images/color-icons/lessons.svg',
          category: '全部',
          url: 'https://www.chess.com/learn',
          rating: '4.8',
          students: '10M+',
          duration: '无限制',
          price: '免费试用'
        },
        {
          id: 2,
          title: 'Lichess 免费学习平台',
          description: '完全免费的开源国际象棋平台，提供丰富的学习资源、谜题训练和在线对弈，无广告纯净体验。',
          author: 'Lichess Team',
          authorAvatar: 'https://lichess1.org/assets/_9biWQW/logo/lichess-favicon-512.png',
          level: '全等级',
          image: 'https://lichess1.org/assets/_9biWQW/logo/lichess-white.svg',
          category: '全部',
          url: 'https://lichess.org/learn',
          rating: '4.9',
          students: '5M+',
          duration: '无限制',
          price: '完全免费'
        },
        {
          id: 3,
          title: 'ChessNetwork 开局大师课',
          description: '专业的开局理论课程，涵盖所有主流开局体系，从基础原理到高级变化，助你建立完整的开局知识体系。',
          author: 'GM Boris Avrukh',
          authorAvatar: 'https://images.chesscomfiles.com/uploads/v1/user/45776.4d9b8b5c.160x160o.jpg',
          level: '中高级',
          image: 'https://www.chess.com/bundles/web/images/color-icons/opening.svg',
          category: '开局',
          url: 'https://www.chessnetwork.com/opening-course',
          rating: '4.7',
          students: '50K+',
          duration: '40小时',
          price: '$99'
        },
        {
          id: 4,
          title: 'Magnus Carlsen 大师班',
          description: '世界冠军马格努斯·卡尔森亲自授课，分享他的国际象棋哲学、战略思维和实战经验。',
          author: 'Magnus Carlsen',
          authorAvatar: 'https://images.chesscomfiles.com/uploads/v1/user/45796.2c0a3e9e.160x160o.jpg',
          level: '大师级',
          image: 'https://www.masterclass.com/course-images/attachments/HJx8tF5Qb/1920x1080_MC_MagnusCarlsen_TVL.jpg',
          category: '大师',
          url: 'https://www.masterclass.com/classes/magnus-carlsen-teaches-chess',
          rating: '4.9',
          students: '100K+',
          duration: '29课时',
          price: '$180/年'
        },
        {
          id: 5,
          title: 'ChessTempo 战术训练',
          description: '专业的战术谜题训练平台，提供超过10万道精选谜题，智能难度调节，快速提升战术水平。',
          author: 'ChessTempo',
          authorAvatar: 'https://chesstempo.com/images/logo-small.png',
          level: '中级',
          image: 'https://www.chess.com/bundles/web/images/color-icons/tactics.svg',
          category: '战术',
          url: 'https://chesstempo.com/',
          rating: '4.6',
          students: '200K+',
          duration: '无限制',
          price: '免费+高级'
        },
        {
          id: 6,
          title: 'ChessKing 策略学院',
          description: '系统性的策略课程，从位置评估到长期规划，培养深度的棋感和战略思维能力。',
          author: 'ChessKing Team',
          authorAvatar: 'https://www.chessking.com/images/logo.png',
          level: '高级',
          image: 'https://www.chess.com/bundles/web/images/color-icons/strategy.svg',
          category: '策略',
          url: 'https://www.chessking.com/courses/',
          rating: '4.5',
          students: '30K+',
          duration: '60小时',
          price: '$149'
        },
        {
          id: 7,
          title: 'Endgame University 残局学院',
          description: '专业的残局训练课程，涵盖基础残局到复杂残局的所有知识点，提升残局技巧和计算能力。',
          author: 'GM Karsten Müller',
          authorAvatar: 'https://images.chesscomfiles.com/uploads/v1/user/45123.4c8b9a2d.160x160o.jpg',
          level: '高级',
          image: 'https://www.chess.com/bundles/web/images/color-icons/endgame.svg',
          category: '残局',
          url: 'https://www.chessbase.com/endgames',
          rating: '4.8',
          students: '25K+',
          duration: '80小时',
          price: '$199'
        },
        {
          id: 8,
          title: 'Garry Kasparov 大师课程',
          description: '传奇世界冠军卡斯帕罗夫的经典课程，深入解析他的经典对局和战略思想。',
          author: 'Garry Kasparov',
          authorAvatar: 'https://images.chesscomfiles.com/uploads/v1/user/45001.1a2b3c4d.160x160o.jpg',
          level: '大师级',
          image: 'https://www.masterclass.com/course-images/attachments/kasparov-chess.jpg',
          category: '大师',
          url: 'https://www.masterclass.com/classes/garry-kasparov-teaches-chess',
          rating: '4.9',
          students: '150K+',
          duration: '32课时',
          price: '$180/年'
        },
        {
          id: 9,
          title: 'Chess24 在线学院',
          description: '欧洲顶级国际象棋平台，提供大师级课程、实时分析和专业解说，与世界顶尖棋手学习。',
          author: 'Chess24 Team',
          authorAvatar: 'https://chess24.com/images/logo.png',
          level: '全等级',
          image: 'https://chess24.com/images/course-preview.jpg',
          category: '全部',
          url: 'https://chess24.com/learn',
          rating: '4.7',
          students: '500K+',
          duration: '无限制',
          price: '€14.99/月'
        },
        {
          id: 10,
          title: 'ChessBase 开局百科',
          description: '权威的开局数据库和学习系统，包含最新的理论发展和大师实战，开局学习的终极资源。',
          author: 'ChessBase',
          authorAvatar: 'https://www.chessbase.com/images/logo.png',
          level: '高级',
          image: 'https://www.chessbase.com/images/opening-explorer.jpg',
          category: '开局',
          url: 'https://www.chessbase.com/opening-encyclopedia',
          rating: '4.8',
          students: '80K+',
          duration: '无限制',
          price: '$299'
        },
        {
          id: 11,
          title: 'Internet Chess Club (ICC)',
          description: '历史悠久的专业国际象棋平台，提供高质量的训练课程和与世界顶尖棋手对弈的机会。',
          author: 'ICC Team',
          authorAvatar: 'https://www.chessclub.com/images/icc-logo.png',
          level: '全等级',
          image: 'https://www.chessclub.com/images/training-preview.jpg',
          category: '全部',
          url: 'https://www.chessclub.com/',
          rating: '4.6',
          students: '300K+',
          duration: '无限制',
          price: '$59/年'
        },
        {
          id: 12,
          title: 'Forward Chess 电子书库',
          description: '最大的国际象棋电子书平台，收录数千本经典和现代国际象棋书籍，随时随地学习。',
          author: 'Forward Chess',
          authorAvatar: 'https://forwardchess.com/images/logo.png',
          level: '全等级',
          image: 'https://forwardchess.com/images/library-preview.jpg',
          category: '全部',
          url: 'https://forwardchess.com/',
          rating: '4.7',
          students: '120K+',
          duration: '无限制',
          price: '按书购买'
        }
      ]
    }
  },
  computed: {
    filteredCourses() {
      let courses = [];
      if (this.currentCategory === '全部') {
        courses = this.courses;
      } else {
        courses = this.courses.filter(course => course.category === this.currentCategory);
      }
      
      // 分页逻辑
      const coursesPerPage = 2;
      const startIndex = (this.currentPage - 1) * coursesPerPage;
      const endIndex = startIndex + coursesPerPage;
      return courses.slice(startIndex, endIndex);
    },
    
    totalPages() {
      let courses = [];
      if (this.currentCategory === '全部') {
        courses = this.courses;
      } else {
        courses = this.courses.filter(course => course.category === this.currentCategory);
      }
      const coursesPerPage = 2;
      return Math.ceil(courses.length / coursesPerPage);
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight;
  },
  methods: {
    startCourse() {
      // 跳转到课程页面
      uni.navigateTo({
        url: '/pages/work/index'
      });
    },
    switchTab(tab) {
      this.activeTab = tab;
    },
    switchCategory(category) {
      this.currentCategory = category.name;
      this.currentPage = 1;
    },
    viewCourse(course) {
      // 查看课程详情逻辑
      console.log('查看课程：', course.title);
      
      // 如果课程有外部链接，则在浏览器中打开
      if (course.url) {
        // #ifdef H5
        window.open(course.url, '_blank');
        // #endif
        
        // #ifdef APP-PLUS
        plus.runtime.openURL(course.url);
        // #endif
        
        // #ifdef MP
        uni.showModal({
          title: '提示',
          content: '请复制链接到浏览器打开：' + course.url,
          showCancel: false
        });
        // #endif
      } else {
        // 内部课程详情页面
        uni.navigateTo({
          url: `/pages/work/repository/detail?id=${course.id}`
        });
      }
    },
    goToPage(page) {
      this.currentPage = page;
    }
  }
}
</script>

<style lang="scss" scoped>
.repository-container {
  min-height: 100vh;
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx;
}

/* 顶部课程引导模块 */
.header-section {
  padding: 30rpx;
  
  .progress-path {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .rook-icon {
      width: 80rpx;
      height: 80rpx;
      margin-right: 20rpx;
    }
    
    .title-container {
      .title {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: bold;
      }
    }
  }
  
  .start-course-btn {
    background-color: #8BC34A;
    border-radius: 10rpx;
    padding: 24rpx 0;
    text-align: center;
    width: 100%;
    margin: 0 auto;
    
    text {
      color: #ffffff;
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}

/* 中部课程展示模块 */
.main-section {
  flex: 1;
  padding: 0 30rpx;
  
  /* 标签切换 */
  .tabs {
    display: flex;
    margin-bottom: 40rpx;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    
    .tab {
      padding: 20rpx 0;
      margin-right: 60rpx;
      position: relative;
      
      text {
        color: #ffffff;
        font-size: 28rpx;
      }
      
      &.active {
        .underline {
          position: absolute;
          bottom: -2rpx;
          left: 0;
          width: 100%;
          height: 4rpx;
          background-color: #ffffff;
        }
      }
    }
  }
  
  /* 分类图标区域 */
  .category-icons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30rpx;
    margin-bottom: 40rpx;
    
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.7;
      transition: opacity 0.3s;
      
      &.active {
        opacity: 1;
      }
      
      image {
        width: 80rpx;
        height: 80rpx;
        margin-bottom: 10rpx;
      }
      
      text {
        color: #ffffff;
        font-size: 24rpx;
      }
    }
  }
  
  /* 课程卡片列表 */
  .course-list {
    .course-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16rpx;
      margin-bottom: 30rpx;
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-4rpx);
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
      }
      
      .course-image {
        height: 300rpx;
        width: 100%;
        position: relative;
        
        image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .course-content {
        padding: 20rpx;
        
        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12rpx;
        }
        
        .course-title {
          color: #ffffff;
          font-size: 32rpx;
          font-weight: bold;
          flex: 1;
          margin-right: 16rpx;
          line-height: 1.3;
        }
        
        .course-badges {
          display: flex;
          flex-direction: column;
          gap: 8rpx;
          align-items: flex-end;
        }
        
        .course-level {
          background: rgba(255, 215, 0, 0.2);
          color: #FFD700;
          padding: 6rpx 12rpx;
          border-radius: 16rpx;
          font-size: 22rpx;
          border: 1px solid rgba(255, 215, 0, 0.3);
          white-space: nowrap;
        }
        
        .rating-badge {
          display: flex;
          align-items: center;
          background: rgba(255, 165, 0, 0.2);
          padding: 4rpx 10rpx;
          border-radius: 12rpx;
          border: 1px solid rgba(255, 165, 0, 0.3);
        }
        
        .rating-star {
          font-size: 20rpx;
          margin-right: 4rpx;
        }
        
        .rating-text {
          color: #FFA500;
          font-size: 20rpx;
          font-weight: bold;
        }
        
        .course-desc {
          color: rgba(255, 255, 255, 0.8);
          font-size: 26rpx;
          margin-bottom: 16rpx;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .course-stats {
          display: flex;
          gap: 16rpx;
          margin-bottom: 16rpx;
          flex-wrap: wrap;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 6rpx 12rpx;
          border-radius: 12rpx;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .stat-icon {
          font-size: 20rpx;
          margin-right: 6rpx;
        }
        
        .stat-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 22rpx;
          font-weight: 500;
        }
        
        .course-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .course-author {
            display: flex;
            align-items: center;
            flex: 1;
            
            .author-avatar {
              width: 40rpx;
              height: 40rpx;
              border-radius: 50%;
              margin-right: 12rpx;
            }
            
            text {
              color: rgba(255, 255, 255, 0.7);
              font-size: 24rpx;
            }
          }
          
          .external-link-indicator {
            display: flex;
            align-items: center;
            background: rgba(0, 123, 255, 0.2);
            padding: 4rpx 10rpx;
            border-radius: 12rpx;
            border: 1px solid rgba(0, 123, 255, 0.3);
          }
          
          .link-icon {
            font-size: 18rpx;
            margin-right: 4rpx;
          }
          
          .link-text {
            color: #007BFF;
            font-size: 20rpx;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  /* 分页指示器 */
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 30rpx;
    margin-bottom: 30rpx;
    
    .page-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.3);
      margin: 0 10rpx;
      
      &.active {
        background-color: #ffffff;
      }
    }
  }
}
</style>