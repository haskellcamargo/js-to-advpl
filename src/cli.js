#!/usr/bin/env node
import fs from 'fs'
import yargs from 'yargs'
import Future from 'fluture'
import { head } from 'ramda'
import { parse } from 'babylon'
import { red } from 'colors/safe'
import compileToAdvPL from './generator'

const emitError = error => error.stack | red | console.log

const readFile = file => Future.node(fs.readFile(file, 'utf-8', _))

function cli(args) {
    const { _: [input] } = args
    const ast = readFile(input)
        .chain(Future.encase(parse(_, { sourceType: 'module' })))
        .chain(Future.encase(compileToAdvPL))
    return ast
        .fork(emitError, compileToAdvPL)
}

cli(yargs
    .usage('Usage: $0 index.js')
    .option('output', {
        describe: 'Output file',
        alias: 'o',
        type: 'string'
    })
    .strict()
    .demandCommand(1)
    .help()
    .version()
    .argv)
