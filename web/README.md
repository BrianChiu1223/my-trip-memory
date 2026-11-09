# 途屿 Web

应用位于本目录。安装、启动、功能和限制见[项目 README](../README.md)，完整设计见[技术方案](../docs/TECHNICAL_PLAN.md)。

建议从仓库根目录运行 `npm run setup`、`npm run dev`、`npm run check`，启动脚本会选择兼容的 Node.js。

本地 Demo 使用 IndexedDB；`.openai/hosting.json` 没有项目 ID，也没有云数据库或照片桶绑定。Vinext / Sites 模板中的认证和连接器文件只是保留的基础设施，不代表应用已具备真实登录或私有云能力。
