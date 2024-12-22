import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const releaseDir = path.join(__dirname, '../release/test');

// 确保目录存在
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}
const testVersion = '1.0.1';
// 创建一个假的 zip 文件
const createTestZip = () => {
  const testFileName = `App-${testVersion}.zip`;
  const filePath = path.join(releaseDir, testFileName);
  
  // 创建一个1MB的测试文件
  const buffer = Buffer.alloc(1024 * 1024*10, 'test-content');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Created test ZIP file: ${filePath}`);
  return testFileName;
};

// 创建测试配置文件
const createTestConfig = (fileName) => {
  const config = {
    version: testVersion,
    files: [{
      url: `http://localhost:5000/updates/test/${fileName}`,
      sha512: 'test-sha512-hash',
      size: 1024 * 1024
    }],
    releaseDate: new Date().toISOString(),
    releaseNotes: '这是一个测试更新版本'
  };

  const configPath = path.join(releaseDir, 'latest.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Created test config: ${configPath}`);
};

// 创建各端的 yml 文件
const createYmlFiles = () => {
  const platforms = ['mac', 'win', 'linux'];
  platforms.forEach(platform => {
    const ymlContent = `
version: ${testVersion}
files:
  - url: http://localhost:5000/updates/test/App-${testVersion}.zip
    sha512: test-sha512-hash
    size: 1024 * 1024
path: /updates/test
releaseDate: ${new Date().toISOString()}
releaseNotes: 这是一个测试更新版本
`;
    const ymlPath = path.join(releaseDir, `latest-${platform}.yml`);
    fs.writeFileSync(ymlPath, ymlContent.trim());
    console.log(`Created ${platform} yml file: ${ymlPath}`);
  });
};

// 执行创建
const testFileName = createTestZip();
createTestConfig(testFileName);
createYmlFiles();
