<template>
  <view class="summary-container">
    <scroll-view class="summary-scroll" scroll-y="true">
      <view class="summary-content">
        <rich-text :nodes="formattedContent" class="summary-rich-text"></rich-text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  name: 'SummaryDisplay',
  props: {
    summaryContent: {
      type: String,
      default: ''
    }
  },
  computed: {
    formattedContent() {
      if (!this.summaryContent) return [];
      
      // 将Markdown格式转换为rich-text可识别的格式
      let content = this.summaryContent;
      
      // 处理标题
      content = content.replace(/^### (.*$)/gim, '<h3 style="color: #fff; font-size: 32rpx; font-weight: bold; margin: 20rpx 0 10rpx 0;">$1</h3>');
      content = content.replace(/^## (.*$)/gim, '<h2 style="color: #fff; font-size: 36rpx; font-weight: bold; margin: 24rpx 0 12rpx 0;">$1</h2>');
      content = content.replace(/^# (.*$)/gim, '<h1 style="color: #fff; font-size: 40rpx; font-weight: bold; margin: 28rpx 0 14rpx 0;">$1</h1>');
      
      // 处理粗体
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffd700; font-weight: bold;">$1</strong>');
      
      // 处理斜体
      content = content.replace(/\*(.*?)\*/g, '<em style="color: #87ceeb; font-style: italic;">$1</em>');
      
      // 处理列表项
      content = content.replace(/^\d+\. (.*$)/gim, '<p style="color: #eee; margin: 8rpx 0; padding-left: 20rpx;">• $1</p>');
      content = content.replace(/^- (.*$)/gim, '<p style="color: #eee; margin: 8rpx 0; padding-left: 20rpx;">• $1</p>');
      
      // 处理换行
      content = content.replace(/\n/g, '<br/>');
      
      // 处理普通段落
      const lines = content.split('<br/>');
      const processedLines = lines.map(line => {
        line = line.trim();
        if (!line) return '<br/>';
        if (line.startsWith('<h') || line.startsWith('<p') || line.startsWith('<strong') || line.startsWith('<em')) {
          return line;
        }
        return `<p style="color: #eee; line-height: 1.6; margin: 8rpx 0;">${line}</p>`;
      });
      
      const finalContent = processedLines.join('');
      
      return finalContent;
    }
  }
}
</script>

<style lang="scss" scoped>
.summary-container {
  width: 100%;
  height: 100%;
  max-height: 600rpx;
  overflow: hidden;
}

.summary-scroll {
  width: 100%;
  height: 100%;
  max-height: 600rpx;
}

.summary-content {
  padding: 20rpx;
}

.summary-rich-text {
  width: 100%;
  word-wrap: break-word;
  word-break: break-all;
}
</style>