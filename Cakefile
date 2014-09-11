fs     = require 'fs'

{print}         = require 'sys'
{exec, spawn}   = require 'child_process'

appFiles  = [
  # omit src/ and .coffee to make the below lines a little shorter
  'HelloWorld'
]

task 'watch', 'Watches all coffee fiels', ->
  coffee = spawn 'coffee', ['-w', '-b', '-c', '-o', "./", "./coffee"]
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()