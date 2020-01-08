var fs = require('fs');

var gd = require('../js/node-gd.js');
var assert = require('chai').assert;

var source = __dirname + '/fixtures/';
var target = __dirname + '/output/';

before(function() {
  // declare version
  console.log('Built on top of GD version: ' + gd.getGDVersion() + '\n\n');

  // clear test/output directory
  return fs.readdir(target, function(err, files) {
    return files.forEach(function(file, idx) {
      if (file.substr(0, 6) === 'output') {
        return fs.unlink(target + file, function(err) {
          if (err) {
            throw err;
          }
        });
      }
    });
  });
});

describe('Node.js GD Graphics Library', function() {

  describe('Version information', function() {
    it('will return a version number of format x.y.z - gd.getGDVersion()', function(done) {
      var version = gd.getGDVersion();
      assert.ok(/[0-9]\.[0-9]\.[0-9]+/.test(version));
      return done();
    });

    it('will have built in GIF support', function() {
      assert.equal(gd.GD_GIF, 1, 'No GIF support for libgd is impossible!');
    });

    it('will have built in GIF animation support', function() {
      assert.equal(gd.GD_GIFANIM, 1, 'No GIF animation support for libgd is impossible!');
    });

    it('will have built in open polygon support', function() {
      assert.equal(gd.GD_OPENPOLYGON, 1, 'No open polygon support for libgd is impossible!');
    });

  });

  describe('GD color functions', function() {
    // it('', function(done) {});

    it('can return an integer representation of rgb color values', function(done) {
      var red = gd.trueColor(255, 0, 0);
      assert.ok(16711680 === red);
      return done();
    });

    it('can return an integer representation of rgba color values', function(done) {
      var transparentRed = gd.trueColorAlpha(255, 0, 0, 63);
      assert.ok(1073676288 === transparentRed);
      return done();
    });
  });

  describe('From the gd.Image query functions,', function() {
    it('getBoundsSafe should return 0 if the coordinate [-10, 1000] is checked against the image bounds.', async function() {
      var s = source + 'input.png';
      var coord = [-10, 1000];
      const image = await gd.openPng(s);

      assert.ok(image.getBoundsSafe(coord[0], coord[1]) === 0);
      image.destroy();
    });

    it('getBoundsSafe should return 1 if the coordinate [10, 10] is checked against the image bounds.', async function() {
      var s = source + 'input.png';
      var coord = [10, 10];
      const image = await gd.openPng(s);

      assert.ok(image.getBoundsSafe(coord[0], coord[1]) === 1);
      image.destroy();
    });

    it('getTrueColorPixel should return "e6e6e6" when queried for coordinate [10, 10].', async function() {
      var s = source + 'input.png';
      var coord = [10, 10];
      const image = await gd.openPng(s);
      var color;
      color = image.getTrueColorPixel(coord[0], coord[1]);

      assert.ok(color.toString(16) === 'e6e6e6');
    });

    it('getTrueColorPixel should return 0 when queried for coordinate [101, 101].', async function() {
      var s = source + 'input.png';
      var coord = [101, 101];
      const image = await gd.openPng(s);
      var color;
      color = image.getTrueColorPixel(coord[0], coord[1]);

      assert.ok(color === 0);
    });

    it('imageColorAt should return "be392e" when queried for coordinate [50, 50].', async function() {
      var s = source + 'input.png';
      var coord = [50, 50];
      const image = await gd.openPng(s);
      var color;
      color = image.imageColorAt(coord[0], coord[1]);

      assert.ok(color.toString(16) === 'be392e');;
    });

    it('imageColorAt should throw an error when queried for coordinate [101, 101].', async function() {
      const s = source + 'input.png';
      const coord = [101, 101];
      const image = await gd.openPng(s);
      let color;
      try {
        color = image.imageColorAt(coord[0], coord[1]);
      } catch (exception) {
        assert.ok(exception instanceof Error);
      }
    });
  });

  it('can scale-down (resize) an image', async () => {
    var s, t;
    s = source + 'input.png';
    t = target + 'output-scale.png';
    const img = await gd.openPng(s);
    var canvas, h, scale, w;

    scale = 2;
    w = Math.floor(img.width / scale);
    h = Math.floor(img.height / scale);
    canvas = await gd.createTrueColor(w, h);
    img.copyResampled(canvas, 0, 0, 0, 0, w, h, img.width, img.height);

    await canvas.savePng(t, 1);
    assert.ok(fs.existsSync(t));
    img.destroy();
    canvas.destroy();
  });


  it('can rotate an image', async function() {
    var s, t;
    s = source + 'input.png';
    t = target + 'output-rotate.png';
    const img = await gd.openPng(s);
    var canvas, h, w;

    w = 100;
    h = 100;
    canvas = await gd.createTrueColor(w, h);
    img.copyRotated(canvas, 50, 50, 0, 0, img.width, img.height, 45);
    await canvas.savePng(t, 1);
    assert.ok(fs.existsSync(t));
    img.destroy();
    canvas.destroy();
  });

  it('can convert to grayscale', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-grayscale.png';
    const img = await gd.openPng(s);
    img.grayscale();
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can add gaussian blur to an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-gaussianblur.png';
    const img = await gd.openPng(s);
    var i, j;
    for (i = j = 0; j < 10; i = ++j) {
      img.gaussianBlur();
    }

    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can negate an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-negate.png';
    const img = await gd.openPng(s);

    img.negate();
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can change brightness of an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-brightness.png';
    const img = await gd.openPng(s);

    const brightness = Math.floor(Math.random() * 100);
    img.brightness(brightness);
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can change contrast of an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-contrast.png';
    const img = await gd.openPng(s);
    const contrast = Math.floor(Math.random() * 2000) - 900;
    img.contrast(contrast);
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can emboss an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-emboss.png';
    const img = await gd.openPng(s);
    img.emboss();
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can apply selective blur to an image', async function() {
    var s, t;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    s = source + 'input.png';
    t = target + 'output-selectiveBlur.png';
    const img = await gd.openPng(s);

    img.selectiveBlur();
    await img.savePng(t, -1);
    assert.ok(fs.existsSync(t));
    img.destroy();
  });

  it('can replace a color to another color', async function() {
    var img, s, t;
    s = source + 'input.png';
    t = target + 'output-replaced.png';
    const image = await gd.openPng(s);

    var colors = [
      image.getTrueColorPixel(10,10),
      image.getTrueColorPixel(10,11),
      image.getTrueColorPixel(10,12),
      image.getTrueColorPixel(10,13),
      image.getTrueColorPixel(10,14),
      image.getTrueColorPixel(10,15)
    ];
    var colorTo = gd.trueColor(0,255,255);

    for (var i = 0; i < colors.length; i++) {
      image.colorReplace(colors[i], colorTo);
    }

    await image.savePng(t, 0);

    assert.ok(fs.existsSync(t));
    image.destroy();
  });

  it('can create a truecolor BMP image with text', async function() {
    var f, img, t, txtColor;
    if (gd.getGDVersion() < '2.1.1') {
      return this.skip();
    }
    f = source + 'FreeSans.ttf';
    t = target + 'output-truecolor-string.bmp';
    img = await gd.createTrueColor(120, 20);
    txtColor = img.colorAllocate(255, 255, 0);
    img.stringFT(txtColor, f, 16, 0, 8, 18, "Hello world!");
    await img.saveBmp(t, 0);
    assert.ok(fs.existsSync(t));
  });

  it('can create a truecolor Tiff image with text', async function() {
    var f, img, t, txtColor;
    if (gd.getGDVersion() < '2.2.4' || !gd.GD_TIFF) {
      return this.skip();
    }
    f = source + 'FreeSans.ttf';
    t = target + 'output-truecolor-string.tif';
    img = await gd.createTrueColor(120, 20);
    txtColor = img.colorAllocate(255, 255, 0);
    img.stringFT(txtColor, f, 16, 0, 8, 18, "Hello world!");
    await img.saveTiff(t);
    assert.ok(fs.existsSync(t));
  });
});
