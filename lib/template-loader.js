var consolidate = require('consolidate')
var utils = require('loader-utils')
var path = require('path')

module.exports = function(content)
{
    this.cacheable()
    var callback = this.async()
    var options = utils.getOptions(this)
    var ngOptions = this.options.ng 

    if(ngOptions && ngOptions.template){
        for(var key in ngOptions.template){
            options[key] = ngOptions.template[key]
        }
    }

    if(!options.engine){
        options.engine = path.extname(this.request).substr(1).toLowerCase()
    }

    if(!consolidate[options.engine]){
        return callback(new Error(
            `Template engine ${options.engine} isn't avaliable in Consolidate.js`
        ))
    }

    options.filename = this.resourcePath

    function exportContent(content)
    {
        var output = `module.exports = ${JSON.stringify(content)}`

        options.raw ? callback(null, content) : callback(null, output)
    }

    function render(err, html)
    {
        err ? callback(err) : exportContent(html)
    }

    consolidate[options.engine].render(content, options, render)
}
