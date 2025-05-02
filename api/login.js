import request from '@/utils/request'

// 登录方法
export function login(username, password, captcha, checkKey) {
  const data = {
    username,
    password,
    captcha,
    checkKey
  }
  return request({
    'url': '/sys/login',
    headers: {
      isToken: false
    },
    'method': 'post',
    'data': data
  })
}

// 手机号登录方法
export function phoneLogin(phonenumber, captcha) {
  const data = {
    mobile: phonenumber,
    captcha: captcha
  }
  return request({
    'url': '/sys/phoneLogin',
    headers: {
      isToken: false
    },
    'method': 'post',
    'data': data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/sys/user/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    'url': '/sys/user/getUserInfo',
    'method': 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    'url': '/sys/logout',
    'method': 'post'
  })
}

// 获取验证码
export function getCodeImg() {
  // 生成随机的key
  const key = new Date().getTime() + Math.random().toString(36).substr(2, 8)
  return request({
    'url': `/sys/randomImage/${key}`,
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  }).then(res => {
    // 适配返回格式
    let imgData = res.result;
    // 修复双重base64编码问题
    if (imgData && imgData.startsWith('data:image/gif;base64,data:image')) {
      imgData = imgData.replace('data:image/gif;base64,', '');
    }
    return {
      img: imgData,
      uuid: key,
      captchaEnabled: true
    }
  })
}
