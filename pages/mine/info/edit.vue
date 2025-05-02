<template>
  <view class="edit-container">
    <top-spacing :height="statusBarHeight"></top-spacing>
    <view class="logo-content align-center justify-center flex">
      <image class="logo-image" :src="globalConfig.appInfo.logo" mode="widthFix"></image>
    </view>
    <view class="login-form-content">
      <view class="form-title">编辑信息</view>
      <uni-forms ref="form" :model="user" labelWidth="80px">
        <uni-forms-item label="用户昵称" name="realname">
          <uni-easyinput v-model="user.realname" placeholder="请输入昵称" />
        </uni-forms-item>
        <uni-forms-item label="手机号码" name="phone">
          <uni-easyinput v-model="user.phone" placeholder="请输入手机号码" />
        </uni-forms-item>
        <uni-forms-item label="邮箱" name="email">
          <uni-easyinput v-model="user.email" placeholder="请输入邮箱" />
        </uni-forms-item>
        <uni-forms-item label="性别" name="sex" required>
          <uni-data-checkbox v-model="user.sex" :localdata="sexs" />
        </uni-forms-item>
        <uni-forms-item label="头像" name="avatar">
          <uni-file-picker 
            v-model="user.avatar" 
            fileMediatype="image" 
            limit="1"
            :imageStyles="{width: '80px', height: '80px'}"
            @success="uploadSuccess"
            @fail="uploadFail"
          />
        </uni-forms-item>
      </uni-forms>
      <view class="action-btn">
        <button class="login-btn" @click="submit">保存</button>
      </view>
    </view>
  </view>
</template>

<script>
import TopSpacing from '@/components/TopSpacing.vue'
import request from '@/utils/request'
import { uploadAvatar, getUserData } from "@/api/system/user"

export default {
  components: { TopSpacing },
  data() {
    return {
      statusBarHeight: 0,
      globalConfig: getApp().globalData.config,
      user: {
        id: "",
        username: "",
        realname: "",
        phone: "",
        email: "",
        birthday: "",
        sex: 1,
        avatar: ''
      },
      sexs: [
        { text: '男', value: 1 },
        { text: '女', value: 2 }
      ],
      rules: {
        realname: {
          rules: [{ required: true, errorMessage: '用户昵称不能为空' }]
        },
        phone: {
          rules: [
            { required: true, errorMessage: '手机号码不能为空' },
            { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, errorMessage: '请输入正确的手机号码' }
          ]
        },
        email: {
          rules: [
            { required: true, errorMessage: '邮箱地址不能为空' },
            { format: 'email', errorMessage: '请输入正确的邮箱地址' }
          ]
        }
      }
    }
  },
  onLoad() {
    this.getUser()
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
  },
  onReady() {
    this.$refs.form.setRules(this.rules)
  },
  methods: {
    getUser() {
      getUserData().then(response => {
        this.user = {
          id: response.result.id,
          username: response.result.username,
          realname: response.result.realname,
          phone: response.result.phone,
          email: response.result.email,
          sex: response.result.sex || 1,
          avatar: response.result.avatar || '',
          birthday: response.result.birthday || ''
        }
      })
    },
    submit() {
      this.$refs.form.validate().then(() => {
        request({
          url: '/sys/user/appUserEdit',
          method: 'POST',
          data: {
            id: this.user.id,
            username: this.user.username,
            phone: this.user.phone,
            email: this.user.email,
            realname: this.user.realname,
            birthday: this.user.birthday,
            sex: this.user.sex,
            avatar: this.user.avatar
          }
        }).then(response => {
          this.$modal.msgSuccess("修改成功")
        }).catch(error => {
          this.$modal.msgError(error.message || "修改失败")
        })
      })
    },
    uploadSuccess(e) {
      this.user.avatar = e.tempFilePaths[0]
    },
    uploadFail(e) {
      this.$modal.msgError("头像上传失败：" + e.errMsg)
    }
  }
}
</script>

<style lang="scss" scoped>
.edit-container {
  display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
    background-size: cover;
    background-position: center;
    padding: 40rpx 30rpx;
    box-sizing: border-box;
}
.logo-content {
  margin-top: 40rpx;
  margin-bottom: 20rpx;
}
.logo-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;

  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.login-form-content {
  background: #28190c99;
  border-radius: 24rpx;
  margin: 0 32rpx;
  padding: 40rpx 32rpx 32rpx 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.form-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 32rpx;
  text-align: center;
}
.input-item {
  margin-bottom: 32rpx;
}
.action-btn {
  margin-top: 40rpx;
}
.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(90deg, #81b64c 0%, #81b64c 100%);
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
  border-radius: 44rpx;
  box-shadow: 0 2rpx 8rpx rgba(30,111,255,0.12);
}
</style>
