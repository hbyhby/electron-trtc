import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.UPDATE_SERVER_PORT || 5000;

// 基本配置
app.use(cors());

// 延迟下载中间件
const delayDownload = (req, res, next) => {
  if (!req.path.endsWith('.zip')) {
    return next();
  }

  const filePath = path.join(__dirname, '../release', req.path);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return next();
  }

  console.log(`Starting download for: ${filePath}`);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  let sentBytes = 0;

  // 设置响应头
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Content-Type', 'application/zip');

  // 创建文件读取流
  const readStream = fs.createReadStream(filePath, {
    highWaterMark: 1024 * 1024 // 1MB chunks
  });

  // 暂停流，手动控制数据发送
  readStream.pause();

  // 处理数据块
  readStream.on('data', (chunk) => {
    sentBytes += chunk.length;
    const progress = ((sentBytes / fileSize) * 100).toFixed(2);
    console.log(`Progress: ${progress}%`);
    
    // 写入数据
    res.write(chunk);
    
    // 暂停流
    readStream.pause();
    
    // 1秒后继续读取
    setTimeout(() => {
      readStream.resume();
    }, 1000);
  });

  // 处理流结束
  readStream.on('end', () => {
    console.log('Download completed');
    res.end();
  });

  // 处理错误
  readStream.on('error', (err) => {
    console.error('Stream error:', err);
    res.end();
  });

  // 处理连接关闭
  res.on('close', () => {
    console.log('Connection closed');
    readStream.destroy();
  });

  // 开始发送数据
  readStream.resume();
};

// 使用延迟下载中间件
app.use('/updates', delayDownload);

// 读取package.json获取真实版本号
const getAppVersion = () => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );
    return packageJson.version;
  } catch (err) {
    console.error('Error reading package.json:', err);
    return '0.0.0';
  }
}

// 获取更新件信息
const getUpdateFileInfo = () => {
  // 优先使用测试目录
  const testDir = path.join(__dirname, '../release/test');
  const releaseDir = path.join(__dirname, '../release');
  
  try {
    // 先检查测试目录
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      const zipFile = files.find(file => file.endsWith('.zip'));
      if (zipFile) {
        const filePath = path.join(testDir, zipFile);
        const stats = fs.statSync(filePath);
        return {
          fileName: `test/${zipFile}`,
          size: stats.size,
          sha512: 'test-sha512-hash'
        };
      }
    }
    
    // 如果测试目录没有文件，检查正式目录
    if (fs.existsSync(releaseDir)) {
      const files = fs.readdirSync(releaseDir);
      const zipFile = files.find(file => file.endsWith('.zip'));
      if (zipFile) {
        const filePath = path.join(releaseDir, zipFile);
        const stats = fs.statSync(filePath);
        return {
          fileName: zipFile,
          size: stats.size,
          // 实际使用时应该计算真实的sha512
          sha512: 'sha512-placeholder'
        };
      }
    }
  } catch (err) {
    console.error('Error getting update file info:', err);
  }
  return null;
}

// 更新检查接口
app.get('/updates/latest', (req, res) => {
  const fileInfo = getUpdateFileInfo();
  const version = getAppVersion();

  if (!fileInfo) {
    return res.status(404).json({ error: 'No update file available' });
  }

  console.log(`Serving update info for version ${version}`);

  res.json({
    version,
    files: [{
      url: `http://localhost:${port}/updates/${fileInfo.fileName}`,
      sha512: fileInfo.sha512,
      size: fileInfo.size
    }],
    path: fileInfo.fileName,
    sha512: fileInfo.sha512,
    releaseDate: new Date().toISOString()
  });
});

// 添加测试相关的路由
app.get('/updates/test/latest.json', (req, res) => {
  const testConfigPath = path.join(__dirname, '../release/test/latest.json');
  if (fs.existsSync(testConfigPath)) {
    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    res.json(config);
  } else {
    res.status(404).json({ error: 'Test update config not found' });
  }
});

// 添加各端 yml 文件的路由
app.get('/updates/latest-:platform.yml', (req, res) => {
  const platform = req.params.platform;
  const ymlPath = path.join(__dirname, `../release/test/latest-${platform}.yml`);
  if (fs.existsSync(ymlPath)) {
    res.sendFile(ymlPath);
  } else {
    res.status(404).json({ error: `YML file for platform ${platform} not found` });
  }
});

// 动服务器
app.listen(port, () => {
  console.log(`Update server running at http://localhost:${port}`);
  console.log(`Serving updates from: ${path.join(__dirname, '../release')}`);
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
