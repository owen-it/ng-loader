var utils = require('loader-utils')
var path = require('path')
var parse = require('./parser')
var selector = require.resolve('./selector')
var u = require('./utils')
var hash = require('hash-sum')

var rewriterInjectRE = /\b((css|(ng-)?html)(-loader)?(\?[^!]+)?)(?:!|$)/
var rewrites = {
    template: require.resolve('./template-rewrite'),
    style: require.resolve('./style-rewrite')
}

module.exports = function (content) {

    this.cacheable()

    var defaultLoaders = {
        html: 'html-loader',
        css: 'style-loader!css-loader',
        js: 'babel-loader?' + JSON.stringify({
            presets: ['es2015'],
            plugins: ['transform-runtime'],
            comments: false
        })
    }

    var defaultLang = {
        template: 'html',
        style: 'css',
        script: 'js'
    }

    var context = this
    var query = utils.getOptions(this) || {}
    var options = Object.assign({}, this.options.ng, this.ng, query)
    var filePath = this.resourcePath
    var fileName = path.basename(filePath)
    var moduleId = '_ng-' + hash(filePath)

    if (this.options.babel) {
        defaultLoaders.js = 'babel-loader'
    }

    if (this.sourceMap && !this.minimize &&
        options.cssSourceMap != false && process.env.NODE_ENV !== 'production') {
        defaultLoaders.css = 'style-loader!css-loader?sourceMap'
    }

    var loaders = Object.assign({}, defaultLoaders, options.loaders)

    var parts = parse(content, fileName, this.sourceMap)
    var hasLocalStyle = false
    var output = `
        var __comp_script__;
        var __comp_template__;
        var __comp_styles__;
    `
    function getRewrite(type, scoped) {
        var meta = '?id=' + moduleId
        switch (type) {
            case 'template':
                return scoped ? `${rewrites.template}${meta}!` : ''
            case 'style':
                return rewrites.style + (scoped ? `${meta}&scoped=true` : '!')
            default:
                return ''
        }
    }

    function addCssModulesToLoader(loader, part, index) {

        if (!part.module) return loader

        return loader.replace(/((?:^|!)css(?:-loader)?)(\?[^!]*)?/, function (m, $1, $2) {
            var option = utils.getOptions($2) || {}

            option.module = true
            option.importLoaders = true
            option.localIdentName = '[hash:base64]'

            if (index !== -1) {
                option.localIdentName += `_${index}`
            }

            return `${$1}?${JSON.stringify(option)}`
        })
    }

    function getLoaderString(type, part, index, scoped) {
        var lang = part.lang || defaultLang[type]
        var loader = loaders[lang]
        var rewrite = getRewrite(type, scoped)
        var injectString = (type === 'script' && query.inject) ? 'inject' : ''
        var templateLoader = require.resolve('./template-loader')

        if (loader != undefined) {
            if (Array.isArray(loader)) {
                loader = u.stringifyLoaders(loader)
            }

            if (type == 'style') {
                loader = addCssModulesToLoader(loader, part, index)
            }

            if (rewriterInjectRE.test(loader)) {
                loader = loader.replace(rewriterInjectRE, (m, $1) => {
                    return u.ensureBand($1) + rewrite
                })
            } else {
                loader = u.ensureBand(loader) + rewrite
            }

            return injectString + u.ensureBand(loader)

        } else {
            switch (type) {
                case 'template':
                    return `${defaultLoaders.html}!${rewrite + templateLoader}?raw&engine=${lang}!`
                case 'style':
                    loader = addCssModulesToLoader(defaultLoaders.css, part, index)
                    return `${loader}!${rewrite + lang}!`
                case 'script':
                    return `${injectString + lang}!`
            }
        }
    }

    function getRequireForImportString(type, req, scoped) {
        return utils.stringifyRequest(
            context, `!!${getLoaderString(type, req, -1, scoped)}${req.src}`
        )
    }

    function getRequireForImport(type, req, scoped) {
        return `require(${getRequireForImportString(type, req, scoped)})`
    }

    var cssModules = {}
    function setCssModule(style, require) {
        if (!style.module) return require
        if (style.module in cssModules) {
            context.emitError(`CSS module name ${style.module} is not unique!`)
            return require
        }

        cssModules[style.module] = true
        return `__comp_styles__["${style.module}"] = require;`
    }

    function getRequire(type, part, index, scoped) {
        return `require(${getRequireString(type, part, index, scoped)})`
    }

    function getSelectorString(type, index) {
        return `${selector}?type=${type}&index=${index}!`
    }

    function getRequireString(type, part, index, scoped) {
        return utils.stringifyRequest(context, [
            '!!', getLoaderString(type, part, index, scoped),
            getSelectorString(type, index || 0),
            utils.getRemainingRequest(context)
        ].join(''))
    }

    parts.styleImports.forEach(function (part) {
        if (part.scoped) hasLocalStyle = true
        if (part.module === '') part.module = '$style'

        var requireString = getRequireForImport(
            'style', part, part.scoped
        )

        output += setCssModule(part, requireString)
    })

    parts.style.forEach(function (style, i) {
        if (style.scoped) hasLocalStyle = true
        if (style.module === '') style.module = '$style'

        var requireString = getRequire(
            'style', style, i, style.scoped, style.module
        )

        output += setCssModule(style, requireString)
    })

    var script
    if (parts.script.length) {
        script = parts.script[0]

        output += `
            __comp_script__ = ${
                script.src
                ? getRequireForImport('string', script, 0)
                : getRequire('script', script, 0)
        }
        `

        if (!this.minimize) {
            output += `
                var invalidModule = Object.keys(__comp_script__).some(function(key) {
                    return key !== 'default' && key !== '__esModule';
                });
                if(invalidModule){
                    console.error("[ng-component-loader] Named exports are not supported in *.ng files.");
                }
            `
        }
    }

    var template
    if (parts.template.length) {
        template = parts.template[0]

        output += `
            __comp_template__ = ${
                template.src
                ? getRequireForImport('template', template, hasLocalStyle)
                : getRequire('template', template, 0, hasLocalStyle)
        }
        `
    }

    var hotId = JSON.stringify(`${moduleId}/${fileName}`)
    var srcFile = JSON.stringify(path.relative(process.cwd(), filePath));
    output += `
        __comp_script__ = __comp_script__ || {};
        if(__comp_script__.__esModule) __comp_script__ = __comp_script__.default;
        __comp_script__.__file = ${srcFile};
        __comp_script__.__id = ${hotId};
        if(__comp_template__){
            if(Array.isArray(__comp_script__)) __comp_script__[1].template = __comp_template__;
            else __comp_script__.template = __comp_template__;
        }
        module.exports.__esModule = true;
        module.exports.default = __comp_script__; `

    if (query.hijacked) {
        output += `
            const angular = require('angular');
            const api = require('ng-hot-reload-api');

            api.install(angular);
            
            if(module.hot) {

                if (!api.compatible) {
                    throw new Error('ng-hot-reload-api is not compatible with the version of AngularJs you are using.')
                }

                module.hot.accept(function(e){
                    console.error('[NGC] Error in compilation file. ', e);
                });

                if(!module.hot.data){
                    // register
                    api.register(${hotId}, __comp_script__);
                } else {
                    // update
                    api.reload(${hotId}, __comp_script__);
                }
            }
        `
    }

    return output;
}
