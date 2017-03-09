var path  = require('path')
var parse = require('./parser')
var utils = require('loader-utils')

module.exports = function(content)
{
    this.cacheable()
    var query = utils.getOptions(this) || {}
    var filename = path.basename(this.resourcePath)
    var parts = parse(content, filename, this.sourceMap)
    var part = parts[query.type][query.index]

    this.callback(null, part.content, part.map)
}
