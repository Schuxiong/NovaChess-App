<template>
  <view class="chess-login-container">
    <!-- 顶部间距 -->
    <top-spacing :height="statusBarHeight"></top-spacing>
    
    <view class="logo-content align-center justify-center flex">
      <image class="logo-image" :src="globalConfig.appInfo.logo" mode="widthFix"></image>
    </view>
    
    <view class="login-form-content">
      <view class="form-title">登录</view>
      
      <!-- 登录方式切换 -->
      <view class="login-type-switch">
        <view 
          class="login-type-item" 
          :class="{active: loginType === 'account'}"
          @click="switchLoginType('account')"
        >账号登录</view>
        <view 
          class="login-type-item" 
          :class="{active: loginType === 'phone'}"
          @click="switchLoginType('phone')"
        >手机登录</view>
      </view>
      
      <!-- 账号密码登录 -->
      <block v-if="loginType === 'account'">
        <view class="input-item flex align-center">
          <input v-model="loginForm.username" class="input" type="text" placeholder="用户名" maxlength="30" />
        </view>
        
        <view class="input-item flex align-center">
          <input v-model="loginForm.password" type="password" class="input" placeholder="密码" maxlength="20" />
        </view>
        
        <view class="input-item flex align-center captcha-container" v-if="captchaEnabled">
          <input v-model="loginForm.code" type="text" pattern="[0-9]*" inputmode="numeric" class="input captcha-input" placeholder="验证码" maxlength="4" />
          <view class="captcha-image"> 
            <image :src="codeUrl" @click="getCode" class="login-code-img"></image>
          </view>
        </view>
      </block>
      
      <!-- 手机号登录 -->
      <block v-else>
        <view class="input-item flex align-center">
          <input v-model="phoneForm.phonenumber" class="input" type="number" placeholder="手机号码" maxlength="11" />
        </view>
        
        <view class="input-item flex align-center captcha-container">
          <input v-model="phoneForm.code" type="text" pattern="[0-9]*" inputmode="numeric" class="input captcha-input" placeholder="验证码" maxlength="6" />
          <view class="captcha-btn" @click="getPhoneCode">
            <text>{{phoneCodeText}}</text>
          </view>
        </view>
      </block>
      
      <view class="action-btn">
        <button @click="handleLogin" class="login-btn">登录</button>
      </view>
      
      <view class="register-link" v-if="register">
        <text class="register-title">还没有账号?</text>
        <text @click="handleUserRegister" class="register-btn">注册 - 开始下棋!</text>
      </view>
    </view>
  </view>
</template>

<script>
  import { getCodeImg, phoneLogin } from '@/api/login'
  import TopSpacing from '@/components/TopSpacing.vue'

  export default {
    components: {
      TopSpacing
    },
    data() {
      return {
        statusBarHeight: 0,
        codeUrl: "",
        captchaEnabled: true,
        // 记住我
        rememberMe: false,
        // 用户注册开关
        register: true,
        // 登录方式：account-账号密码登录，phone-手机号登录
        loginType: 'account',
        // 手机验证码按钮文本
        phoneCodeText: '获取验证码',
        // 手机验证码倒计时
        phoneCodeTimer: null,
        phoneCodeCounter: 60,
        globalConfig: getApp().globalData.config,
        loginForm: {
          username: "",
          password: "",
          code: "",
          uuid: "",
          checkKey: "",
          captcha: ""
        },
        phoneForm: {
          phonenumber: "",
          code: ""
        }
      }
    },
    created() {
      this.getCode()
      // 获取状态栏高度
      const systemInfo = uni.getSystemInfoSync()
      this.statusBarHeight = systemInfo.statusBarHeight
    },
    methods: {
      // 切换登录方式
      switchLoginType(type) {
        this.loginType = type
      },
      // 切换记住我
      toggleRememberMe() {
        this.rememberMe = !this.rememberMe
      },
      // 用户注册
      handleUserRegister() {
        this.$tab.redirectTo(`/pages/register`)
      },
      // 隐私协议
      handlePrivacy() {
        let site = this.globalConfig.appInfo.agreements[0]
        this.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
      },
      // 用户协议
      handleUserAgrement() {
        let site = this.globalConfig.appInfo.agreements[1]
        this.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
      },
      // 获取手机验证码
      getPhoneCode() {
        if (this.phoneCodeTimer) {
          return
        }
        
        if (!this.phoneForm.phonenumber) {
          this.$modal.msgError("请输入手机号码")
          return
        }
        
        // 验证手机号格式
        if (!/^1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(this.phoneForm.phonenumber)) {
          this.$modal.msgError("请输入正确的手机号码")
          return
        }
        
        // 这里应该调用发送验证码的接口
        // 为了演示，直接开始倒计时
        this.$modal.msgSuccess("验证码已发送")
        this.phoneCodeCounter = 60
        this.phoneCodeText = `${this.phoneCodeCounter}秒后重新获取`
        
        this.phoneCodeTimer = setInterval(() => {
          this.phoneCodeCounter--
          this.phoneCodeText = `${this.phoneCodeCounter}秒后重新获取`
          
          if (this.phoneCodeCounter <= 0) {
            clearInterval(this.phoneCodeTimer)
            this.phoneCodeTimer = null
            this.phoneCodeText = '获取验证码'
          }
        }, 1000)
      },
      // 获取图形验证码
      getCode() {
        getCodeImg().then(res => {
          this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled
          if (this.captchaEnabled) {
            // 检查返回的图片数据是否已经包含前缀
            this.codeUrl = res.img.startsWith('data:image') ? res.img : 'data:image/gif;base64,' + res.img
            this.loginForm.uuid = res.uuid
          }
        })
      },
      // 登录方法
      async handleLogin() {
        if (this.loginType === 'account') {
          // 账号密码登录验证
          if (this.loginForm.username === "") {
            this.$modal.msgError("请输入账号")
          } else if (this.loginForm.password === "") {
            this.$modal.msgError("请输入密码")
          } else if (this.loginForm.code === "" && this.captchaEnabled) {
            this.$modal.msgError("请输入验证码")
          } else {
            this.$modal.loading("登录中，请耐心等待...")
            this.pwdLogin()
          }
        } else {
          // 手机号登录验证
          if (this.phoneForm.phonenumber === "") {
            this.$modal.msgError("请输入手机号码")
          } else if (this.phoneForm.code === "") {
            this.$modal.msgError("请输入验证码")
          } else {
            this.$modal.loading("登录中，请耐心等待...")
            this.mobileLogin()
          }
        }
      },
      // 密码登录
      async pwdLogin() {
        const loginData = {
          username: this.loginForm.username,
          password: this.loginForm.password,
          captcha: this.loginForm.code,
          checkKey: this.loginForm.uuid
        };
        this.$store.dispatch('Login', loginData).then(() => {
          this.$modal.closeLoading()
          this.loginSuccess()
        }).catch(() => {
          if (this.captchaEnabled) {
            this.getCode()
          }
        })
      },
      // 手机号登录
      async mobileLogin() {
        this.$store.dispatch('PhoneLogin', this.phoneForm).then(() => {
          this.$modal.closeLoading()
          this.loginSuccess()
        }).catch(() => {
          this.$modal.closeLoading()
        })
      },
      // 登录成功后，处理函数
      loginSuccess(result) {
        // 设置用户信息
        this.$store.dispatch('GetInfo').then(res => {
          // 为测试目的，当用户名为admin时，强制设置admin角色
          if (this.loginForm.username === 'admin') {
            this.$store.commit('SET_ROLES', ['admin'])
            console.log('已设置管理员角色')
          }
          this.$tab.reLaunch('/pages/index')
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  page {
  background-color: #666;
  background-size: cover;
  background-position: center;
  }

  .chess-login-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-image: url('https://pic1.imgdb.cn/item/67f356300ba3d5a1d7ef164f.png');
    background-size: cover;
    background-position: center;
    padding: 40rpx 30rpx;
    box-sizing: border-box;

    .logo-content {
      width: 100%;
      padding-top: 10%;
      margin-bottom: 30rpx;

      .logo-image {
        width: 200rpx;
        height: 200rpx;
        border-radius: 8rpx;
      }
    }

    .login-form-content {
      width: 90%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 10rpx;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
      padding: 40rpx 30rpx;
      
      .form-title {
        font-size: 42rpx;
        font-weight: bold;
        color: #EEE;
        margin-bottom: 40rpx;
        text-align: center;
      }

      .input-item {
        margin-bottom: 30rpx;
        height: 90rpx;
        border: 1rpx solid #dddddd55;
        border-radius: 8rpx;
        background-color: rgba(0, 0, 0, 0.1);
        overflow: hidden;

        .input {
          width: 100%;
          height: 100%;
          font-size: 30rpx;
          color: #EEE;
          padding: 0 30rpx;
        }
      }
      
      .remember-me {
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;
        
        .remember-text {
          font-size: 26rpx;
          color: #666;
          margin-left: 10rpx;
        }
      }
      
      .login-type-switch {
        display: flex;
        margin-bottom: 30rpx;
        
        .login-type-item {
          flex: 1;
          text-align: center;
          padding: 15rpx 0;
          font-size: 28rpx;
          color: #EEE;
          position: relative;
          transition: all 0.3s;
          
          &.active {
            color: #7fa650;
            font-weight: bold;
            
            &:after {
              content: '';
              position: absolute;
              bottom: -5rpx;
              left: 30%;
              width: 40%;
              height: 4rpx;
              background-color: #7fa650;
              border-radius: 2rpx;
            }
          }
        }
      }
      
      .captcha-container {
        display: flex;
        
        .captcha-input {
          flex: 1;
        }
        
        .captcha-image {
          width: 200rpx;
          height: 90rpx;
          
          .login-code-img {
            width: 100%;
            height: 100%;
          }
        }
        
        .captcha-btn {
          width: 200rpx;
          height: 90rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(127, 166, 80, 0.8);
          color: #fff;
          font-size: 24rpx;
          border-radius: 0 8rpx 8rpx 0;
        }
      }

      .login-btn {
        width: 100%;
        height: 90rpx;
        background-color: #7fa650;
        color: white;
        font-size: 32rpx;
        font-weight: bold;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20rpx;
        border: none;
      }
      
      .login-divider {
        display: flex;
        align-items: center;
        margin: 40rpx 0;
        
        .divider-line {
          flex: 1;
          height: 2rpx;
          background-color: #eee;
        }
        
        .divider-text {
          padding: 0 20rpx;
          color: #999;
          font-size: 28rpx;
        }
      }
      
      .social-login {
        display: flex;
        justify-content: center;
        margin-bottom: 40rpx;
        
        .social-btn {
          width: 90rpx;
          height: 90rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 20rpx;
          font-size: 50rpx;
          color: white;
          
          &.apple-btn {
            background-color: #000;
          }
          
          &.google-btn {
            background-color: #4285F4;
          }
          
          &.facebook-btn {
            background-color: #3b5998;
          }
        }
      }
      
      .register-link {
        padding-top: 30rpx;
        margin-top: 20rpx;
        text-align: center;
        
        .register-title {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 20rpx;
          display: block;
        }
        
        .register-btn {
          font-size: 32rpx;
          color: #7fa650;
          font-weight: bold;
          background-color: transparent;
          text-decoration: none;
          display: block;
        }
      }
    }
    
    .xieyi {
      margin-top: 40rpx;
      font-size: 24rpx;
      
      .text-blue {
        color: #7fa650;
        margin: 0 6rpx;
      }
    }
  }
</style>
