// 文件: src/components/EditorPage.jsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import debounce from 'lodash.debounce';

import { db } from '../db';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { 
    ssr: false,
    loading: () => <div style={{height: '100%', display: 'grid', placeContent: 'center'}}>加载编辑器...</div>
  }
);

// --- 关键修复：把这个组件定义加回来！ ---
const BackToHomeButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      top: '12px',
      left: '80px',
      zIndex: 100,
      background: 'rgba(240, 240, 240, 0.9)',
      border: '1px solid #ccc',
      padding: '8px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}
  >
    ← 返回主页
  </button>
);
// --- 修复结束 ---

function EditorPage({ pageId, onBack }) {
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      if (!pageId) return;
      setIsLoading(true);
      const pageData = await db.getPageById(pageId);
      setPage(pageData);
      setIsLoading(false);
    };
    loadPageData();
  }, [pageId]);

  const handleDrawingChange = useCallback(
    debounce(async (elements) => {
      const currentPage = await db.getPageById(pageId);
      if (currentPage) {
        // [需求一 修复] 在更新数据时，将 thumbnail 设为 null
        // 这样就能强制主页重新生成缩略图
        const updatedPage = { ...currentPage, data: elements, thumbnail: null };
        await db.upsertPage(updatedPage);
      }
    }, 500),
    [pageId]
  );
  
  const handleBack = () => {
    if (handleDrawingChange.flush) {
      handleDrawingChange.flush();
    }
    onBack();
  };

  if (isLoading) return <div>正在加载绘图...</div>;
  if (!page) return <div>错误：找不到页面数据。</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <BackToHomeButton onClick={handleBack} />
      <div style={{height: '100%'}}> 
        <Excalidraw
          key={page.id}
          initialData={{ elements: page.data }}
          onChange={handleDrawingChange}
        />
      </div>
    </div>
  );
}

export default EditorPage;