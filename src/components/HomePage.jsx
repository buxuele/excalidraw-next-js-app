// 文件: src/components/HomePage.jsx

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import pako from 'pako';

import { db } from '../db';
import { generateRandomName } from '../utils/nameGenerator';

const ProjectThumbnail = dynamic(
  () => import('./ProjectThumbnail'),
  { ssr: false, loading: () => <div style={{ color: '#aaa' }}>加载缩略图...</div> }
);

const ContextMenu = ({ x, y, page, onRename, onDelete, onDuplicate, onShare, onClose }) => {
    useEffect(() => {
        const handleClickOutside = () => onClose();
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [onClose]);

    return (
        <div className="context-menu" style={{ top: y, left: x }}>
            <button className="context-menu-item" onClick={() => { onRename(page); onClose(); }}>重命名</button>
            <button className="context-menu-item" onClick={() => { onDuplicate(page.id); onClose(); }}>创建副本</button>
            <button className="context-menu-item" onClick={() => { onShare(page); onClose(); }}>分享</button>
            <button className="context-menu-item delete" onClick={() => { onClose(); onDelete(page.id); }}>删除页面</button>
        </div>
    );
};

const ProjectCard = ({ page, ...props }) => {
    return (
        <div className="project-card" onContextMenu={(e) => props.onContextMenu(e, page)}>
            <div className="card-thumbnail" onClick={() => props.onSelect(page.id)}>
                <ProjectThumbnail pageData={page} />
            </div>
            <div className="card-info">
                {props.renamingPageId === page.id ? (
                    <input
                        type="text"
                        className="rename-input-card"
                        value={props.renameInputValue}
                        onChange={(e) => props.setRenameInputValue(e.target.value)}
                        onBlur={() => props.onRenameSubmit()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') props.onRenameSubmit();
                            else if (e.key === 'Escape') props.onRenameSubmit(true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span className="page-name" onClick={() => props.onSelect(page.id)}>{page.name}</span>
                )}
            </div>
        </div>
    );
};


function HomePageContent({ onNavigateToPage }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, page: null });
  const [renamingPageId, setRenamingPageId] = useState(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const searchParams = useSearchParams();

  const loadPages = async () => {
    setIsLoading(true);
    try {
      let dbPages = await db.getAllPages();
      dbPages.sort((a, b) => b.id.localeCompare(a.id));
      setPages(dbPages);
    } catch (error) {
      console.error("加载页面列表失败:", error);
      alert("加载作品列表时出错，请检查浏览器控制台获取详细信息。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSharedDrawing = async (encodedData) => {
    setIsLoading(true);
    try {
      const compressed = atob(decodeURIComponent(encodedData));
      const jsonString = pako.inflate(compressed, { to: 'string' });
      const drawingData = JSON.parse(jsonString);

      const newPage = {
        id: `page-${Date.now()}`,
        name: `来自分享的-${generateRandomName()}`,
        data: drawingData,
      };

      await db.upsertPage(newPage);
      alert("已成功导入分享的绘图！即将跳转到编辑器。");
      
      window.history.replaceState({}, '', '/'); 
      
      onNavigateToPage(newPage.id);
    } catch (error) {
      console.error("导入分享的绘图失败:", error);
      alert("导入分享的绘图失败，链接可能已损坏。");
      await loadPages();
    }
  };

  useEffect(() => {
    const sharedData = searchParams.get('drawing');
    if (sharedData) {
      handleImportSharedDrawing(sharedData);
    } else {
      loadPages();
    }
  }, []);

  const handleAddNewPage = async () => {
    const newPage = { id: `page-${Date.now()}`, name: generateRandomName(), data: [] };
    await db.upsertPage(newPage);
    onNavigateToPage(newPage.id);
  };

  // [需求二 修复] 使用乐观 UI 更新来修复删除 bug
  const handleDeletePage = async (pageId) => {
    if (window.confirm("确定要永久删除这个作品吗？此操作无法撤销。")) {
      // 1. 乐观 UI 更新：立即从当前 state 中移除页面
      setPages(currentPages => currentPages.filter(p => p.id !== pageId));

      // 2. 在后台执行真正的删除操作
      try {
        await db.deletePage(pageId);
        // 删除成功，万事大吉，什么都不用做。
      } catch (error) {
        // 3. 如果删除失败，给出提示并重新加载数据以恢复
        console.error("删除页面失败:", error);
        alert("删除失败，作品已恢复。请稍后重试。");
        loadPages(); // 从数据库重新加载，恢复被错误移除的卡片
      }
    }
  };
  
  const handleContextMenu = (e, page) => {
    e.preventDefault();
    e.stopPropagation();
    setRenamingPageId(null);
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, page: page });
  };
  
  const startRename = (page) => {
    setRenamingPageId(page.id);
    setRenameInputValue(page.name);
  };
  
  const handleRenameSubmit = async (isCancel = false) => {
    if (!renamingPageId) return;
    if (!isCancel) {
      const finalName = renameInputValue.trim() || "未命名草稿";
      const pageToUpdate = pages.find(p => p.id === renamingPageId);
      if (pageToUpdate && pageToUpdate.name !== finalName) {
        const updatedPage = { ...pageToUpdate, name: finalName };
        await db.upsertPage(updatedPage);
        setPages(pages.map(p => p.id === renamingPageId ? updatedPage : p));
      }
    }
    setRenamingPageId(null);
  };

  const handleDuplicatePage = async (pageId) => {
    const originalPage = await db.getPageById(pageId);
    if (!originalPage) return;
    const newPage = { id: `page-${Date.now()}`, name: `${originalPage.name} (副本)`, data: originalPage.data, thumbnail: originalPage.thumbnail };
    await db.upsertPage(newPage);
    await loadPages();
  };

  const handleSharePage = async (page) => {
    if (!page.data || page.data.length === 0) {
      alert("这是一个空的画板，无法分享。");
      return;
    }
    try {
      const jsonString = JSON.stringify(page.data);
      const compressed = pako.deflate(jsonString, { to: 'string' });
      const encodedData = btoa(compressed);
      const url = `${window.location.origin}/?drawing=${encodeURIComponent(encodedData)}`;
      await navigator.clipboard.writeText(url);
      alert("分享链接已复制到剪贴板！");
    } catch (error) {
      console.error("生成分享链接失败:", error);
      alert("生成分享链接失败，请查看控制台。");
    }
  };

  if (isLoading) return <div style={{padding: '4rem', textAlign: 'center', fontSize: '1.2rem', color: '#666'}}>正在加载作品集...</div>;

  return (
    <div className="home-page-container">
      <h1>我的作品集</h1>
      {pages.length === 0 && !isLoading && (
        <div style={{textAlign: 'center', padding: '4rem', color: '#888'}}>
          <p>还没有任何作品。</p>
          <p>点击“+”号，开始你的第一次创作吧！</p>
        </div>
      )}
      <div className="projects-grid">
        <div className="project-card new-project-card" onClick={handleAddNewPage}>
          <div className="plus-icon">+</div>
        </div>
        {pages.map(page => (
          <ProjectCard key={page.id} page={page} onSelect={onNavigateToPage} onContextMenu={handleContextMenu} onRenameSubmit={handleRenameSubmit} renamingPageId={renamingPageId} setRenameInputValue={setRenameInputValue} renameInputValue={renameInputValue} />
        ))}
      </div>
      {contextMenu.visible && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} page={contextMenu.page} onRename={startRename} onDelete={handleDeletePage} onDuplicate={handleDuplicatePage} onShare={handleSharePage} onClose={() => setContextMenu({ ...contextMenu, visible: false })} />
      )}
    </div>
  );
}

export default function HomePage(props) {
  return (
    <Suspense fallback={<div style={{padding: '4rem', textAlign: 'center', fontSize: '1.2rem', color: '#666'}}>正在加载...</div>}>
      <HomePageContent {...props} />
    </Suspense>
  );
}