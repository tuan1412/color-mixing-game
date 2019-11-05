$(function () {
  $('body').css('background-color', '#000');
  var FPS = 60;
  var T = TT = 0;
  var canvas = $('<canvas>');
  var c = canvas[0].getContext('2d');
  var W = _W = 360;
  var H = _H = 512;
  var score = 0;
  var dim = { w: $(window).width(), h: $(window).height() };
  $(canvas).attr({ 'width': W, 'height': H });
  _H = dim.h;
  _W = dim.h * W / H;
  if (W / H > dim.w / dim.h) {
    _W = dim.w;
    _H = dim.w * H / W;
  };
  $(canvas).css({ 'position': 'absolute', 'top': (dim.h - _H) / 2, 'left': (dim.w - _W) / 2, 'width': _W, 'height': _H });
  $('body').append(canvas);
  var camY = 0;
  var died = false;
  var dCircle = function (coords, radius, color) {
    c.beginPath();
    c.fillStyle = color;
    c.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    c.fill();
  };
  var coord = function (dx, dy) {
    return { x: dx, y: H + camY - dy };
  };
  var col = ['#F39', '#3FF', '#FF3', '#A0F'];
  var baseColor = ['#FF0000', '#0000FF', '#00FF00']; // red, blue, green
  var mixedColor = ['#00FFFF', '#FF00FF', '#FFFF00']; // cyan(green + blue), magenta(red+blue), yellow(red+green);
  var mixingColor = function (baseCol1, baseCol2) {
    if (baseCol1 === '#FF0000' && baseCol2 === '#0000FF'
      || baseCol1 === '#0000FF' && baseCol2 === '#FF0000') return '#FF00FF'; // red + blue
    if (baseCol1 === '#FF0000' && baseCol2 === '#00FF00'
      || baseCol1 === '#00FF00' && baseCol2 === '#FF0000') return '#FFFF00'; // red + green
    if (baseCol1 === '#00FF00' && baseCol2 === '#0000FF'
      || baseCol1 === '#0000FF' && baseCol2 === '#00FF00') return '#00FFFF'; // blue + green
  }
  var isBaseColor = function (color) {
    return color === '#FF0000' || color === '#0000FF' || color === '#00FF00';
  }
  var gCol2 = function (index, colors) {
    var n = index;
    colors = colors || baseColor;
    return colors[n % 3];
  };
  var gCol = function (index) {
    var n = index;
    return col[n % 4];
  };
  var rRange = function (x1, x2) {
    return x1 + Math.random() * (x2 - x1);
  };
  var choose = function () {
    return arguments[Math.floor(arguments.length * Math.random())];
  };
  var rCol2 = function () {
    return mixedColor[Math.floor(3 * Math.random())];
  };
  var rCol = function () {
    return col[Math.floor(4 * Math.random())];
  };
  var repeat = function (func, rep) {
    for (var _rep = 0; _rep < rep; _rep++) {
      func();
    };
  };
  var getDots = function (xy1, xy2) {
    return {
      d: Math.sqrt(Math.pow(xy1.x - xy2.x, 2) + Math.pow(xy1.y - xy2.y, 2)),
      a: Math.atan2(xy1.y - xy2.y, xy2.x - xy1.x)
    };
  };
  var die = function () {
    died = true;
    repeat(function () { newParticle(p.x, p.y + 5); }, 14);
    TT = 1;
  };
  var colIndex = Math.floor(4 * Math.random());
  var p = { x: W / 2, y: H / 6, r: 10, c: gCol2(colIndex), spd: 0, spdMax: 6, acc: 0 };

  var objects = [];
  var newObject = function (x, y, r, c, order, col) {
    var o = { x: x, y: y, r: r, c: c, t: 0, destroyed: false, order: order, col };
    o.move = function () { };
    o.draw = function () {
      dCircle(coord(o.x, o.y), o.r, o.c);
    };
    o.destroy = function () {
      o.destroyed = true;
    };
    o.update = function () {
      o.move();
      o.draw();
      if (o.y + 100 < camY) {
        o.destroy();
      };
      o.t++;
    };
    objects.push(o);
    return o;
  };
  var modAng = function (x) {
    var y = x;
    while (y < 0) {
      y += Math.PI * 2;
    };
    return y % (Math.PI * 2);
  };
  var obstacles = { n: 0, sep: 350 };
  var cspd = 1;
  var new8 = function (y, ang, dir, col) {
    var o8 = newObject(W / 2, 100 + obstacles.sep * y, 10, gCol2(col), y, col);
    o8.cx = o8.x;
    o8.cy = o8.y;
    o8.rad8 = 80;
    o8.d = dir;
    o8.a = ang;
    o8.move = function () {
      with (o8) {
        x = cx + 1.5 * rad8 * Math.cos(a);
        y = cy + 0.7 * rad8 * Math.sin(2 * a);
        a += d * 0.02;
      };
      if (!died && p.c != o8.c && getDots(coord(p.x, p.y), coord(o8.x, o8.y)).d < p.r + o8.r) {
        if (isBaseColor(p.c)) {
          var mixedColor =  mixingColor(p.c, o8.c);
          p.c = mixedColor;
          var colorObject = o8.c;
          for (var object of objects) {
            if (object.order == y && object.c == colorObject) {
              object.c = mixedColor;
            }
          }
          with (p) {
            dCircle(coord(x, y), r, c);
          }
        } else {
          die();
        }
      };
    };
  };
  var newW8 = function (y) {
    var ddir = choose(-1, 1);
    for (var i = 0; i < Math.PI * 2; i += Math.PI * 2 / 18) {
      new8(y, i, ddir, Math.floor(6 * (i / (Math.PI * 2))));
    };
  };
  var flag = false;
  var newC1 = function (y, rad, ospd, dir) {
    var distance = y === 1 ? 60 + obstacles.sep * y : 100 + obstacles.sep * y;
    var c1 = newObject(W / 2, distance, rad, Math.floor(3 * Math.random()));
    c1.angle = Math.PI * 2 * Math.floor(4 * Math.random());
    c1.spd = dir * cspd * ospd;
    c1.w = c1.r * 15 / 100; // do day chuong ngai vat
    c1.colors = [...baseColor]; // ko clone se bi tnay doi baseColor
    c1.order = y;
    c1.draw = function () {
      let co = coord(c1.x, c1.y);
      c.lineWidth = c1.w;
      for (var j = 0; j < 3; j++) {
        c.beginPath();
        let indexColor = j + c1.c;
        let colorArc = gCol2(indexColor, c1.colors);
        if (c1.order)
          c.strokeStyle = colorArc; // set mau lan luot tu mau da chon
        var a = modAng(c1.angle + Math.PI * 2 * j / 3); // goc bat dau
        // console.log(c1.angle / Math.PI)
        var a2 = modAng(a + Math.PI * 2 / 3); // cong them 90 (360/4)
        if (colorArc != p.c && !died) { // neu mau cua cung khac mau player va chua die
          // check xem player mau gi

          var dots = getDots(co, coord(p.x, p.y));
          if (dots.d + p.r > c1.r - c1.w / 2 && dots.d - p.r < c1.r + c1.w / 2) { // nam giua khoang vien
            var pa = modAng(-dots.a);
            if (pa >= a && pa <= a2) { // pa luc nay la pi / 2
              if (isBaseColor(p.c)) {
                // var mixedColor = mi
                p.c = mixingColor(p.c, colorArc);
                c.strokeStyle = p.c;
                colorArc = p.c;
                c1.colors[indexColor % 3] = p.c;
                with (p) {
                  dCircle(coord(x, y), r, c);
                }
              } else {
                die();
              }
            };
          };
        };

        c.arc(co.x, co.y, c1.r, a, a2);
        c.stroke();
      };
      c1.angle += c1.spd * Math.PI / 180;
    };
  };
  var newParticle = function (x, y) {
    var part = newObject(x, y, 5, rCol());
    part.g = 0.6;
    part.hspd = rRange(-10, 10);
    part.vspd = rRange(10, 20);
    part.move = function () {
      with (part) {
        vspd -= g;
        x += hspd;
        y += vspd;
        if (x < 0 || x > W) {
          hspd *= -1;
        };
        if (y < camY) {
          part.destroy();
        };
      };
    };
  };

  var getColorStar = function (starColor, type) {
    var fullColors = ['#FF0000', '#0000FF', '#00FF00', '#00FFFF', '#FF00FF', '#FFFF00'];
    var redBaseColors = ['#FF0000', '#FF00FF', '#FFFF00'];
    var blueBaseColors = ['#0000FF', '#00FFFF', '#FF00FF'];
    var greenBaseColors = ['#00FF00', '#00FFFF', '#FFFF00'];
    if (type == 1) return starColor;
    if (!starColor) return fullColors[Math.floor(Math.random() * 6)];
    if (starColor == '#FF0000') return redBaseColors[Math.floor(Math.random() * 3)];
    if (starColor == '#0000FF') return blueBaseColors[Math.floor(Math.random() * 3)];
    if (starColor == '#00FF00') return greenBaseColors[Math.floor(Math.random() * 3)];
  }

  var flag = false;
  var dfixStar = function (x, y, r1, ang, col) {
    c.fillStyle = col;
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.globalAlpha = 1;
    c.beginPath();
    for (var j = 0; j <= 5; j++) {
      var a1 = j * Math.PI * 2 / 5 - Math.PI / 2 - ang;
      var a2 = a1 + Math.PI / 5;
      var r2 = r1 * 0.5;
      c.lineTo(x + r1 * Math.cos(a1), y + r1 * Math.sin(a1));
      c.lineTo(x + r2 * Math.cos(a2), y + r2 * Math.sin(a2));
    };
    c.stroke();
  }
  var target = { x: W - 20, y: 20, r: 10, c: '#FFF' };

  var newStar = function (n, type) {
    var color = getColorStar(p.c, type);
    var st = newObject(W / 2, 100 + obstacles.sep * n + obstacles.sep / 2, 15, color);
    if (target.c === '#FFF') {
      target.c = color;
      with (target) {
        dfixStar(x, y, r, 0, c);
      }
    }

    st.score = choose(1, 1, 1, 1, 1, 1, 10);
    st.a = 0;
    st.rs = st.r;
    st.move = function () {
      if (flag) {
        st.c = getColorStar(p.c, type);
        target.c = JSON.parse(JSON.stringify(st.c));
        flag = false;
      }
      if (getDots({ x: p.x, y: p.y }, { x: st.x, y: st.y }).d < st.r) {
        if (p.c !== st.c) {
          die();
          st.destroy();
        } else {
          score += st.score;

          p.c = baseColor[Math.floor(Math.random() * 3)];
          flag = true;
          with (target) {
            dfixStar(x, y, r, 0, c);
          }

          with (p) {
            dCircle(coord(x, y), r, c);
          }
          st.destroy();
        }

      };
      st.r = st.rs + 1.2 * Math.sin((st.a++) / 180 * Math.PI * 4);
    };
    st.draw = function () {
      dStar(st.x, st.y, st.r, 0, st.c, 1, st.score == 1);
    };
  };
  var dStar = function (x, y, r1, ang, col, alpha, outline) {
    var co = coord(x, y);
    c.fillStyle = col;
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.globalAlpha = alpha;
    c.beginPath();
    for (var j = 0; j <= 5; j++) {
      var a1 = j * Math.PI * 2 / 5 - Math.PI / 2 - ang;
      var a2 = a1 + Math.PI / 5;
      var r2 = r1 * 0.5;
      c.lineTo(co.x + r1 * Math.cos(a1), co.y + r1 * Math.sin(a1));
      c.lineTo(co.x + r2 * Math.cos(a2), co.y + r2 * Math.sin(a2));
    };
    if (outline) {
      c.fill();
    } else {
      c.stroke();
    };
    c.globalAlpha = 1;
  };

  p.yy = p.y;
  var clicked = false;
  $(canvas).click(function () { clicked = true; });
  setInterval(function () {
    // fill mau den man hinh
    c.fillStyle = '#222';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#FFF';

    // draw diem o ben goc tren trai
    c.font = '30px Arial';
    c.textAlign = 'left';
    c.fillText(score, 10, 30);
    c.font = '50px Arial';
    c.textAlign = 'center';
    // fill chu color switch
    c.fillText('COLOR', W / 2, coord(0, 250).y);
    c.fillText('MIXING', W / 2, coord(0, 200).y);
    with (target) {
      dfixStar(x, y, r, 0, c);
    }

    while (obstacles.n < 2 + Math.floor(camY / obstacles.sep)) {
      obstacles.n += 1;
      var type = choose(0, 0, 0, 0, 1, 2, 2, 2)

      switch (type) {
        case 0:
          newC1(obstacles.n, choose(100, 100, 70), 1, choose(-1, 1));
          break;
        case 1:
          newC1(obstacles.n, 100, 2 / 3, 1);
          newC1(obstacles.n, 70, 1, -1);
          break;
        case 2:
          newW8(obstacles.n);
          break;
      };
      // newSwitch(obstacles.n);
      newStar(obstacles.n, type);

      cspd *= 1.04;
    };

    if (!died) {
      if (clicked) {
        p.spd = p.spdMax;
        if (p.acc == 0) {
          p.spd *= 1.2;
          p.acc = -0.3;
        };
      };
      with (p) {
        spd = Math.max(spd + acc, -spdMax);
        y = Math.max(y + spd, yy);
        if (y < camY) {
          die();
        };
        dCircle(coord(x, y), r, c);
      };
    };
    for (var i in objects) {
      objects[i].update();
    };
    for (var i = objects.length - 1; i >= 0; i--) {
      if (objects[i].destroyed) {
        objects.splice(i, 1);
      };
    };
    camY = Math.max(camY, p.y - 250);
    T += TT;
    if (T > 70) {
      c.globalAlpha = 0.7;
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
      c.fillStyle = '#000';
      c.strokeStyle = '#EEE';
      c.lineWidth = 2;
      c.fillText('TAP TO', W / 2, H / 2);
      c.strokeText('TAP TO', W / 2, H / 2);
      c.fillText('RESTART', W / 2, H / 2 + 50);
      c.strokeText('RESTART', W / 2, H / 2 + 50);
      if (clicked) {
        score = 0;
        T = 0;
        TT = 0;
        camY = 0;
        cspd = 1;
        died = false;
        p.y = H * 1 / 4;
        p.acc = 0;
        p.spd = 0;
        p.c = gCol2(Math.floor(Math.random() * 3))
        objects = [];
        obstacles.n = 0;
      };
    };
    clicked = false;
  }, 1000 / FPS);
});