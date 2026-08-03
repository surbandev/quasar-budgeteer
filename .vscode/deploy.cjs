#!/usr/bin/env node
/**
 * Cross-platform Railway deploy launcher for VS Code / Cursor "Deploy".
 * Windows: opens a detached console so the IDE debugger does not hang after upload.
 * Linux/macOS: runs deploy in the current terminal.
 */
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const projectRoot = path.resolve(__dirname, '..')
const isWin = process.platform === 'win32'

function railwayBinDir() {
  return path.join(os.homedir(), '.railway', 'bin')
}

function withRailwayPath(env) {
  const bin = railwayBinDir()
  const sep = isWin ? ';' : ':'
  const current = env.PATH || env.Path || ''
  if (!fs.existsSync(bin)) {
    return env
  }
  return {
    ...env,
    PATH: `${bin}${sep}${current}`,
  }
}

function runDeployInTerminal() {
  const env = withRailwayPath(process.env)
  const npmCmd = isWin ? 'npm.cmd' : 'npm'
  const child = spawn(npmCmd, ['run', 'deploy'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    if (code === 0) {
      console.log('\nDeploy upload finished. Check Railway for build status.')
    } else {
      console.error(
        '\nDeploy failed. Ensure Railway CLI is installed (`curl -fsSL https://railway.com/install.sh | sh`) and you are logged in (`railway login`).',
      )
    }
    process.exit(code ?? 1)
  })
}

if (isWin) {
  const env = withRailwayPath(process.env)
  const pathEnv = env.PATH || env.Path || ''
  spawn(
    'cmd.exe',
    [
      '/c',
      `set "PATH=${pathEnv}" && npm run deploy & echo. & echo Deploy upload finished. Check Railway for build status. & pause`,
    ],
    {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      env,
    },
  ).unref()
  process.exit(0)
}

runDeployInTerminal()
