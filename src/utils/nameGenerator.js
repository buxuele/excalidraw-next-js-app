// 文件: src/utils/nameGenerator.js

const ADJECTIVES = [
  '快乐的', '勇敢的', '聪明的', '好奇的', '闪亮的', '宁静的',
  '巨大的', '微小的', '神秘的', '迅速的', '温暖的', '冷静的',
  '活泼的', '温柔的', '狡猾的', '迷人的', '大胆的', '优雅的',
  '奇幻的', '坚韧的', '耀眼的', '灵动的', '沉稳的', '俏皮的'
];

const NOUNS = [
  '西瓜', '老虎', '月亮', '河流', '森林', '代码', '火箭',
  '城堡', '钥匙', '旅程', '梦想', '回声', '故事', '鲸鱼',
  '彩虹', '灯塔', '云朵', '山峰', '星辰', '书本', '风筝',
  '海洋', '火花', '村庄', '秘密', '微风', '宇宙'
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateRandomName = () => {
  // 1. 获取当前日期
  const today = new Date();
  
  // 2. 格式化为 YYYY-MM-DD
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以+1
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // 3. 构造新名称
  const adjective = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  
  return `${dateStr}-${adjective}${noun}`;
};