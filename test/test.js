var fs = require('fs')
var path = require('path')
var webpack = require('webpack')
var expect = require('chai').expect
var rimraf = require('rimraf')
var hash = require('hash-sum')
var extract = require('extract-text-webpack-plugin')
var jsdom = require('jsdom')

describe('ng-component-loader', function(){
    
    var outputDir = path.resolve(__dirname, './output')
    var loaderPath = 'expose-loader?ngComponent!' + path.resolve(__dirname, '../index.js')
    var globalConfig = {
        entry: path.resolve(__dirname, './entry.js'),
            output: {
                filename: 'build.js',
                path: outputDir
            },
            module: {
                rules: [
                    {
                         test: /\.ng$/,
                         loader: loaderPath
                    }
                ]
            }
    }

    function getFile(file, callback){
        fs.readFile(path.resolve(outputDir, file), 'utf-8', function (err, data){
            expect(err).to.not.exist
            callback(data)
        })
    }

    function test(options, assert){
        
        var opt = Object.assign({}, globalConfig, options)

        var w = webpack(opt)

        w.run(function(err, stats){
            
            console.log(stats)


            if(stats.compilation.errors.length){
                stats.compilation.erros.forEach(function(err){
                    console.error(err.message)
                })
            }

            expect(stats.compilation.erros.length).to.be.empty

            getFile('build-test.js', function(data){
                jsdom.env({
                    html: testHtml, 
                    src: [data],
                    done: function (err, window){
                        if(err){
                            console.log(err[0].data.error.stack)

                            expect(err).to.be.null
                        }

                        assert(window)
                    }
                })
            })
            
        })
        
    }
    
    beforeEach(function(done){
        rimraf(outputDir, done)
    })

    it('Should return message', function (done){

        build({}, window => {
            var component = window.ngComponent.default[1]

            expect(component.controller().msg).to.be.eq('Working!!')

            done()
        })

    })

    it('Should return template', function (done){

        build({}, window => {
            var component = window.ngComponent.default[1]

            expect(component.template).to.contain('{{ msg }}')

            done()
        })

    })

    function build(options, assert)
    {

        var opt = Object.assign({}, globalConfig, options)

        const w = webpack(opt);

        w.run(function(err, stats){

            expect(err).to.be.null

            if (stats.compilation.errors.length) {
                stats.compilation.errors.forEach(function (err) {
                    console.error(err.message)
                })
            }

            expect(stats.compilation.errors.length).to.be.empty

            getFile('build.js', js => {

                jsdom.env({
                    html: `<!DOCTYPE html><html><head></head><body></body></html>`, 
                    src: [js],
                    done: function (err, window){
                        if(err){
                            console.log(err[0].data.error.stack)

                            expect(err).to.be.null
                        }

                        assert(window)
                    }
                })
                
            })

        })
    }
    
})
