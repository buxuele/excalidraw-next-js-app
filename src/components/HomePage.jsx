// 文件: src/components/HomePage.jsx

import React, { useState, useEffect, Suspense } from 'react'; // 新增 Suspense
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import pako from 'pako';

import { db } from '../db';
import { generateRandomName } from '../utils/nameGenerator';

const ProjectThumbnail = dynamic(
  () => import('./ProjectThumbnail'),
  { ssr: false, loading: () => <div style={{ color: '#aaa' }}>加载缩略图...</div> }
);

// ... ContextMenu 和 ProjectCard 组件保持不变 ...
const ContextMenu = ({ x, y, page, onRename, onDelete, onDuplicate, onShare, onClose }) => { /* ...代码保持不变... */  useEffect(() => { const handleClickOutside = () => onClose(); document.addEventListener('click', handleClickOutside); return () => document.removeEventListener('click', handleClickOutside); }, [onClose]); return ( <div className="context-menu" style={{ top: y, left: x }}> <button className="context-menu-item" onClick={() => { onRename(page); onClose(); }}>重命名</button> <button className="context-menu-item" onClick={() => { onDuplicate(page.id); onClose(); }}>创建副本</button> <button className="context-menu-item" onClick={() => { onShare(page); onClose(); }}>分享</button> <button className="context-menu-item delete" onClick={() => { onDelete(page.id); onClose(); }}>删除页面</button> </div> ); };
const ProjectCard = ({ page, ...props }) => { /* ...代码保持不变... */ return ( <div className="project-card" onContextMenu={(e) => props.onContextMenu(e, page)}> <div className="card-thumbnail" onClick={() => props.onSelect(page.id)}> <ProjectThumbnail pageData={page} /> </div> <div className="card-info"> {props.renamingPageId === page.id ? ( <input type="text" className="rename-input-card" value={props.renameInputValue} onChange={(e) => props.setRenameInputValue(e.target.value)} onBlur={() => props.onRenameSubmit()} onKeyDown={(e) => { if (e.key === 'Enter') props.onRenameSubmit(); else if (e.key === 'Escape') props.onRenameSubmit(true); }} onClick={(e) => e.stopPropagation()} autoFocus /> ) : ( <span className="page-name" onClick={() => props.onSelect(page.id)}>{page.name}</span> )} </div> </div> ); };


// 这是我们需要包裹起来的实际组件内容
function HomePageContent({ onNavigateToPage }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, page: null });
  const [renamingPageId, setRenamingPageId] = useState(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const searchParams = useSearchParams();

  // --- 关键修复：将异步逻辑包裹在 try...catch...finally 中 ---
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
      setIsLoading(false); // 无论成功还是失败，都必须关闭加载状态
    }
  };

  const handleImportSharedDrawing = async (encodedData) => {
    setIsLoading(true); // 开始导入时，也显示加载状态
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
      
      // 清理 URL, 防止刷新页面时再次导入
      window.history.replaceState({}, '', '/'); 
      
      onNavigateToPage(newPage.id);
    } catch (error) {
      console.error("导入分享的绘图失败:", error);
      alert("导入分享的绘图失败，链接可能已损坏。");
      await loadPages(); // 即使导入失败，也要加载正常列表
    }
    // 注意：如果成功导入并跳转，这个 setIsLoading(false) 可能不会执行，因为组件卸载了
    // 但如果导入失败，则必须执行。所以我们把它放在 loadPages 的 finally 里处理。
  };

  useEffect(() => {
    const sharedData = searchParams.get('drawing');
    if (sharedData) {
      handleImportSharedDrawing(sharedData);
    } else {
      loadPages();
    }
  }, []); // searchParams 在 App Router 中是稳定的，所以空数组是OK的

  // ... 其他所有 handle 函数保持不变 ...
  const handleAddNewPage = async () => { const newPage = { id: `page-${Date.now()}`, name: generateRandomName(), data: [] }; await db.upsertPage(newPage); onNavigateToPage(newPage.id); }; const handleDeletePage = async (pageId) => { if (window.confirm("确定要删除吗？")) { await db.deletePage(pageId); loadPages(); } }; const handleContextMenu = (e, page) => { e.preventDefault(); e.stopPropagation(); setRenamingPageId(null); setContextMenu({ visible: true, x: e.pageX, y: e.pageY, page: page }); }; const startRename = (page) => { setRenamingPageId(page.id); setRenameInputValue(page.name); }; const handleRenameSubmit = async (isCancel = false) => { if (!renamingPageId) return; if (!isCancel) { const finalName = renameInputValue.trim() || "未命名草稿"; const pageToUpdate = pages.find(p => p.id === renamingPageId); if (pageToUpdate && pageToUpdate.name !== finalName) { const updatedPage = { ...pageToUpdate, name: finalName }; await db.upsertPage(updatedPage); setPages(pages.map(p => p.id === renamingPageId ? updatedPage : p)); } } setRenamingPageId(null); };
  const handleDuplicatePage = async (pageId) => { const originalPage = await db.getPageById(pageId); if (!originalPage) return; const newPage = { id: `page-${Date.now()}`, name: `${originalPage.name} (副本)`, data: originalPage.data, thumbnail: originalPage.thumbnail }; await db.upsertPage(newPage); await loadPages(); }; const handleSharePage = async (page) => { if (!page.data || page.data.length === 0) { alert("这是一个空的画板，无法分享。"); return; } try { const jsonString = JSON.stringify(page.data); const compressed = pako.deflate(jsonString, { to: 'string' }); const encodedData = btoa(compressed); const url = `${window.location.origin}/?drawing=${encodeURIComponent(encodedData)}`; await navigator.clipboard.writeText(url); alert("分享链接已复制到剪贴板！"); } catch (error) { console.error("生成分享链接失败:", error); alert("生成分享链接失败，请查看控制台。"); } };

  if (isLoading) return <div style={{padding: '4rem', textAlign: 'center', fontSize: '1.2rem', color: '#666'}}>正在加载作品集...</div>;

  return (
    <div className="home-page-container">
      <h1>我的作品集</h1>
      {/* 可以在这里加一个空状态的判断 */}
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

// Next.js 13+ App Router 中，使用 useSearchParams 的组件需要被 Suspense 包裹
export default function HomePage(props) {
  return (
    <Suspense fallback={<div style={{padding: '4rem', textAlign: 'center', fontSize: '1.2rem', color: '#666'}}>正在加载...</div>}>
      <HomePageContent {...props} />
    </Suspense>
  );
}