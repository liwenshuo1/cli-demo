#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { parseArgs } from 'node:util'
import prompts from 'prompts'

import { fileURLToPath } from 'node:url'

import { writeFile } from 'node:fs'
import ejs from 'ejs'
import spawn from 'cross-spawn'
import gradient from 'gradient-string'

const bannerText = 'xxx前端项目构建'
const gradientBannerText = gradient([
  { color: '#37b383', pos: 0 },
  { color: '#D03333', pos: 1 }
])('xxx前端项目构建')
const cwd = process.cwd()
const args = process.argv.slice(2)
let targetDir = args[0]
const commondDir = path.resolve(__dirname, './')

async function init() {
  if (args.includes('hteacherInit')) {
    let hteacherRes = await prompts([
      {
        type: 'toggle',
        name: 'needPrettier',
        message: '是否需要格式化配置？',
        initial: true,
        active: 'yes',
        inactive: 'no'
      },
      {
        type: 'toggle',
        name: 'needSvg',
        message: '是否需要配置svg使用·？',
        initial: true,
        active: 'yes',
        inactive: 'no'
      },
      {
        type: 'toggle',
        name: 'needStyle',
        message: '是否需要格式化页面样式？',
        initial: true,
        active: 'yes',
        inactive: 'no'
      },
      {
        type: 'toggle',
        name: 'needRemOrVw',
        message: '是否需要移动端适配？',
        initial: true,
        active: 'yes',
        inactive: 'no'
      }
    ])

    const { needPrettier, needSvg, needStyle, needRemOrVw } = hteacherRes
    if (needPrettier) {
      copyFileWithReplace(`${commondDir}/template/.prettierrc.json`, `${cwd}/${targetDir}/.prettierrc.json`)
      copyFileWithReplace(`${commondDir}/template/.prettierignore`, `${cwd}/${targetDir}/.prettierignore`)
    }
    if (needSvg) {
      copyFileWithReplace(`${commondDir}/template/vite.config.js`, `${cwd}/${targetDir}/vite.config.js`)
      copyFileWithReplace(
        `${commondDir}/template/svg/patches/vite-plugin-svg-icons+2.0.1.patch`,
        `${cwd}/${targetDir}/patches/vite-plugin-svg-icons+2.0.1.patch`
      )
      copyFileWithReplace(
        `${commondDir}/template/svg/SvgIcon.vue`,
        `${cwd}/${targetDir}/src/components/SvgIcon/SvgIcon.vue`
      )
      copyFileWithReplace(`${commondDir}/template/svg/demo.svg`, `${cwd}/${targetDir}/src/assets/icons/demo.svg`)
      fs.mkdirSync('doNotRemoveAttrs', { recursive: true })
    }
    if (needStyle) {
      copyFolderRecursiveSync(`${commondDir}/template/styles`, `${cwd}/${targetDir}/src/styles`)
    }

    if (needRemOrVw) {
    }
    process.exit()
    return
  }

  console.log(process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? gradientBannerText : bannerText)

  const defaultProjectName = !targetDir ? 'hteacher-project' : targetDir

  const FrameworkSelect = [
    {
      title: 'Vue',
      customCommand: `npm create vue@latest TARGET_DIR`
    },
    { title: 'React' }
  ]

  let res = await prompts([
    {
      name: 'projectName',
      type: targetDir ? null : 'text',
      message: '请输入项目名称',
      initial: defaultProjectName,
      onState: (state) => {
        targetDir = state.value || defaultProjectName
        console.log('state', state)
        console.log('targetDir', targetDir)
      }
    },
    {
      name: 'projectType',
      type: 'select',
      message: '选择你需要用到的框架',
      choices: FrameworkSelect,
      initial: 0
    }
  ])

  console.log(res.projectType)
  const FrameworkItem = FrameworkSelect[res.projectType]
  let nextArgs
  if (FrameworkItem.title === 'Vue') {
    nextArgs = FrameworkItem.customCommand.replace('TARGET_DIR', targetDir).split(' ')
  }

  const { status } = spawn.sync('npm', nextArgs.splice(1), {
    stdio: 'inherit'
  })

  process.on('exit', async (code) => {
    console.log('create-vue执行完毕')
    spawn.sync('npm', ['create', 'hteacher', targetDir, 'hteacherInit'], {
      stdio: 'inherit'
    })
  })

  process.exit(status ?? 0)
}

init()

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function copyFileWithReplace(sourcePath, destinationPath) {
  // 确保目标文件夹存在，不存在则创建
  const destinationFolder = path.dirname(destinationPath)
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true })
  }

  // 复制文件并替换目标文件（如果存在）
  try {
    fs.copyFileSync(sourcePath, destinationPath)
    console.log(`文件复制成功：${sourcePath} -> ${destinationPath}`)
  } catch (err) {
    if (err.code === 'EEXIST') {
      // 目标文件已存在，删除目标文件并重试
      fs.unlinkSync(destinationPath)
      fs.copyFileSync(sourcePath, destinationPath)
      console.log(`目标文件已替换：${sourcePath} -> ${destinationPath}`)
    } else {
      console.error(`文件复制失败：${sourcePath} -> ${destinationPath}`, err)
    }
  }
}

// 复制文件夹
function copyFolderRecursiveSync(sourceDir, targetDir) {
  // 确保目标文件夹存在，不存在则创建
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // 获取源文件夹中的所有文件和子文件夹
  const files = fs.readdirSync(sourceDir)

  // 逐个处理文件和子文件夹
  files.forEach((file) => {
    const sourceFile = path.join(sourceDir, file)
    const targetFile = path.join(targetDir, file)

    // 如果是文件夹，则递归复制文件夹；如果是文件，则直接复制文件
    if (fs.lstatSync(sourceFile).isDirectory()) {
      copyFolderRecursiveSync(sourceFile, targetFile)
    } else {
      try {
        fs.copyFileSync(sourceFile, targetFile)
        console.log(`文件复制成功：${sourceFile} -> ${targetFile}`)
      } catch (err) {
        console.error(`文件复制失败：${sourceFile} -> ${targetFile}`, err)
      }
    }
  })
}
