(function(){
  'use strict';

  var doc=document,root=doc.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gs=window.gsap,ST=window.ScrollTrigger,hasGsap=!!(gs&&ST);
  if(hasGsap){try{gs.registerPlugin(ST)}catch(e){hasGsap=false}}
  if(hasGsap&&!reduce)root.classList.add('va-motion-ready');

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function lerp(a,b,t){return a+(b-a)*t}
  function cubic(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3)}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t)}
  function seeded(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}}
  function pad(n){return String(n).padStart(3,'0')}
  function fitCanvas(canvas,maxDpr){
    var d=Math.min(maxDpr||1.5,window.devicePixelRatio||1),w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    var W=Math.round(w*d),H=Math.round(h*d);
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
    return {d:d,w:w,h:h,W:W,H:H};
  }
  function alphaInRange(p,start,end,fade){
    var a=smooth((p-start)/fade),b=1-smooth((p-(end-fade))/fade);
    return clamp(Math.min(a,b),0,1);
  }
  function watchSteps(steps,callback){
    steps.forEach(function(step,i){
      if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){callback(i)},onEnterBack:function(){callback(i)}});
      else if(!reduce&&'IntersectionObserver' in window)new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)callback(i)})},{rootMargin:'-42% 0px -42% 0px'}).observe(step);
    });
  }

  var progressEl=doc.querySelector('.va-progress span');
  function updateProgress(){
    var max=Math.max(1,doc.documentElement.scrollHeight-window.innerHeight);
    if(progressEl)progressEl.style.transform='scaleY('+clamp(window.scrollY/max,0,1)+')';
  }
  window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();

  /* HERO: one continuous historic event, not five abrupt slides. */
  var hero=doc.querySelector('[data-hero]'),film=doc.querySelector('.va-film-sequence');
  var filmCtx=film&&film.getContext('2d',{alpha:false}),frameCount=72,frames=[],lastFrame=-1,heroP=0;
  var heroIntro=doc.querySelector('[data-hero-intro]'),heroScan=doc.querySelector('.va-scan'),heroDepth=doc.querySelector('.va-depth-grid'),xray=doc.querySelector('.va-xray-world');
  var heroScenes=[].slice.call(doc.querySelectorAll('[data-scene]')),heroRail=[].slice.call(doc.querySelectorAll('.va-hero-rail span'));
  var frameStatus=doc.querySelector('[data-frame-status]'),mobileFrames=window.matchMedia('(max-width: 900px)').matches;
  var sceneRanges=[[.08,.25],[.22,.42],[.39,.61],[.58,.79],[.76,.995]],sceneLabels=['Before the ash','The eruption','Ash fall','The buried city','X-ray surface'];
  function frameSrc(i){return 'images/vesuvius-alt/eruption/'+(mobileFrames?'mobile':'desktop')+'/frame-'+pad(i+1)+'.webp'}
  function drawCover(ctx,img,W,H){
    var ir=img.naturalWidth/img.naturalHeight,cr=W/H,sw,sh,sx,sy;
    if(ir>cr){sh=img.naturalHeight;sw=sh*cr;sx=(img.naturalWidth-sw)/2;sy=0}
    else{sw=img.naturalWidth;sh=sw/cr;sx=0;sy=(img.naturalHeight-sh)/2}
    ctx.drawImage(img,sx,sy,sw,sh,0,0,W,H);
  }
  function drawHero(index){
    if(!filmCtx)return;index=clamp(Math.round(index),0,frameCount-1);
    var img=frames[index],near=index;
    if(!img||!img.complete){for(var r=1;r<frameCount;r++){if(frames[index-r]&&frames[index-r].complete){near=index-r;break}if(frames[index+r]&&frames[index+r].complete){near=index+r;break}}img=frames[near]}
    if(!img||!img.complete)return;
    var f=fitCanvas(film,1.4);filmCtx.setTransform(1,0,0,1,0,0);filmCtx.fillStyle='#000';filmCtx.fillRect(0,0,f.W,f.H);drawCover(filmCtx,img,f.W,f.H);lastFrame=index;
    film.classList.add('is-ready');
  }
  function loadFrames(){
    var order=[0,frameCount-1],middle=[],cursor=0,active=0,max=mobileFrames?5:7;
    for(var i=1;i<frameCount-1;i++)middle.push(i);order=order.concat(middle);
    function next(){
      while(active<max&&cursor<order.length){(function(index){
        active++;var img=new Image();frames[index]=img;img.decoding='async';
        img.onload=function(){active--;if(lastFrame<0||index===Math.round(heroP*(frameCount-1)))drawHero(Math.round(heroP*(frameCount-1)));next()};
        img.onerror=function(){active--;next()};img.src=frameSrc(index);
      })(order[cursor++])}
    }
    next();
  }
  function applyHero(p){
    p=clamp(p,0,1);var movie=clamp(p/.76,0,1);heroP=movie;
    var target=Math.round(cubic(movie)*(frameCount-1));if(target!==lastFrame)drawHero(target);
    var active=0,best=0;
    heroScenes.forEach(function(el,i){
      var range=sceneRanges[i],a=alphaInRange(p,range[0],range[1],.072);
      if(a>best){best=a;active=i}
      el.style.opacity=String(a);el.style.transform='translate3d(0,'+(8*(1-a))+'px,0)';el.style.visibility=a<.01?'hidden':'visible';
    });
    heroRail.forEach(function(el,i){el.classList.toggle('is-active',i===active)});
    if(frameStatus)frameStatus.textContent=sceneLabels[active];
    if(heroIntro){var out=smooth((p-.025)/.12);heroIntro.style.opacity=String(1-out);heroIntro.style.transform='translate3d(0,'+(-24*out)+'px,0)'}
    var xp=smooth((p-.72)/.22);
    if(xray){xray.style.opacity=String(xp*.74);xray.style.transform='scale('+(1+xp*.012)+')'}
    if(heroDepth)heroDepth.style.opacity=String(xp*.32);
    if(heroScan){
      var scanP=smooth((p-.735)/.22),fade=1-smooth((p-.955)/.04);
      heroScan.style.opacity=String(scanP*fade*.9);heroScan.style.transform='translate3d(0,'+lerp(-52,54,scanP)+'%,0)';
    }
  }
  loadFrames();applyHero(0);
  if(hero){
    if(hasGsap&&!reduce)ST.create({trigger:hero,start:'top top',end:'bottom bottom',scrub:.92,onUpdate:function(self){applyHero(self.progress)}});
    else{var heroScroll=function(){var r=hero.getBoundingClientRect(),d=Math.max(1,hero.offsetHeight-window.innerHeight);applyHero(reduce?0:clamp(-r.top/d,0,1))};window.addEventListener('scroll',heroScroll,{passive:true});heroScroll()}
  }

  /* CHALLENGE: the original cinematic scan, unwrap, and read transformation. */
  var process=doc.querySelector('[data-process]');
  if(process){
    var processSteps=[].slice.call(process.querySelectorAll('[data-process-step]'));
    var volume=process.querySelector('.va-volume'),surface=process.querySelector('.va-surface'),letter=process.querySelector('.va-letter'),count=process.querySelector('.va-process-count span');
    function setProcess(i){
      processSteps.forEach(function(el,j){el.classList.toggle('is-active',i===j)});if(count)count.textContent='0'+(i+1);
      if(hasGsap&&!reduce){
        gs.to(volume,{opacity:i===0?1:0,scale:i===0?1:.84,rotateZ:i===0?-8:-3,duration:1.24,ease:'power3.inOut',overwrite:true});
        gs.to(surface,{opacity:i===1?1:0,scale:i===1?1:.88,rotate:i===1?0:-4,duration:1.24,ease:'power3.inOut',overwrite:true});
        gs.to(letter,{opacity:i===2?1:0,scale:i===2?1:.7,filter:i===2?'blur(0px)':'blur(9px)',duration:1.24,ease:'power3.inOut',overwrite:true});
      }else{
        volume.style.opacity=i===0?1:0;surface.style.opacity=i===1?1:0;letter.style.opacity=i===2?1:0;
      }
    }
    watchSteps(processSteps,setProcess);setProcess(reduce?2:0);
  }

  /* FIRST DISCOVERY: crisp fibers form a proposal, then lose it. */
  var falseDraw=function(){};
  var falseSection=doc.querySelector('[data-false]');
  if(falseSection){
    var fc=falseSection.querySelector('.va-false-canvas'),fx=fc&&fc.getContext('2d'),falseStates=[].slice.call(falseSection.querySelectorAll('.va-false-state span')),falseP=reduce?1:0;
    var fr=seeded(80139),fibers=[],fragments=[],centers=[[.72,.30],[.78,.50],[.68,.69]];
    for(var fi=0;fi<58;fi++)fibers.push({y:.08+fr()*.84,phase:fr()*6.28,amp:.004+fr()*.012,alpha:.055+fr()*.11});
    for(var ci=0;ci<3;ci++)for(var cj=0;cj<8;cj++)fragments.push({cluster:ci,a:fr()*6.28,r:.012+fr()*.07,len:.018+fr()*.035,phase:fr()*6.28});
    function drawFalse(){
      if(!fx)return;var f=fitCanvas(fc,1.45),d=f.d,W=f.w,H=f.h;fx.setTransform(d,0,0,d,0,0);fx.clearRect(0,0,W,H);
      var inspect=smooth((falseP-.24)/.38),release=smooth((falseP-.62)/.32);
      fx.lineCap='round';
      fibers.forEach(function(v,i){
        var y=v.y*H;fx.beginPath();
        for(var q=0;q<=84;q++){var t=q/84,x=t*W,yy=y+Math.sin(t*8+v.phase)*H*v.amp+Math.sin(t*22+v.phase*.7)*H*.002;if(q===0)fx.moveTo(x,yy);else fx.lineTo(x,yy)}
        fx.strokeStyle='rgba(243,241,235,'+v.alpha+')';fx.lineWidth=i%11===0?.9:.55;fx.stroke();
      });
      fragments.forEach(function(v){
        var c=centers[v.cluster],orbit=v.a+falseP*.3,x0=c[0]*W+Math.cos(orbit)*W*v.r,y0=c[1]*H+Math.sin(orbit)*H*v.r;
        var flatY=(.18+((v.cluster*8+Math.round(v.a*10))%24)/28)*H;
        var x=lerp(x0,(.54+((v.a/6.28)*.39))*W,release),y=lerp(y0,flatY,release),angle=lerp(v.a*.28,0,release),len=v.len*W;
        fx.beginPath();fx.moveTo(x-Math.cos(angle)*len,y-Math.sin(angle)*len);fx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);
        fx.strokeStyle='rgba(243,241,235,'+(.34+.46*(1-release))+')';fx.lineWidth=.85;fx.stroke();
      });
      if(inspect>.01){
        fx.strokeStyle='rgba(183,53,36,'+(.58*inspect*(1-release*.88))+')';fx.lineWidth=.7;
        centers.forEach(function(c){fx.beginPath();fx.arc(c[0]*W,c[1]*H,Math.min(W,H)*.065,0,Math.PI*2);fx.stroke();fx.beginPath();fx.moveTo(c[0]*W-8,c[1]*H);fx.lineTo(c[0]*W+8,c[1]*H);fx.moveTo(c[0]*W,c[1]*H-8);fx.lineTo(c[0]*W,c[1]*H+8);fx.stroke()});
      }
    }
    falseDraw=drawFalse;
    function applyFalse(p){
      falseP=clamp(p,0,1);var idx=falseP<.32?0:falseP<.68?1:2;
      falseStates.forEach(function(el,i){el.classList.toggle('is-active',i===idx)});
      var scan=falseSection.querySelector('.va-false-scan');if(scan)scan.style.opacity=String(smooth((falseP-.2)/.3)*(1-smooth((falseP-.79)/.17))*.42);
      drawFalse();
    }
    if(hasGsap&&!reduce)ST.create({trigger:falseSection,start:'top top',end:'bottom bottom',scrub:.95,onUpdate:function(self){applyFalse(self.progress)}});
    else applyFalse(reduce?1:0);
    window.addEventListener('resize',drawFalse,{passive:true});
  }

  /* THE PIVOT: one light evidence object descends from letter to source volume. */
  var evidence=doc.querySelector('[data-evidence]');
  if(evidence){
    var evidenceSteps=[].slice.call(evidence.querySelectorAll('[data-trace-step]'));
    var published=evidence.querySelector('.va-slab-published'),surfaceSlab=evidence.querySelector('.va-slab-surface'),volumeSlab=evidence.querySelector('.va-slab-volume');
    var seal=evidence.querySelector('.va-evidence-seal'),line=evidence.querySelector('.va-evidence-line span');
    var states=[
      {p:1,s:.12,v:.06,py:-9,sy:0,vy:9},
      {p:.55,s:1,v:.08,py:-13,sy:0,vy:11},
      {p:.2,s:.58,v:1,py:-16,sy:-4,vy:5},
      {p:.36,s:.56,v:1,py:-17,sy:-5,vy:3}
    ];
    function setEvidence(i){
      evidenceSteps.forEach(function(el,j){el.classList.toggle('is-active',i===j)});if(line)line.style.transform='scaleX('+((i+1)/4)+')';
      var state=states[i];
      if(hasGsap&&!reduce){
        gs.to(published,{opacity:state.p,xPercent:state.py,yPercent:state.py,duration:1.12,ease:'power3.inOut',overwrite:true});
        gs.to(surfaceSlab,{opacity:state.s,xPercent:state.sy,yPercent:state.sy,duration:1.12,ease:'power3.inOut',overwrite:true});
        gs.to(volumeSlab,{opacity:state.v,xPercent:state.vy,yPercent:state.vy,duration:1.12,ease:'power3.inOut',overwrite:true});
        gs.to(seal,{opacity:i===3?1:0,y:i===3?0:8,duration:.78,ease:'power3.out',overwrite:true});
      }else{published.style.opacity=state.p;surfaceSlab.style.opacity=state.s;volumeSlab.style.opacity=state.v;seal.style.opacity=i===3?1:0}
    }
    watchSteps(evidenceSteps,setEvidence);setEvidence(reduce?3:0);
  }

  /* COHORS: a pinned desktop chapter and a native mobile swipe sequence. */
  var cohort=doc.querySelector('[data-cohort]');
  if(cohort){
    var cohortSticky=cohort.querySelector('.va-cohort-sticky'),roles=[].slice.call(cohort.querySelectorAll('[data-role]')),dots=[].slice.call(cohort.querySelectorAll('.va-cohort-timeline i'));
    var cohortLine=cohort.querySelector('.va-cohort-timeline span'),cohortIndex=cohort.querySelector('[data-cohort-index]'),cohortName=cohort.querySelector('[data-cohort-name]'),cohortCopy=cohort.querySelector('[data-cohort-copy]'),lastRole=-1;
    var roleCopy=[
      'Chooses the next question and defines what a useful answer would change.',
      'Builds the machinery, records the environment, and makes every run reproducible.',
      'Tries to break the claim before the claim can move forward.',
      'Tracks new papers, community findings, and outside evidence that can change the plan.',
      'Protects the compute, storage, and spend required to keep the work running.',
      'Names the failure modes early and keeps unresolved risk visible.'
    ];
    function applyCohort(p){
      p=clamp(p,0,1);var index=Math.min(5,Math.floor(p*6));
      roles.forEach(function(el,i){el.classList.toggle('is-active',i===index);el.classList.toggle('is-past',i<index)});
      dots.forEach(function(el,i){el.classList.toggle('is-active',i<=index)});
      if(cohortLine)cohortLine.style.transform='scaleX('+Math.max(.035,p)+')';
      if(index!==lastRole){lastRole=index;if(cohortIndex)cohortIndex.textContent='0'+(index+1)+' / 06';if(cohortName)cohortName.textContent=roles[index].querySelector('span').textContent;if(cohortCopy)cohortCopy.textContent=roleCopy[index]}
    }
    if(window.innerWidth>900&&hasGsap&&!reduce){
      ST.create({trigger:cohort,start:'top top',end:'+=320%',pin:cohortSticky,pinSpacing:true,scrub:1.05,anticipatePin:1,onUpdate:function(self){applyCohort(self.progress)}});
      applyCohort(0);
    }else{
      var lensRail=cohort.querySelector('.va-lenses');applyCohort(0);
      if(lensRail&&!reduce)lensRail.addEventListener('scroll',function(){var max=Math.max(1,lensRail.scrollWidth-lensRail.clientWidth);applyCohort(lensRail.scrollLeft/max)},{passive:true});
    }
  }

  /* ENDING: an ink-in-water plume with a lighter renderer for mobile Safari. */
  var ending=doc.querySelector('.va-ending'),endingCanvas=doc.querySelector('.va-ending-canvas');
  if(ending&&endingCanvas){
    var saveData=!!(navigator.connection&&navigator.connection.saveData),heavyEnding=window.innerWidth>900&&!reduce&&!saveData;
    var endingVisible=false,endingFrame=0,gl=null;
    if(heavyEnding)try{gl=endingCanvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance'})}catch(e){gl=null}
    function initWebGL(){
      var vertex='#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var fragment='#version 300 es\nprecision highp float;out vec4 o;uniform vec2 r;uniform float t;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),q=fract(p);q=q*q*(3.-2.*q);return mix(mix(h(i),h(i+vec2(1.,0.)),q.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.)),q.x),q.y);}float f(vec2 p){float v=0.,a=.52;for(int i=0;i<6;i++){v+=n(p)*a;p=p*2.02+vec2(7.1,3.7);a*=.5;}return v;}float plume(vec2 uv,float x,float phase,float tm){float y=uv.y;float wander=(f(vec2(y*1.55-tm*.07,phase))-.5)*.32;float center=x+wander+sin(y*6.+phase+tm*.18)*.03;float width=.016+y*.18;float shape=1.-smoothstep(width,width*1.72,abs(uv.x-center));float texture=f(vec2((uv.x-center)*5.2+phase,y*2.4-tm*.052));return shape*smoothstep(.28,.72,texture+y*.08)*smoothstep(.0,.16,y)*(1.-smoothstep(.84,1.08,y));}void main(){vec2 uv=gl_FragCoord.xy/r.xy;float tm=t;float broad=f(uv*vec2(1.8,1.25)+vec2(tm*.025,-tm*.018));vec2 wuv=uv;wuv.x+=(broad-.5)*.11;float a=plume(wuv,.69,.7,tm);float b=plume(wuv,.78,3.2,tm*.87);float c=plume(wuv,.58,5.4,tm*1.08);float density=max(a,max(b*.82,c*.7));float base=smoothstep(.56,.86,f(vec2(uv.x*3.1,uv.y*2.2-tm*.04)))*smoothstep(.0,.28,uv.y)*(1.-smoothstep(.42,.78,uv.y));density=clamp(density+base*.48,0.,1.);float detail=f(uv*7.+vec2(-tm*.05,tm*.025));density*=.72+.38*detail;vec3 col=vec3(.006)+vec3(.15,.145,.137)*density+vec3(.14)*pow(density,2.7);float redInk=a*(1.-smoothstep(.16,.72,uv.y))*(.28+.34*f(uv*5.-tm*.03));col+=vec3(.62,.075,.028)*redInk;vec2 grid=vec2(uv.x*112.,(uv.y+tm*.032)*70.);vec2 id=floor(grid),gv=fract(grid)-.5,off=vec2(h(id+3.7),h(id+19.2))-.5;float point=1.-smoothstep(.018,.07,length(gv-off*.62));float ember=point*step(.968,h(id+8.4))*(1.-smoothstep(.18,.92,uv.y));float pulse=.5+.5*sin(tm*3.+h(id)*6.283);col+=vec3(.86,.13,.045)*ember*pulse;o=vec4(col,1.);}';
      function shader(type,source){var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
      try{
        var program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
        var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
        var loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
        return {program:program,res:gl.getUniformLocation(program,'r'),time:gl.getUniformLocation(program,'t')};
      }catch(e){gl=null;return null}
    }
    var webglState=gl&&initWebGL(),ashRand=seeded(79),ash=[],wisps=[];
    for(var wi=0;wi<26;wi++)wisps.push({x:.32+ashRand()*.58,y:ashRand(),r:.1+ashRand()*.17,s:.035+ashRand()*.07,phase:ashRand()*6.283,red:ashRand()>.79});
    for(var ai=0;ai<46;ai++)ash.push({x:ashRand(),y:ashRand(),r:.35+ashRand()*.9,s:.025+ashRand()*.075,red:ashRand()>.9});
    function drawEnding2D(time){
      var ctx=endingCanvas.getContext('2d'),f=fitCanvas(endingCanvas,1.18),d=f.d,W=f.w,H=f.h;ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#050505';ctx.fillRect(0,0,W,H);
      wisps.forEach(function(w,i){var rise=(w.y+time*w.s*.000018)%1,y=1-rise,x=w.x+Math.sin(rise*7+w.phase+time*.00008)*(.025+rise*.075),radius=w.r*W*(.55+rise*1.25);ctx.save();ctx.translate(x*W,y*H);ctx.scale(.62,1.35);var grad=ctx.createRadialGradient(0,0,0,0,0,radius);grad.addColorStop(0,w.red?'rgba(183,53,36,.13)':'rgba(210,207,199,.14)');grad.addColorStop(.42,w.red?'rgba(183,53,36,.06)':'rgba(210,207,199,.075)');grad.addColorStop(1,'rgba(5,5,5,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore()});
      ash.forEach(function(a,i){var rise=(a.y+time*a.s*.000026)%1,x=a.x+Math.sin(time*.00012+i)*.025;ctx.fillStyle=a.red?'rgba(183,53,36,.58)':'rgba(210,207,199,.16)';ctx.beginPath();ctx.arc(x*W,(1-rise)*H,a.r,0,Math.PI*2);ctx.fill()});
    }
    function renderEnding(time){
      if(!endingVisible&&!reduce){endingFrame=0;return}
      if(webglState){
        var f=fitCanvas(endingCanvas,1.35);gl.viewport(0,0,f.W,f.H);gl.useProgram(webglState.program);gl.uniform2f(webglState.res,f.W,f.H);gl.uniform1f(webglState.time,(time||0)*.001);gl.drawArrays(gl.TRIANGLES,0,3);
      }else drawEnding2D(time||0);
      if(!reduce)endingFrame=requestAnimationFrame(renderEnding);
    }
    if('IntersectionObserver' in window)new IntersectionObserver(function(entries){endingVisible=entries[0].isIntersecting;if(endingVisible&&!endingFrame&&!reduce)endingFrame=requestAnimationFrame(renderEnding)}).observe(ending);
    else endingVisible=true;
    if(reduce){endingVisible=true;renderEnding(4200)}
  }

  /* Quiet entrances support the story without calling attention to themselves. */
  if(hasGsap&&!reduce){
    [].slice.call(doc.querySelectorAll('.va-intro-grid,.va-proof-head,.va-findings-head,.va-verdict-board article,.va-status-head,.va-status-board article,.va-status-signal')).forEach(function(el){
      gs.from(el,{y:16,opacity:0,duration:1.12,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}});
    });
  }

  function refresh(){updateProgress();if(film&&lastFrame>=0)drawHero(lastFrame);falseDraw();if(hasGsap)ST.refresh()}
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(refresh);
  window.addEventListener('load',refresh,{once:true});window.addEventListener('resize',refresh,{passive:true});
  /* Safari and history restoration can apply the saved scroll position after load. */
  window.setTimeout(refresh,900);
})();
