// 文件: src/components/ProjectThumbnail.jsx

import React, { useState, useEffect } from 'react';
import { exportToBlob } from '@excalidraw/excalidraw'; // 这个导入现在是安全的，因为该组件只在客户端加载
import { db } from '../db';

const ProjectThumbnail = ({ pageData }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (pageData.thumbnail) {
      setThumbnail(pageData.thumbnail);
      return;
    }
    if (!pageData.data || pageData.data.length === 0 || isGenerating) {
      return;
    }

    const generate = async () => {
      setIsGenerating(true);
      try {
        const blob = await exportToBlob({
          elements: pageData.data,
          appState: { exportBackground: true, viewBackgroundColor: '#ffffff' },
          files: null, mimeType: 'image/png', quality: 0.5, width: 280, height: 180,
        });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          db.upsertPage({ ...pageData, thumbnail: base64data });
          setThumbnail(base64data);
          setIsGenerating(false);
        };
        reader.readAsDataURL(blob);

      } catch (error) {
        console.error("生成缩略图失败:", error);
        setIsGenerating(false);
      }
    };

    generate();
  }, [pageData, isGenerating]);

  if (thumbnail) {
    return <img src={thumbnail} alt={pageData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return <div style={{ color: '#aaa' }}>{isGenerating ? '生成中...' : '没有绘图'}</div>;
};

export default ProjectThumbnail;