/**
 * 基于 Minimax 算法和 Alpha-Beta 剪枝的国际象棋 AI
 * 参考: https://gitlab.soraharu.com/XiaoXi/Minimax-with-Alpha-Beta-Pruning-Chess-AI
 */
import {
  getPieceColor,
  getPieceType,
  getValidMoves,
  isKingInCheck
} from './cheesLogic.js';

export const ChessAI = {
  // 棋子价值表
  pieceValues: {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000
  },

  // 棋子位置价值表
  positionValues: {
    pawn: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    knight: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    bishop: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 10, 10, 10, 10, 0, -10],
      [-10, 5, 5, 10, 10, 5, 5, -10],
      [-10, 0, 5, 10, 10, 5, 0, -10],
      [-10, 10, 10, 10, 10, 10, 10, -10],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    rook: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 10, 10, 10, 10, 10, 10, 5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [0, 0, 0, 5, 5, 0, 0, 0]
    ],
    queen: [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    king: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [20, 20, 0, 0, 0, 0, 20, 20],
      [20, 30, 10, 0, 0, 10, 30, 20]
    ],
    kingEndgame: [
      [-50, -40, -30, -20, -20, -30, -40, -50],
      [-30, -20, -10, 0, 0, -10, -20, -30],
      [-30, -10, 20, 30, 30, 20, -10, -30],
      [-30, -10, 30, 40, 40, 30, -10, -30],
      [-30, -10, 30, 40, 40, 30, -10, -30],
      [-30, -10, 20, 30, 30, 20, -10, -30],
      [-30, -30, 0, 0, 0, 0, -30, -30],
      [-50, -30, -30, -30, -30, -30, -30, -50]
    ]
  },

  // 难度级别设置
  difficultyLevels: {
    beginner: {
      depth: 2,
      randomFactor: 0.3,
      thinkTime: 1000
    },
    intermediate: {
      depth: 3,
      randomFactor: 0.15,
      thinkTime: 1500
    },
    advanced: {
      depth: 4,
      randomFactor: 0.05,
      thinkTime: 2000
    },
    master: {
      depth: 5,
      randomFactor: 0,
      thinkTime: 2500
    }
  },

  /**
   * 复制棋盘状态
   */
  copyBoard(board) {
    return JSON.parse(JSON.stringify(board));
  },

  /**
   * 模拟移动
   */
  makeMove(board, from, to) {
    const newBoard = this.copyBoard(board);
    const piece = newBoard[from.row][from.col];

    // 执行移动
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    return newBoard;
  },

  /**
   * 评估棋盘局面
   */
  evaluateBoard(board, color) {
    let score = 0;
    let material = 0;

    // 计算棋子总价值，用于判断是否是残局
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const pieceType = getPieceType(piece);
        const pieceValue = this.pieceValues[pieceType] || 0;
        material += pieceValue;
      }
    }

    const isEndgame = material < 3000; // 如果总棋子价值小于3000，认为是残局

    // 遍历棋盘评估每个棋子
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        const pieceValue = this.pieceValues[pieceType] || 0;

        // 根据棋子颜色加减分数
        const colorMultiplier = pieceColor === color ? 1 : -1;
        score += pieceValue * colorMultiplier;

        // 添加位置价值
        let positionTable = this.positionValues[pieceType];
        if (pieceType === 'king' && isEndgame) {
          positionTable = this.positionValues.kingEndgame;
        }

        if (positionTable) {
          // 根据棋子颜色调整行索引
          const row_index = pieceColor === 'white' ? 7 - row : row;
          score += positionTable[row_index][col] * colorMultiplier;
        }
      }
    }

    return score;
  },

  /**
   * Minimax 算法，带有 Alpha-Beta 剪枝
   */
  minimax(board, depth, alpha, beta, maximizingPlayer, color) {
    // 达到叶子节点，直接评估局面
    if (depth === 0) {
      return { value: this.evaluateBoard(board, color) };
    }

    // 获取所有可能的移动
    const possibleMoves = this.getAllMoves(board, maximizingPlayer ? color : (color === 'white' ? 'black' : 'white'));
    if (possibleMoves.length === 0) {
      // 无子可动，检查将军
      const kingColor = maximizingPlayer ? color : (color === 'white' ? 'black' : 'white');
      if (isKingInCheck(board, kingColor)) {
        return { value: maximizingPlayer ? -20000 : 20000 }; // 将杀
      } else {
        return { value: 0 }; // 和棋
      }
    }

    let bestMove = null;

    if (maximizingPlayer) {
      let maxEval = -Infinity;

      for (const move of possibleMoves) {
        const newBoard = this.makeMove(board, move.from, move.to);
        const evalResult = this.minimax(newBoard, depth - 1, alpha, beta, false, color);

        if (evalResult.value > maxEval) {
          maxEval = evalResult.value;
          bestMove = move;
        }

        alpha = Math.max(alpha, evalResult.value);
        if (beta <= alpha) break; // Alpha-Beta 剪枝
      }

      return { value: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;

      for (const move of possibleMoves) {
        const newBoard = this.makeMove(board, move.from, move.to);
        const evalResult = this.minimax(newBoard, depth - 1, alpha, beta, true, color);

        if (evalResult.value < minEval) {
          minEval = evalResult.value;
          bestMove = move;
        }

        beta = Math.min(beta, evalResult.value);
        if (beta <= alpha) break; // Alpha-Beta 剪枝
      }

      return { value: minEval, move: bestMove };
    }
  },

  /**
   * 获取指定颜色的所有可能移动
   */
  getAllMoves(board, color) {
    const moves = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && getPieceColor(piece) === color) {
          const validMoves = getValidMoves(board, row, col);

          validMoves.forEach(to => {
            moves.push({
              from: { row, col },
              to: to
            });
          });
        }
      }
    }

    return moves;
  },

  /**
   * 找到最佳移动
   */
  findBestMove(board, color, difficulty = 'intermediate') {
    // 获取难度设置
    const level = this.difficultyLevels[difficulty] || this.difficultyLevels.intermediate;

    // 使用 Minimax 算法找到最佳移动
    const result = this.minimax(board, level.depth, -Infinity, Infinity, true, color);

    // 如果有随机因素，可能偶尔选择次优移动
    if (level.randomFactor > 0 && Math.random() < level.randomFactor) {
      // 获取所有可能的移动
      const allMoves = this.getAllMoves(board, color);
      if (allMoves.length > 0) {
        // 随机选择一个移动
        return allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    }

    return result.move;
  }
}; 