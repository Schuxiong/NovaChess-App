<template>
  <view class="course-edit-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="iconfont icon-left"></text>
      </view>
      <view class="title">
        <text>{{ isEdit ? '编辑课程' : '新建课程' }}</text>
      </view>
      <view class="header-right">
        <view class="save-btn" @click="saveCourse">
          <text>保存</text>
        </view>
      </view>
    </view>
    
    <!-- 表单内容区域 -->
    <scroll-view class="form-container" scroll-y="true" enable-back-to-top="true">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">
          <text class="iconfont icon-info"></text>
          <text>基本信息</text>
        </view>
        
        <view class="form-item">
          <text class="label">课程ID</text>
          <input 
            type="text" 
            placeholder="输入英文ID，如king-moves" 
            v-model="course.id"
            :focus="!isEdit"
          />
          <text class="tip">用于系统识别课程，建议使用英文</text>
        </view>
        
        <view class="form-item">
          <text class="label">课程标题</text>
          <input 
            type="text" 
            placeholder="输入课程标题" 
            v-model="course.title"

          />
        </view>
        
        <view class="form-item">
          <text class="label">课程描述</text>
          <textarea 
            placeholder="描述此课程内容和学习收获" 
            v-model="course.description"
            maxlength="200"
          ></textarea>
          <text class="count">{{ course.description.length }}/200</text>
        </view>
        
        <view class="form-item">
          <text class="label">课程分类</text>
          <view class="select-box">
            <picker 
              mode="selector" 
              :range="categories" 
              range-key="label"
              :value="categoryIndex"
              @change="onCategoryChange"
            >
              <view class="picker-value">
                <text>{{ categories[categoryIndex].label }}</text>
                <text class="iconfont icon-down"></text>
              </view>
            </picker>
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">课程图标</text>
          <view class="icon-picker">
            <view class="icon-preview">
              <image 
                :src="course.icon || defaultIcon" 
                mode="aspectFit"
              ></image>
            </view>
            <view class="icon-actions">
              <view class="icon-btn" @click="chooseIcon">
                <text class="iconfont icon-image"></text>
                <text>选择图片</text>
              </view>
              <view class="icon-btn" @click="useDefaultIcon">
                <text class="iconfont icon-refresh"></text>
                <text>使用默认</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 步骤列表 -->
      <view class="form-section">
        <view class="section-title">
          <text class="iconfont icon-steps"></text>
          <text>课程步骤</text>
          <view class="add-btn" @click="addStep">
            <text class="iconfont icon-add"></text>
            <text>添加步骤</text>
          </view>
        </view>
        
        <view 
          class="step-item"
          v-for="(step, index) in course.steps" 
          :key="index"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="step-header">
            <view class="step-title">步骤 {{ index + 1 }}</view>
            <view class="step-actions">
              <view class="action-btn up-btn" @click="moveStepUp(index)" v-if="index > 0">
                <text class="iconfont icon-up">上移</text>
              </view>
              <view class="action-btn down-btn" @click="moveStepDown(index)" v-if="index < course.steps.length - 1">
                <text class="iconfont icon-down">下移</text>
              </view>
              <view class="action-btn delete-btn" @click="removeStep(index)">
                <text class="iconfont icon-delete">删除</text>
              </view>
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">步骤类型</text>
            <view class="select-box">
              <picker 
                mode="selector" 
                :range="stepTypes" 
                range-key="label"
                :value="getStepTypeIndex(step.type)"
                @change="onStepTypeChangeHandler($event, index)"
              >
                <view class="picker-value">
                  <text>{{ getStepTypeLabel(step.type) }}</text>
                  <text class="iconfont icon-down"></text>
                </view>
              </picker>
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">提示消息</text>
            <textarea 
              placeholder="输入该步骤中显示的提示消息" 
              v-model="step.message"
              maxlength="200"
            ></textarea>
          </view>
          
          <!-- 棋盘设置 -->
          <view class="form-item board-config">
            <text class="label">棋盘设置</text>
            <view class="checkbox-item">
              <checkbox :checked="step.boardSetup && step.boardSetup.clear" @click="toggleBoardClear(index)" />
              <text font-color="#EEE">清空棋盘</text>
            </view>
            
            <text class="board-tip">若不清空，将保持上一步骤的棋盘状态</text>
          </view>
          
          <!-- 不同步骤类型的特定配置 -->
          <view class="step-type-config" v-if="step.type === 'task'">
            <view class="config-title">任务步骤特定设置</view>
            
            <view class="form-item">
              <text class="label">期望移动</text>
              <view class="move-inputs">
                <view class="move-input-group">
                  <text class="group-label">从</text>
                  <input 
                    type="text" 
                    placeholder="行" 
                    v-model="step.expectedMove.from.row" 
                    class="small-input"
                  />
                  <input 
                    type="text" 
                    placeholder="列" 
                    v-model="step.expectedMove.from.col" 
                    class="small-input"
                  />
                </view>
                <view class="move-input-group">
                  <text class="group-label">到</text>
                  <input 
                    type="text" 
                    placeholder="行" 
                    v-model="step.expectedMove.to.row" 
                    class="small-input"
                  />
                  <input 
                    type="text" 
                    placeholder="列" 
                    v-model="step.expectedMove.to.col" 
                    class="small-input"
                  />
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="label">正确提示</text>
              <textarea 
                placeholder="正确移动后显示的消息" 
                v-model="step.correctMessage"
              ></textarea>
            </view>
            
            <view class="form-item">
              <text class="label">错误提示</text>
              <textarea 
                placeholder="错误移动后显示的消息" 
                v-model="step.errorMessage"
              ></textarea>
            </view>
            
            <view class="form-item">
              <text class="label">提示信息</text>
              <textarea 
                placeholder="用户点击提示按钮时显示的消息" 
                v-model="step.hintMessage"
              ></textarea>
            </view>
          </view>
        </view>
        
        <!-- 无步骤提示 -->
        <view class="empty-steps" v-if="course.steps.length === 0">
          <image src="/static/images/empty.png" mode="aspectFit"></image>
          <text>尚未添加任何步骤</text>
          <view class="add-step-btn" @click="addStep">
            <text class="iconfont icon-add"></text>
            <text>添加第一个步骤</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import { checkRole } from '@/utils/permission'
import { getCourseDetail, addCourse, updateCourse, getCourseStepList, addCourseStep, updateCourseStep, deleteCourseStep, getBoardSetupList, addBoardSetup, updateBoardSetup, deleteBoardSetup } from '@/api/course'

export default {
  components: {
    TopSpacing
  },
  data() {
    return {
      statusBarHeight: 0,
      isEdit: false,
      courseId: '',
      defaultIcon: 'https://pic1.imgdb.cn/item/67f3d490e381c3632bee96f4.png',
      course: {
        id: '',
        title: '',
        description: '',
        icon: '',
        category: 'basic',
        steps: []
      },
      categories: [
        { value: 'basic', label: '基础' },
        { value: 'advanced', label: '进阶' },
        { value: 'strategy', label: '策略' }
      ],
      stepTypes: [
        { value: 'intro', label: '介绍' },
        { value: 'task', label: '任务' },
        { value: 'demo', label: '演示' }
      ]
    }
  },
  computed: {
    categoryIndex() {
      return this.categories.findIndex(item => item.value === this.course.category) || 0
    }
  },
  onLoad(options) {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 检查管理员权限
    if (!this.checkAdminPermission()) {
      uni.showToast({
        title: '无权访问管理界面',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 判断编辑模式
    this.isEdit = options.mode === 'edit'
    
    if (this.isEdit && options.id) {
      this.courseId = options.id
      this.loadCourseData(this.courseId)
    }
  },
  
  beforeDestroy() {
    // 清理资源
    this.course = {
      id: '',
      title: '',
      description: '',
      category: 'basic',
      icon: '',
      steps: []
    }
  },
  methods: {
    // 检查管理员权限（临时修改为允许所有人访问）
    checkAdminPermission() {
      // 临时返回true，允许所有人访问管理界面进行测试
      return true
      // 原代码：return checkRole(['admin'])
    },
    
    // 加载课程数据
    loadCourseData(courseId) {
      uni.showLoading({
        title: '加载中...'
      });
      
      getCourseDetail(courseId).then(res => {
        if (res.success && res.result) {
          // 更新课程数据
          this.course = res.result;
          
          // 如果没有步骤数据，初始化为空数组
          if (!this.course.steps) {
            this.course.steps = [];
          }
          
          // 更新分类索引
          this.categoryIndex = this.categories.findIndex(item => item.value === this.course.category);
          if (this.categoryIndex === -1) this.categoryIndex = 0;
        } else {
          uni.showToast({
            title: '获取课程数据失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('获取课程数据失败', err);
        uni.showToast({
          title: '获取课程数据失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 获取步骤类型索引
    getStepTypeIndex(type) {
      return this.stepTypes.findIndex(item => item.value === type) || 0
    },
    
    // 获取步骤类型标签
    getStepTypeLabel(type) {
      const stepType = this.stepTypes.find(item => item.value === type)
      return stepType ? stepType.label : '未知类型'
    },
    
    // 步骤类型变更处理
    onStepTypeChangeHandler(e, index) {
      const typeIndex = e.detail.value
      const newType = this.stepTypes[typeIndex].value
      
      // 更新步骤类型
      this.course.steps[index].type = newType
      
      // 根据类型初始化必要字段
      if (newType === 'task' && !this.course.steps[index].expectedMove) {
        this.course.steps[index].expectedMove = {
          from: { row: 0, col: 0 },
          to: { row: 0, col: 0 }
        }
        this.course.steps[index].correctMessage = ''
        this.course.steps[index].errorMessage = ''
        this.course.steps[index].hintMessage = ''
      }
    },
    
    // 分类变更
    onCategoryChange(e) {
      const index = e.detail.value
      this.course.category = this.categories[index].value
    },
    
    // 选择图标
    chooseIcon() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.course.icon = res.tempFilePaths[0]
          
          // 实际开发中，这里应该上传图片到服务器，然后设置返回的URL
          uni.showToast({
            title: '图片已选择',
            icon: 'success'
          })
        }
      })
    },
    
    // 使用默认图标
    useDefaultIcon() {
      this.course.icon = this.defaultIcon
      uni.showToast({
        title: '已使用默认图标',
        icon: 'success'
      })
    },
    
    // 添加步骤
    addStep() {
      // 添加一个新步骤
      const newStep = {
        type: 'intro',
        message: '',
        boardSetup: {
          clear: false,
          pieces: []
        },
        courseId: this.course.id // 关联到当前课程
      };
      
      // 如果是新建课程，直接添加到本地数组
      if (!this.isEdit || !this.course.id) {
        this.course.steps.push(newStep);
        return;
      }
      
      // 如果是编辑现有课程，调用API
      uni.showLoading({ title: '添加中...' });
      
      addCourseStep(newStep).then(res => {
        if (res.success && res.result) {
          // 添加成功，将返回的步骤（包含ID）添加到列表
          this.course.steps.push(res.result);
          uni.showToast({
            title: '添加步骤成功',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: '添加步骤失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('添加步骤失败', err);
        uni.showToast({
          title: '添加步骤失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 删除步骤
    removeStep(index) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除步骤${index + 1}吗？`,
        success: (res) => {
          if (res.confirm) {
            const step = this.course.steps[index];
            
            // 如果是新建课程或步骤没有ID，直接从数组中移除
            if (!this.isEdit || !step.id) {
              this.course.steps.splice(index, 1);
              return;
            }
            
            // 如果是编辑现有课程，调用API删除
            uni.showLoading({ title: '删除中...' });
            
            deleteCourseStep(step.id).then(res => {
              if (res.success) {
                // 删除成功，从数组中移除
                this.course.steps.splice(index, 1);
                uni.showToast({
                  title: '删除步骤成功',
                  icon: 'success'
                });
              } else {
                uni.showToast({
                  title: res.message || '删除步骤失败',
                  icon: 'none'
                });
              }
            }).catch(err => {
              console.error('删除步骤失败', err);
              uni.showToast({
                title: '删除步骤失败',
                icon: 'none'
              });
            }).finally(() => {
              uni.hideLoading();
            });
          }
        }
      });
    },
    
    // 步骤上移
    moveStepUp(index) {
      if (index > 0) {
        const temp = this.course.steps[index]
        this.$set(this.course.steps, index, this.course.steps[index - 1])
        this.$set(this.course.steps, index - 1, temp)
      }
    },
    
    // 步骤下移
    moveStepDown(index) {
      if (index < this.course.steps.length - 1) {
        const temp = this.course.steps[index]
        this.$set(this.course.steps, index, this.course.steps[index + 1])
        this.$set(this.course.steps, index + 1, temp)
      }
    },
    
    // 切换清空棋盘
    toggleBoardClear(index) {
      if (!this.course.steps[index].boardSetup) {
        this.course.steps[index].boardSetup = {}
      }
      this.course.steps[index].boardSetup.clear = !this.course.steps[index].boardSetup.clear
    },
    
    // 保存课程
    saveCourse() {
      // 表单验证
      if (!this.course.id) {
        uni.showToast({
          title: '请输入课程ID',
          icon: 'none'
        })
        return
      }
      
      if (!this.course.title) {
        uni.showToast({
          title: '请输入课程标题',
          icon: 'none'
        })
        return
      }
      
      if (!this.course.description) {
        uni.showToast({
          title: '请输入课程描述',
          icon: 'none'
        })
        return
      }
      
      if (this.course.steps.length === 0) {
        uni.showToast({
          title: '请至少添加一个步骤',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({
        title: '保存中...'
      });
      
      // 根据是否是编辑模式选择API
      const savePromise = this.isEdit ? updateCourse(this.course) : addCourse(this.course);
      
      savePromise.then(res => {
        if (res.success) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || '保存失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('保存课程失败', err);
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    // 返回上一页
    goBack() {
      uni.showModal({
        title: '确认返回',
        content: '您有未保存的更改，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.course-edit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1E3A50 0%, #27496D 100%);
  background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
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
    .save-btn {
      padding: 12rpx 30rpx;
      background-color: #8BC34A;
      border-radius: 30rpx;
      
      text {
        color: #ffffff;
        font-size: 28rpx;
        font-weight: bold;
      }
    }
  }
}

/* 表单内容区域 */
.form-container {
  flex: 1;
  padding: 0 30rpx;
  padding-bottom: 60rpx;
}

/* 表单区块 */
.form-section {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    text {
      color: #EEE;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .iconfont {
      color: #2196F3;
      font-size: 36rpx;
      margin-right: 10rpx;
    }
    
    .add-btn {
      margin-left: auto;
      display: flex;
      align-items: center;
      padding: 10rpx 20rpx;
      background-color: #8BC34A;
      border-radius: 30rpx;
      
      text {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: normal;
      }
      
      .iconfont {
        color: #ffffff;
        font-size: 24rpx;
        margin-right: 5rpx;
      }
    }
  }
}

/* 表单项样式 */
.form-item input {
  height: 80rpx;
  padding: 20rpx;
}
.form-item {
  margin-bottom: 30rpx;
  
  .label {
    display: block;
    color: #EEE;
    font-size: 28rpx;
    height: auto;
    font-weight: bold;
    margin-bottom: 15rpx;
  }
  
  input, textarea, .select-box {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 10rpx;
    padding: 20rpx;
    box-sizing: border-box;
    font-size: 28rpx;
    color: #EEE;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  textarea {
    height: 150rpx;
    line-height: 1.5;
  }
  
  .tip, .count {
    display: block;
    color: #999999;
    font-size: 24rpx;
    margin-top: 10rpx;
  }
  
  .count {
    text-align: right;
  }
  
  .select-box {
    position: relative;
    
    .picker-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .iconfont {
        color: #999999;
        font-size: 28rpx;
      }
    }
  }
  
  &.board-config {
    .checkbox-item {
      display: flex;
      align-items: center;
      margin-bottom: 15rpx;
      
      checkbox {
        margin-right: 10rpx;
        transform: scale(0.8);
      }
    }
    
    .board-tip {
      color: #999999;
      font-size: 24rpx;
    }
  }
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  align-items: center;
  
  .icon-preview {
    width: 120rpx;
    height: 120rpx;
    background-color: #f5f5f5;
    border-radius: 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 30rpx;
    overflow: hidden;
    
    image {
      width: 80rpx;
      height: 80rpx;
    }
  }
  
  .icon-actions {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .icon-btn {
      display: flex;
      align-items: center;
      padding: 15rpx 0;
      
      .iconfont {
        color: #2196F3;
        font-size: 28rpx;
        margin-right: 10rpx;
      }
      
      text {
        color: #EEE;
        font-size: 28rpx;
      }
    }
  }
}

/* 步骤项样式 */
.step-item {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
  border: 2px solid rgba(255, 255, 255, 0.05);
  
  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .step-title {
      color: #EEE;
      font-size: 28rpx;
      font-weight: bold;
    }
    
    .step-actions {
      display: flex;
      
      .action-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 10rpx;
        padding: 10rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 10rpx;
        
        .iconfont {
          font-size: 28rpx;
        }
        
        &.up-btn {
          background-color: rgba(33, 150, 243, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #EEE;
          }
        }
        
        &.down-btn {
          background-color: rgba(33, 150, 243, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #EEE;
          }
        }
        
        &.delete-btn {
          background-color: rgba(255, 87, 34, 0.1);
          
          .iconfont {
            font-size: 20rpx;
            font-weight: bold;
            color: #a73c3c;
          }
        }
      }
    }
  }
  
  .step-type-config {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1px dashed #e0e0e0;
    
    .config-title {
      color: #2196F3;
      font-size: 26rpx;
      font-weight: bold;
      margin-bottom: 20rpx;
    }
    
    .move-inputs {
      display: flex;
      justify-content: space-between;
      
      .move-input-group {
        flex: 1;
        display: flex;
        align-items: center;
        
        .group-label {
          color: #666666;
          font-size: 26rpx;
          margin-right: 10rpx;
        }
        
        .small-input {
          width: 100rpx;
          text-align: center;
          margin-right: 10rpx;
        }
      }
    }
  }
}

/* 无步骤状态 */
.empty-steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
    opacity: 0.7;
  }
  
  text {
    color: #999999;
    font-size: 28rpx;
    margin-bottom: 30rpx;
  }
  
  .add-step-btn {
    display: flex;
    align-items: center;
    padding: 15rpx 40rpx;
    background-color: #8BC34A;
    border-radius: 40rpx;
    
    text {
      color: #ffffff;
      font-size: 26rpx;
      margin-bottom: 0;
    }
    
    .iconfont {
      color: #ffffff;
      font-size: 26rpx;
      margin-right: 10rpx;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>