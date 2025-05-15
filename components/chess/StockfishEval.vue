<template>
  <view class="stockfish-eval-container" :class="{ 'bar-only': !showDetails }">
    <view v-if="!isLoading && evaluation" class="eval-content">
      <view class="eval-bar-vertical" :style="{ height: dynamicHeight ? dynamicHeight : '150rpx' }">
        <view class="eval-fill" :style="{ height: evaluationHeightPercentage + '%' }"></view>
        <text v-if="evaluation" class="eval-score-text">{{ formattedScore }}</text>
      </view>
      <view v-if="showDetails" class="eval-details">
        <text class="engine-name">Stockfish {{ stockfishVersion }}</text>
        <text class="depth-info">Depth: {{ evaluation.depth }}</text>
        <text v-if="evaluation.bestMove" class="best-move-info">Best: {{ evaluation.bestMove }}</text>
      </view>
    </view>
    <view v-if="isLoading && showDetails" class="loading-text">
      Stockfish Analyzing...
    </view>
    <view v-if="!isLoading && error && showDetails" class="error-text">
      {{ error }}
    </view>
    <view v-if="isLoading && !showDetails" class="loading-bar-indicator" :style="{ height: dynamicHeight ? dynamicHeight : '150rpx' }"></view>
  </view>
</template>

<script>
export default {
  name: 'StockfishEval',
  props: {
    evaluation: { // 从父组件传入的评估对象: { score, depth, bestMove, isMate, mateInMoves, rawOutput }
      type: Object,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
    stockfishVersion: { // 可以是后端返回或者固定值
      type: String,
      default: '16' // 假设版本号
    },
    showDetails: {
      type: Boolean,
      default: true,
    },
    dynamicHeight: { // + 新增：动态高度 prop
      type: String,
      default: null, // 例如 '600px'
    }
  },
  computed: {
    processedScoreCp() {
      if (!this.evaluation || typeof this.evaluation.score !== 'number') return 0;
      // 假设API直接返回以"兵"为单位的分数，例如 -0.34。
      // 我们将其转换为厘兵 (centipawns) 进行内部处理和显示。
      return Math.round(this.evaluation.score * 100);
    },
    formattedScore() {
      if (!this.evaluation) return 'N/A';
      if (this.evaluation.isMate) {
        // const prefix = this.evaluation.score > 0 ? '+' : '-'; // isMate 时 score 的正负号通常也指示哪方将杀
        const matePrefix = this.processedScoreCp > 0 ? '+' : '-'; // Use processedScoreCp for consistency if API score also reflects mate side
        return `M${Math.abs(this.evaluation.mateInMoves)}`;
      }
      // 使用转换后的厘兵进行格式化
      const scoreToShow = this.processedScoreCp / 100; 
      return (scoreToShow > 0 ? '+' : '') + scoreToShow.toFixed(2);
    },
    evaluationHeightPercentage() {
      if (!this.evaluation) return 50;

      if (this.evaluation.isMate) {
        // 使用转换后的厘兵判断哪方将杀
        return this.processedScoreCp > 0 ? 100 : 0;
      }
      
      const scoreCp = this.processedScoreCp; // 使用转换后的厘兵
      const maxDisplayScoreCp = 800; // 将最大显示范围调整为800厘兵 (即 +/- 8兵)
                                    // 您可以根据需要调整这个值
      
      let percentage = 50 + (scoreCp / maxDisplayScoreCp) * 50;
      return Math.min(Math.max(percentage, 0), 100);
    },
  },
};
</script>

<style lang="scss" scoped>
.stockfish-eval-container {
  display: flex;
  align-items: center;
  min-height: 80rpx;
  font-family: Arial, sans-serif;
  color: #fff;

  &.bar-only {
    min-height: initial;
  }
}

.eval-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.eval-bar-vertical {
  width: 28rpx;
  background-color: #333;
  border-radius: 4rpx;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  border: 1px solid #555;

  .stockfish-eval-container.bar-only & {
    margin-right: 0;
  }

  .eval-fill {
    width: 100%;
    background-color: #e0e0e0;
    transition: height 0.3s ease-out;
  }
  
  .eval-score-text {
    position: absolute;
    top: 5rpx;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16rpx;
    color: #000;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 1rpx 4rpx;
    border-radius: 3rpx;
    white-space: nowrap;
    line-height: 1.2;
    z-index: 1;
  }
}

.eval-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 22rpx;
  color: #ccc;
  padding-left: 15rpx;

  .engine-name {
    font-weight: bold;
    color: #fff;
    font-size: 26rpx;
    margin-bottom: 5rpx;
  }
  .depth-info, .best-move-info {
    margin-bottom: 3rpx;
  }
}

.loading-text, .error-text {
  font-size: 24rpx;
  color: #aaa;
  padding-left: 15rpx;
}
.error-text {
  color: #e74c3c;
}

.loading-bar-indicator {
    width: 28rpx;
    background-color: rgba(128, 128, 128, 0.3);
    border-radius: 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &:after {
        content: 'L';
        font-size: 18rpx;
        color: #fff;
        animation: spin 1s linear infinite;
    }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 