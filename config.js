// 应用全局配置
module.exports = {
  baseUrl: process.env.NODE_ENV === 'production' ? 'http://47.111.122.119:8080' : 'http://localhost:8080',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "NovaChess-app",
    // 应用版本
    version: "1.2.0",
    // 应用logo
    logo: "/static/logo.png",
    // 政策协议
    agreements: [
    ]
  }
}
