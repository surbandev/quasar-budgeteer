#!/usr/bin/env node
/**
 * Cross-platform Railway deploy launcher for VS Code / Cursor "Deploy".
 * Windows: opens a detached console so the IDE debugger does not hang after upload.
 * Linux/macOS: runs deploy in the current terminal.
 */
const { spawn } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const isWin = process.platform === 'win32'

if (isWin) {
  spawn(
    'cmd.exe',
    [
      '/c',
      'npm run deploy & echo. & echo Deploy upload finished. Check Railway for build status. & pause',
    ],
    {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    },
  ).unref()
  process.exit(0)
}

const child = spawn('npm', ['run', 'deploy'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  if (code === 0) {
    console.log('\nDeploy upload finished. Check Railway for build status.')
  }
  process.exit(code ?? 1)
})
