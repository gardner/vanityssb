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

function shortenLargeNumber(num, digits) {
  digits = (digits) ? digits : 0

  var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
    decimal;

  for(var i=units.length-1; i>=0; i--) {
    decimal = Math.pow(1000, i+1);

    if(num <= -decimal || num >= decimal) {
      return +(num / decimal).toFixed(digits) + units[i];
    }
  }

  return num;
}

function parseSecs(secs) {
  var seconds = parseInt(secs, 10);
  var days = Math.floor(seconds / (3600*24));
  seconds  -= days*3600*24;
  var hrs   = Math.floor(seconds / 3600);
  seconds  -= hrs*3600;
  var mnts = Math.floor(seconds / 60);
  seconds  -= mnts*60;
  return days+"d, "+hrs+"h, "+mnts+"m, "+seconds+"s";
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
  process.stdout.write('tick[' + shortenLargeNumber(ticks, 1) + ']: avg[' + Math.round(totalkps / (ticks - 1)) + '] ~ kps[' + Math.round(kps) + "] - runtime[" + parseSecs(sec) + '] / tested[' + shortenLargeNumber(tested,2) + ']')
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
