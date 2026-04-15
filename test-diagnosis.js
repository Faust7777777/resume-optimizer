const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // 访问诊断页面
  await page.goto('http://localhost:3000/diagnosis');
  await page.waitForTimeout(1000);

  // 截图初始状态
  await page.screenshot({ path: 'C:/Users/15892/Desktop/resume-optimizer/screenshot_initial.png', fullPage: false });

  // 创建一个测试文件并上传
  const buffer = Buffer.from('test resume content');
  await page.setInputFiles('input[type="file"]', {
    name: 'test_resume.pdf',
    mimeType: 'application/pdf',
    buffer: buffer
  });

  await page.waitForTimeout(500);

  // 点击开始诊断按钮
  await page.click('button:has-text("开始诊断")');

  // 等待分析完成（2秒模拟 + 额外时间）
  await page.waitForTimeout(3500);

  // 截图结果页面
  await page.screenshot({ path: 'C:/Users/15892/Desktop/resume-optimizer/screenshot_result.png', fullPage: true });

  await browser.close();
  console.log('Screenshots captured!');
})();
