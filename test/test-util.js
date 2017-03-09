var expect = require('chai').expect
var utils = require('./../src/utils')

describe('test util', function(){

    it('stringfiy loader', function (done){
        
        var loader = utils.stringifyLoaders([
            {loader: 'css-loader', options: {'source-map': true}},
            {loader: 'raw-loader'}
        ])

        expect(loader).to.be.eq('css-loader?{"source-map":true}!raw-loader')

        done()
    })

    it('ensure band', function(done){

        var value = utils.ensureBand('module');

        expect(value).to.be.eq('module!')

        done()

    })
    
})
