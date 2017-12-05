#!/usr/bin/env node

const cluster = require('cluster')
const numCPUs = require('os').cpus().length
const fs = require('fs')
const util = require('util')
const ssbkeys = require('ssb-keys')
var readline = require('readline')
var tested = 0
var start = new Date()
var moniker = (process.argv[2]) ? process.argv[2] : process.env.USER
var ticks = 0
var totalkps = 0
var avgkps = 0

if (fs.existsSync('./done.txt')) {
  console.log('---------\n\nWARNING: done.txt exists')
  console.log('\n---------\n\nThere are already results in this directory\n\n')
  console.log('to destroy previous results and start over please run: rm done.txt key*\n')
  process.exit()
}

var outputProgress = function () {
  var now = new Date()
  var sec = ((now.getTime() - start.getTime()) / 1000)
  var kps = tested / sec
  ticks++
  if (kps != Infinity) {
    totalkps += kps
    if (totalkps == Infinity) {
      totalkps = kps
    }
  }
  // average kps since beginning of time
  process.stdout.clearLine()
  readline.cursorTo(process.stdout, 0)
  process.stdout.write('tick[' + ticks + ']: avg[' + Math.round(totalkps / (ticks - 1)) + '] ~ kps[' + Math.round(kps) + '] = secs[' + Math.round(sec) + '] / tested[' + tested / 1000 + 'k]')
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`)
  console.log(`Finding vanity public key for ${moniker}`)

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    var worker = cluster.fork()
    worker.on('message', function (cnt) {
      tested += cnt
    })
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    process.exit()
  })
  setInterval(outputProgress, 3000)
} else {
  process.stdout.write(`worker ${process.pid}... `)

  for (;;) {
    var keys = ssbkeys.generate()
    if (keys.public.toLowerCase().lastIndexOf(moniker, 0) === 0) {
      console.log(keys)
      fs.writeFileSync('./keys' + tested, util.inspect(keys))
      fs.writeFileSync('./done.txt', util.inspect(keys))
      process.exit()
    } else {
      tested++
      if ((tested % 10000) == 0) {
        process.send(tested)
        tested = 0
        if (fs.existsSync('./done.txt')) {
          console.log('done.txt exists, existing')
          process.exit()
        }
      }
    }
  }
}
