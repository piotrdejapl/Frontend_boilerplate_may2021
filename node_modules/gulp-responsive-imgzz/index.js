'use strict';

var through = require('through2');
var cheerio = require('cheerio');
var objectAssign = require('object-assign');

var reImageSrc = /^((?:(?:http|https):\/\/)?(?:.+))(\.(?:gif|png|jpg|jpeg|webp))$/;

var defaultOptions = {
	decodeEntities: false,
 	suffix: {
          '1x': '',
          '2x': '@2x',
          '3x': '@3x'
        }
}

var imageRetina = function(options){

	options = objectAssign({}, defaultOptions, options);

	return through.obj(function(file, enc, cb){
		if (file.isNull()){
			cb(null, file);
			return;
		}

		if (file.isStream()){
			cb(new gutil.PluginError('gulp-responsive-imgzzz', 'Streaming not supported'));
			return;
		}

		var content = file.contents.toString();

		var $ = cheerio.load( content, options );

		var imgList = $('img');

		imgList.each(function(item){
			var _this = $(this);
			var src = _this.attr('src');

			var tmpSrc = [];
			var match = src.match(reImageSrc);

			// not a valid src attribute
			if (match === null){
				return true;
			}

			for( var key in options.suffix ){
				tmpSrc.push( match[1]+options.suffix[key]+match[2]+' '+key );
			}

			_this.attr('srcset', tmpSrc.join(', '));
		});
		// console.log($.html());

		file.contents = new Buffer( $.html() );

		cb(null, file);
	});
}


module.exports = imageRetina;
