module.exports = {
  apps: [{
    name: "next-app",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000",
    cwd: "C:/Users/georg/Documents/work/Saas-Products/nerdwork_plus/apps/web/nerdwork-plus",
    env: { NODE_ENV: "production" }
  }]
}
