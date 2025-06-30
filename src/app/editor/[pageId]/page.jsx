// 文件: src/app/editor/[pageId]/page.jsx

'use client';

import { use } from 'react'; // 引入 use hook
import { useRouter } from 'next/navigation';
import EditorPage from '../../../components/EditorPage';

export default function Page({ params }) {
  const router = useRouter();
  // 使用 React.use 来安全地解包 params
  const resolvedParams = use(params); 
  const { pageId } = resolvedParams;

  const handleBackToHome = () => {
    router.push('/');
  };

  return <EditorPage pageId={pageId} onBack={handleBackToHome} />;
}