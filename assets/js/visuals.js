(function () {
  "use strict";
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var vertex = "attribute vec2 aPosition; void main(){gl_Position=vec4(aPosition,0.,1.);}";
  var noise = `
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5; for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return v;}
  `;
  function renderer(id, fragment, frame) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var gl = canvas.getContext("webgl", {alpha:true, antialias:false, powerPreference:"low-power"});
    if (!gl) return null;
    var program = gl.createProgram();
    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("Visual shader unavailable", gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
      gl.attachShader(program,s); return s;
    }
    var vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program); gl.deleteShader(vs); gl.deleteShader(fs);
    var buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var pos=gl.getAttribLocation(program,"aPosition"); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    var locs={};
    function uniform(name){return locs[name] || (locs[name]=gl.getUniformLocation(program,name));}
    var raf=0, visible=true, last=0, elapsed=0, lost=false;
    function resize(){var r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,innerWidth<760?1:1.5);
      var w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
    function draw(now){raf=0;if(lost||!visible||document.hidden)return;
      var dt=last?Math.min((now-last)/1000,.05):1/60;last=now;elapsed+=dt;
      if(canvas.getClientRects().length===0)return;
      resize();gl.useProgram(program);
      gl.uniform2f(uniform("uRes"),canvas.width,canvas.height);
      gl.uniform1f(uniform("uTime"),motion.matches?2.5:elapsed);
      frame(gl,uniform,motion.matches?1:dt);
      gl.drawArrays(gl.TRIANGLES,0,3);canvas.classList.add("is-ready");
      if(!motion.matches)raf=requestAnimationFrame(draw);
    }
    function wake(){if(!raf&&!lost){last=0;raf=requestAnimationFrame(draw);}}
    var io=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0;} });io.observe(canvas);
    var ro=new ResizeObserver(wake);ro.observe(canvas);
    document.addEventListener("visibilitychange",function(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
    motion.addEventListener("change",wake);
    canvas.addEventListener("webglcontextlost",function(e){e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.classList.remove("is-ready");});
    wake(); return {gl:gl,uniform:uniform,wake:wake};
  }
  function liquid(id, selector, mapUrl) {
    var target=document.querySelector(selector);if(!target)return;
    var pointer={x:.62,y:.52,tx:.62,ty:.52,active:0,ta:0,vx:0,vy:0};
    var mapAspect=2.398,hasMap=false,light=false;
    function theme(){light=document.documentElement.getAttribute("data-theme")==="light";}
    theme();new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    var r=renderer(id,`precision highp float;
      uniform vec2 uRes,uPointer,uVelocity,uMapScale;
      uniform float uTime,uActive,uHasMap,uLight;
      uniform sampler2D uMap;
      ${noise}
      void main(){
        vec2 uv=gl_FragCoord.xy/uRes,aspect=vec2(uRes.x/uRes.y,1.);
        float t=uTime*.024;
        vec2 delta=(uv-uPointer)*aspect;
        // Small anisotropic wake. The mask moves with the metal; nothing is erased.
        vec2 warped=delta+vec2(noise(delta*16.+t)-.5,noise(delta*13.-t)-.5)*.048;
        float reach=exp(-dot(warped*vec2(1.,1.7),warped*vec2(1.,1.7))*360.)*uActive;
        vec2 bend=(vec2(sin(warped.y*31.+t),cos(warped.x*23.-t))*.013+uVelocity*.020)*reach;
        vec2 p=(uv+bend)*aspect*3.;
        float f=fbm(p+vec2(t,-t*.45));
        float h=fbm(p+vec2(f*2.,t*.35));
        float dx=fbm(p+vec2(.012,0.)+vec2(f*2.,t*.35))-h;
        float dy=fbm(p+vec2(0.,.012)+vec2(f*2.,t*.35))-h;
        vec3 n=normalize(vec3(-dx*65.,-dy*65.,1.));
        vec3 view=vec3(0.,0.,1.);
        float broad=pow(max(dot(n,normalize(vec3(-.45,.65,1.))),0.),5.);
        float strip=pow(max(dot(reflect(-view,n),normalize(vec3(.55,.25,1.))),0.),24.);
        vec3 steel=mix(vec3(.085,.105,.145),vec3(.44,.51,.60),broad);
        steel+=vec3(.80,.87,.94)*strip*.68;
        steel+=vec3(.16,.23,.34)*pow(max(n.y,0.),7.)*.28;
        steel+=vec3(.34,.19,.09)*pow(max(1.-n.x*n.x,0.),9.)*.18;
        vec2 muv=((uv+bend)-.5)*uMapScale+.5;
        float inside=step(0.,muv.x)*step(muv.x,1.)*step(0.,muv.y)*step(muv.y,1.);
        float land=texture2D(uMap,vec2(muv.x,1.-muv.y)).r*inside;
        vec2 q=uv-vec2(.64,.51);
        float mass=.54-length(q*vec2(.80,1.18))+(h-.5)*.62+.075*sin(q.x*8.+t*7.);
        float fluid=smoothstep(-.04,.075,mass);
        float mask=mix(fluid,land,uHasMap);
        float edge=1.-smoothstep(.56,.92,length((uv-.5)*vec2(.82,1.)));
        vec3 dark=vec3(.043,.047,.055);
        vec3 col=mix(dark,steel,mask*edge*.8);
        if(uLight>.5)col=mix(vec3(.957,.957,.941),vec3(.25,.3,.36)+steel*.2,mask*edge*.7);
        gl_FragColor=vec4(col,1.);
      }`,function(gl,u,dt){
        var k=1.-Math.exp(-dt*3.4),oldx=pointer.x,oldy=pointer.y;
        pointer.x+=(pointer.tx-pointer.x)*k;pointer.y+=(pointer.ty-pointer.y)*k;
        pointer.active+=(pointer.ta-pointer.active)*(1.-Math.exp(-dt*2.8));
        pointer.vx+=(Math.max(-1,Math.min(1,(pointer.x-oldx)/Math.max(dt,.001)))-pointer.vx)*k;
        pointer.vy+=(Math.max(-1,Math.min(1,(pointer.y-oldy)/Math.max(dt,.001)))-pointer.vy)*k;
        gl.uniform2f(u("uPointer"),pointer.x,pointer.y);gl.uniform2f(u("uVelocity"),pointer.vx,pointer.vy);
        gl.uniform1f(u("uActive"),motion.matches?0:pointer.active);gl.uniform1f(u("uHasMap"),hasMap?1:0);gl.uniform1f(u("uLight"),light?1:0);
        var aspect=gl.canvas.width/gl.canvas.height;
        gl.uniform2f(u("uMapScale"),aspect>mapAspect?1:aspect/mapAspect,aspect>mapAspect?mapAspect/aspect:1);
      });
    if(!r)return;
    var gl=r.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(mapUrl){var img=new Image();img.onload=function(){gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);mapAspect=img.width/img.height;hasMap=true;r.wake();};img.src=mapUrl;}
    target.addEventListener("pointermove",function(e){if(e.pointerType==="touch"||motion.matches)return;var b=gl.canvas.getBoundingClientRect();pointer.tx=(e.clientX-b.left)/b.width;pointer.ty=1.-(e.clientY-b.top)/b.height;pointer.ta=1;},{passive:true});
    target.addEventListener("pointerleave",function(){pointer.ta=0;});
  }
  function processRail(){var steps=document.querySelector('.steps');if(!steps)return;
    var items=Array.from(steps.querySelectorAll('.step')),pending=false;
    function activate(item){items.forEach(function(x){x.classList.toggle('is-current',x===item);});steps.style.setProperty('--step-top',item.offsetTop+'px');steps.style.setProperty('--step-height',item.offsetHeight+'px');}
    function update(){pending=false;var center=innerHeight*.47;var best=items.reduce(function(a,b){return Math.abs(b.getBoundingClientRect().top-center)<Math.abs(a.getBoundingClientRect().top-center)?b:a;});if(best)activate(best);}
    function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
    items.forEach(function(item){item.addEventListener('pointerenter',function(){activate(item);});});
    steps.addEventListener('pointerleave',schedule);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);new ResizeObserver(schedule).observe(steps);schedule();
  }
  window.StamVisuals={liquid:liquid};
  processRail();
})();
