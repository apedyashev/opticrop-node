fs     = require 'fs'

{print}         = require 'sys'
{exec, spawn}   = require 'child_process'

appFiles  = [
  # omit src/ and .coffee to make the below lines a little shorter
  'HelloWorld'
]

task 'build', 'Build single application file from source files', ->
  appContents = new Array remaining = appFiles.length
  for file, index in appFiles then do (file, index) ->
    fs.readFile "src/#{file}.coffee", 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index] = fileContents
      process() if --remaining is 0
  process = ->
    fs.writeFile 'app.coffee', appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      exec 'coffee --compile app.coffee', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        fs.unlink 'app.coffee', (err) ->
          throw err if err
          console.log 'Done.'
          
task 'watch', 'Watches all coffee fiels', ->
  coffee = spawn 'coffee', ['-w', '-b', '-c', '-o', "./", "./src"]
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()