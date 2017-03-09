// stringify loaders
exports.stringifyLoaders = function (loaders)
{
    return loaders.map(obj => {
        return obj && typeof obj === 'object' && typeof obj.loader === 'string'
        ? obj.loader + (obj.options ? '?' + JSON.stringify(obj.options) : '') : obj
    }).join('!')
}

// ensure band
exports.ensureBand = function(value){
    if(value.charAt(value.length -1) !== '!'){
        return value + '!'
    }

    return value
}
