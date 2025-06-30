// 文件: src/app/page.js

'use client'; // 告诉 Next.js 这是一个客户端组件

import { useRouter } from 'next/navigation';
import HomePage from '../components/HomePage'; // 引入你的主页组件

export default function Page() {
  const router = useRouter();

  // 定义一个导航函数，当 HomePage 组件需要跳转时调用
  const handleNavigate = (pageId) => {
    router.push(`/editor/${pageId}`); // 跳转到编辑器页面
  };

  return <HomePage onNavigateToPage={handleNavigate} />;
}

