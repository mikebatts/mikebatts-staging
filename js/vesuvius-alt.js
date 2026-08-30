(function(){
  'use strict';
  var doc=document,root=doc.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gs=window.gsap,ST=window.ScrollTrigger,hasGsap=!!(gs&&ST);
  if(hasGsap){try{gs.registerPlugin(ST)}catch(e){hasGsap=false}}
  if(hasGsap&&!reduce)root.classList.add('va-motion-ready');

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function lerp(a,b,t){return a+(b-a)*t}
  function ease(t){return 1-Math.pow(1-clamp(t,0,1),3)}
  function seeded(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}}
  function pad(n){return String(n).padStart(3,'0')}
  function fitCanvas(canvas){
    var d=Math.min(1.6,window.devicePixelRatio||1),w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    var W=Math.round(w*d),H=Math.round(h*d);
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
    return {d:d,w:w,h:h,W:W,H:H};
  }
  function setTransform(ctx,d){ctx.setTransform(d,0,0,d,0,0)}
  function watchSteps(steps,callback){
    steps.forEach(function(step,i){
      if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){callback(i)},onEnterBack:function(){callback(i)}});
      else if(!reduce&&'IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)callback(i)})},{rootMargin:'-44% 0px -44% 0px'}).observe(step);
    });
  }

  /* One quiet progress rule across the full excavation. */
  var progressEl=doc.querySelector('.va-progress span');
  function updateProgress(){var max=Math.max(1,doc.documentElement.scrollHeight-window.innerHeight);if(progressEl)progressEl.style.transform='scaleY('+clamp(window.scrollY/max,0,1)+')'}
  window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();

  /* HERO — a Higgsfield eruption becomes a physical, scroll-controlled memory. */
  var hero=doc.querySelector('[data-hero]'),film=doc.querySelector('.va-film-sequence'),filmPoster=doc.querySelector('.va-film-poster');
  var filmCtx=film&&film.getContext('2d',{alpha:false}),frameCount=72,frames=[],frameLoaded=0,lastFrame=-1,heroP=0;
  var heroIntro=doc.querySelector('[data-hero-intro]'),heroScan=doc.querySelector('.va-scan'),heroDepth=doc.querySelector('.va-depth-grid'),xray=doc.querySelector('.va-xray-world');
  var heroScenes=[].slice.call(doc.querySelectorAll('[data-scene]')),heroRail=[].slice.call(doc.querySelectorAll('.va-hero-rail span'));
  var frameStatus=doc.querySelector('[data-frame-status]'),heroScene=-1;
  var mobileFrames=window.matchMedia('(max-width: 900px)').matches;
  function frameSrc(i){return 'images/vesuvius-alt/eruption/'+(mobileFrames?'mobile':'desktop')+'/frame-'+pad(i+1)+'.webp'}
  function drawCover(ctx,img,W,H){
    var ir=img.naturalWidth/img.naturalHeight,cr=W/H,sw,sh,sx,sy;
    if(ir>cr){sh=img.naturalHeight;sw=sh*cr;sx=(img.naturalWidth-sw)/2;sy=0}else{sw=img.naturalWidth;sh=sw/cr;sx=0;sy=(img.naturalHeight-sh)/2}
    ctx.drawImage(img,sx,sy,sw,sh,0,0,W,H);
  }
  function drawHero(index){
    if(!filmCtx)return;index=clamp(Math.round(index),0,frameCount-1);
    var img=frames[index],near=index;
    if(!img||!img.complete){for(var r=1;r<frameCount;r++){if(frames[index-r]&&frames[index-r].complete){near=index-r;break}if(frames[index+r]&&frames[index+r].complete){near=index+r;break}}img=frames[near]}
    if(!img||!img.complete)return;
    var f=fitCanvas(film);filmCtx.setTransform(1,0,0,1,0,0);filmCtx.fillStyle='#000';filmCtx.fillRect(0,0,f.W,f.H);drawCover(filmCtx,img,f.W,f.H);lastFrame=index;
    if(!film.classList.contains('is-ready'))film.classList.add('is-ready');
  }
  function loadFrames(){
    var order=[0,frameCount-1],middle=[];for(var i=1;i<frameCount-1;i++)middle.push(i);order=order.concat(middle);
    var cursor=0,active=0,max=mobileFrames?5:7;
    function next(){while(active<max&&cursor<order.length){(function(index){active++;var img=new Image();frames[index]=img;img.decoding='async';img.onload=function(){active--;frameLoaded++;if(lastFrame<0||index===Math.round(heroP*(frameCount-1)))drawHero(Math.round(heroP*(frameCount-1)));next()};img.onerror=function(){active--;next()};img.src=frameSrc(index)})(order[cursor++])}}
    next();
  }
  function setHeroScene(index){
    index=clamp(index,0,heroScenes.length-1);if(index===heroScene)return;heroScene=index;
    heroScenes.forEach(function(el,i){el.classList.toggle('is-active',i===index);if(hasGsap&&!reduce)gs.to(el,{opacity:i===index?1:0,y:i===index?0:(i<index?-15:20),duration:.6,ease:'power3.out',overwrite:true})});
    heroRail.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
  }
  function applyHero(p){
    p=clamp(p,0,1);var movie=clamp(p/.72,0,1),xp=clamp((p-.69)/.28,0,1);heroP=movie;
    var target=Math.round(ease(movie)*(frameCount-1));if(target!==lastFrame)drawHero(target);
    var idx=p<.15?0:p<.38?1:p<.63?2:p<.82?3:4;setHeroScene(idx);
    if(frameStatus)frameStatus.textContent=['Before the ash','The eruption','Ash fall','The buried city','X-ray surface'][idx];
    if(heroIntro){var out=clamp((p-.035)/.14,0,1);heroIntro.style.opacity=String(1-out);heroIntro.style.transform='translate3d(0,'+(-30*out)+'px,0)'}
    if(xray){xray.style.opacity=String(ease(xp)*.8);xray.style.transform='scale('+(1+xp*.018)+')'}
    if(heroDepth)heroDepth.style.opacity=String(ease(xp)*.48);
    if(heroScan){var s=ease(xp),fade=1-clamp((p-.965)/.035,0,1);heroScan.style.opacity=String(s*fade);heroScan.style.transform='translateY('+lerp(-48,52,s)+'%)'}
  }
  loadFrames();setHeroScene(0);
  if(hero){
    if(hasGsap&&!reduce)ST.create({trigger:hero,start:'top top',end:'bottom bottom',scrub:.55,onUpdate:function(self){applyHero(self.progress)}});
    else{var heroScroll=function(){var r=hero.getBoundingClientRect(),d=Math.max(1,hero.offsetHeight-window.innerHeight);applyHero(reduce?0:clamp(-r.top/d,0,1))};window.addEventListener('scroll',heroScroll,{passive:true});heroScroll()}
  }

  /* PROCESS — one elegant section of a scroll changes state four times. */
  var sequence=doc.querySelector('[data-sequence]');
  if(sequence){
    var sc=sequence.querySelector('.va-sequence-canvas'),sx=sc.getContext('2d'),steps=[].slice.call(sequence.querySelectorAll('[data-sequence-step]'));
    var seqName=sequence.querySelector('[data-sequence-name]'),seqIndex=sequence.querySelector('[data-sequence-index]'),seqTarget=0,seqCurrent=0,seqVisible=true;
    var names=['Scan','Separate','Flatten','Read'],markRand=seeded(1447),marks=[];for(var mi=0;mi<40;mi++)marks.push({x:markRand(),y:markRand(),hot:markRand()>.82});
    function setSequence(i){seqTarget=i;steps.forEach(function(el,j){el.classList.toggle('is-active',j===i)});if(seqName)seqName.textContent=names[i];if(seqIndex)seqIndex.textContent='0'+(i+1);if(reduce){seqCurrent=3;drawSequence()}}
    function contourPoint(layer,t,state,cx,cy,R){
      var a=t*Math.PI*2-Math.PI/2,rr=R*(.25+layer*.047)*(1+.025*Math.sin(a*3+layer));
      var ringX=cx+Math.cos(a)*rr*1.08,ringY=cy+Math.sin(a)*rr*.84;
      var row=(layer-7.5)*R*.095,wave=Math.sin(t*Math.PI*2*1.5+layer*.33)*R*.018;
      var flatX=cx+(t-.5)*R*1.75,flatY=cy+row+wave;
      var flatten=clamp(state-1.45,0,1),separate=Math.sin(Math.PI*clamp(state,0,1))*((layer-7.5)*R*.025);
      return {x:lerp(ringX,flatX,ease(flatten)),y:lerp(ringY+separate,flatY,ease(flatten))};
    }
    function drawSequence(){
      var f=fitCanvas(sc),d=f.d,W=f.w,H=f.h,cx=W/2,cy=H/2,R=Math.min(W,H)*.43;setTransform(sx,d);sx.clearRect(0,0,W,H);
      var selected=8,state=seqCurrent;
      for(var l=0;l<16;l++){sx.beginPath();for(var q=0;q<=150;q++){var p=contourPoint(l,q/150,state,cx,cy,R);if(q===0)sx.moveTo(p.x,p.y);else sx.lineTo(p.x,p.y)}var sel=l===selected;var select=clamp(state-.55,0,1);sx.strokeStyle=sel?'rgba(243,241,235,'+(.32+.58*select)+')':'rgba(243,241,235,'+(.11-.055*select)+')';sx.lineWidth=(sel?1.05:.65);sx.stroke()}
      var scanFade=1-clamp(state-.75,0,1);if(scanFade>.01){var yy=cy+Math.sin(performance.now()*.0011)*R*.66;sx.strokeStyle='rgba(183,53,36,'+(.82*scanFade)+')';sx.lineWidth=.8;sx.beginPath();sx.moveTo(cx-R*.95,yy);sx.lineTo(cx+R*.95,yy);sx.stroke()}
      var read=clamp(state-2.35,0,1);if(read>.01){marks.forEach(function(m){var x=cx+(m.x-.5)*R*1.64,y=cy+(m.y-.5)*R*.9;if(m.hot){sx.fillStyle='rgba(183,53,36,'+(.8*read)+')';sx.beginPath();sx.arc(x,y,1.5,0,Math.PI*2);sx.fill()}else if(m.x>.18&&m.x<.82){sx.strokeStyle='rgba(243,241,235,'+(.22*read)+')';sx.beginPath();sx.moveTo(x-3,y);sx.quadraticCurveTo(x,y-2,x+3,y);sx.stroke()}})}
    }
    watchSteps(steps,setSequence);setSequence(reduce?3:0);
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){seqVisible=e[0].isIntersecting}).observe(sc);
    function seqLoop(){if(seqVisible){seqCurrent=lerp(seqCurrent,seqTarget,.075);drawSequence()}requestAnimationFrame(seqLoop)}if(!reduce)seqLoop();
  }

  /* FALSE SIGNAL — suggestive shapes dissolve back into ordinary papyrus fibers. */
  var falseSection=doc.querySelector('[data-false]');
  if(falseSection){
    var fc=doc.querySelector('.va-false-canvas'),fx=fc.getContext('2d'),falseStates=[].slice.call(doc.querySelectorAll('.va-false-state span')),falseP=reduce?1:0;
    var fr=seeded(80139),fibers=[];for(var fi=0;fi<118;fi++)fibers.push({x:fr(),y:fr(),len:.14+fr()*.28,bend:(fr()-.5)*.18,alpha:.06+fr()*.13,cluster:fi<22?fi%3:-1});
    function drawFalse(){
      var f=fitCanvas(fc),d=f.d,W=f.w,H=f.h;setTransform(fx,d);fx.clearRect(0,0,W,H);var inspect=clamp((falseP-.25)/.42,0,1),release=clamp((falseP-.62)/.34,0,1);
      fibers.forEach(function(v,i){var x=v.x*W,y=v.y*H;if(v.cluster>=0){var centers=[[.7,.32],[.78,.52],[.66,.68]],c=centers[v.cluster];x=lerp(c[0]*W+(v.x-.5)*W*.15,x,release);y=lerp(c[1]*H+(v.y-.5)*H*.12,y,release)}var len=v.len*W,dy=v.bend*H;fx.beginPath();fx.moveTo(x-len/2,y);fx.bezierCurveTo(x-len*.18,y-dy,x+len*.18,y+dy,x+len/2,y);var proposal=v.cluster>=0?(1-release):0;fx.strokeStyle=proposal>.02?'rgba(243,241,235,'+(.16+proposal*.42)+')':'rgba(243,241,235,'+v.alpha+')';fx.lineWidth=proposal>.02?1:.65;fx.stroke()});
      for(var g=0;g<3;g++){var center=[[.7,.32],[.78,.52],[.66,.68]][g],a=(1-inspect)*.55*(1-release);if(a>.01){fx.strokeStyle='rgba(183,53,36,'+a+')';fx.lineWidth=.8;fx.beginPath();fx.ellipse(center[0]*W,center[1]*H,W*.075,H*.055,0,0,Math.PI*2);fx.stroke()}}
      if(inspect>.01){fx.strokeStyle='rgba(243,241,235,'+(.18*inspect)+')';fx.lineWidth=.6;for(var j=0;j<9;j++){var yy=H*(.18+j*.08);fx.beginPath();fx.moveTo(W*.48,yy);fx.lineTo(W*.94,yy);fx.stroke()}}
    }
    function applyFalse(p){falseP=clamp(p,0,1);var idx=falseP<.33?0:falseP<.69?1:2;falseStates.forEach(function(el,i){el.classList.toggle('is-active',i===idx)});var scan=doc.querySelector('.va-false-scan');if(scan)scan.style.opacity=String(clamp((falseP-.2)/.35,0,1)*(1-clamp((falseP-.82)/.16,0,1))*.45);drawFalse()}
    if(hasGsap&&!reduce)ST.create({trigger:falseSection,start:'top top',end:'bottom bottom',scrub:.55,onUpdate:function(self){applyFalse(self.progress)}});else applyFalse(reduce?1:0);
    window.addEventListener('resize',drawFalse,{passive:true});
  }

  /* PIVOT — the same evidence thread returns from a published letter to the CT object. */
  var trace=doc.querySelector('[data-trace]');
  if(trace){
    var tc=trace.querySelector('.va-trace-canvas'),tx=tc.getContext('2d'),traceSteps=[].slice.call(trace.querySelectorAll('[data-trace-step]')),traceTarget=0,traceCurrent=0;
    var verdict=trace.querySelector('.va-trace-verdict'),traceLine=trace.querySelector('.va-trace-line span');
    function setTrace(i){traceTarget=i;traceSteps.forEach(function(el,j){el.classList.toggle('is-active',j===i)});if(traceLine)traceLine.style.transform='scaleX('+((i+1)/4)+')';if(verdict){if(gs&&!reduce)gs.to(verdict,{opacity:i===3?1:0,y:i===3?0:12,duration:.6,ease:'power3.out',overwrite:true});else verdict.style.opacity=i===3?1:0}if(reduce){traceCurrent=3;drawTrace()}}
    function drawTrace(){
      var f=fitCanvas(tc),d=f.d,W=f.w,H=f.h,cx=W/2,cy=H/2,s=traceCurrent;setTransform(tx,d);tx.clearRect(0,0,W,H);
      tx.strokeStyle='rgba(243,241,235,.13)';tx.lineWidth=.65;
      if(s<1.15){var fade=1-clamp(s-.75,0,1);tx.font='300 '+Math.round(Math.min(W,H)*.48)+'px VA Quarto,serif';tx.textAlign='center';tx.textBaseline='middle';tx.fillStyle='rgba(243,241,235,'+(.74*fade)+')';tx.fillText('α',cx,cy*.96);tx.beginPath();tx.moveTo(W*.16,H*.72);tx.lineTo(W*.84,H*.72);tx.stroke()}
      var surface=clamp(s-.55,0,1)*(1-clamp(s-2.05,0,1));if(surface>.01){for(var i=0;i<15;i++){var yy=H*(.25+i*.035);tx.beginPath();for(var q=0;q<=80;q++){var x=W*(.12+q/80*.76),y=yy+Math.sin(q*.19+i*.37)*H*.008;if(q===0)tx.moveTo(x,y);else tx.lineTo(x,y)}tx.stroke()}tx.strokeStyle='rgba(183,53,36,'+(.8*surface)+')';tx.strokeRect(W*.47,H*.41,W*.12,H*.15)}
      var volume=clamp(s-1.55,0,1);if(volume>.01){for(var r=0;r<11;r++){tx.strokeStyle='rgba(243,241,235,'+(.06+volume*.09)+')';tx.beginPath();tx.ellipse(cx,cy,W*(.1+r*.022),H*(.07+r*.016),-.18,0,Math.PI*2);tx.stroke()}tx.fillStyle='rgba(183,53,36,'+(.85*volume)+')';tx.beginPath();tx.arc(W*.56,H*.47,2.4,0,Math.PI*2);tx.fill()}
      var challenge=clamp(s-2.42,0,1);if(challenge>.01){tx.strokeStyle='rgba(243,241,235,'+(.24*challenge)+')';for(var n=0;n<26;n++){var a=n/26*Math.PI*2,rr=Math.min(W,H)*(.19+(n%4)*.025);tx.beginPath();tx.moveTo(cx+Math.cos(a)*rr*.5,cy+Math.sin(a)*rr*.5);tx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);tx.stroke()}tx.strokeStyle='rgba(183,53,36,'+challenge+')';tx.beginPath();tx.moveTo(W*.22,H*.76);tx.bezierCurveTo(W*.39,H*.62,W*.54,H*.71,W*.78,H*.48);tx.stroke()}
    }
    watchSteps(traceSteps,setTrace);setTrace(reduce?3:0);var traceVisible=true;if('IntersectionObserver' in window)new IntersectionObserver(function(e){traceVisible=e[0].isIntersecting}).observe(tc);
    function traceLoop(){if(traceVisible){traceCurrent=lerp(traceCurrent,traceTarget,.07);drawTrace()}requestAnimationFrame(traceLoop)}if(!reduce)traceLoop();
  }

  /* COHORT — six independent pressures orbit the artifact instead of becoming characters. */
  var cohort=doc.querySelector('[data-cohort]');
  if(cohort){
    var cc=cohort.querySelector('.va-cohort-canvas'),cx=cc.getContext('2d'),roles=[].slice.call(cohort.querySelectorAll('[data-role]')),cohortP=reduce?1:0;
    function drawCohort(){
      var f=fitCanvas(cc),d=f.d,W=f.w,H=f.h,Cx=window.innerWidth<=900?W*.5:W*.57,Cy=H*.53,R=Math.min(W,H)*(window.innerWidth<=900?.3:.32),active=Math.min(5,Math.floor(cohortP*6.05));setTransform(cx,d);cx.clearRect(0,0,W,H);
      cx.strokeStyle='rgba(243,241,235,.1)';cx.lineWidth=.65;for(var ring=1;ring<=3;ring++){cx.beginPath();cx.arc(Cx,Cy,R*(.2+ring*.18),0,Math.PI*2);cx.stroke()}
      cx.beginPath();cx.arc(Cx,Cy,R*.14,0,Math.PI*2);cx.strokeStyle='rgba(243,241,235,.42)';cx.stroke();cx.fillStyle='rgba(243,241,235,.04)';cx.fill();
      for(var i=0;i<6;i++){var a=-Math.PI/2+i*Math.PI/3,nx=Cx+Math.cos(a)*R,ny=Cy+Math.sin(a)*R,on=cohortP>.91||i===active;cx.strokeStyle=on?'rgba(243,241,235,.68)':'rgba(243,241,235,.12)';cx.lineWidth=on?.9:.55;cx.beginPath();cx.moveTo(Cx+Math.cos(a)*R*.15,Cy+Math.sin(a)*R*.15);cx.lineTo(nx,ny);cx.stroke();cx.fillStyle=on?(i===5?'#b73524':'rgba(243,241,235,.9)'):'rgba(243,241,235,.24)';cx.beginPath();cx.arc(nx,ny,on?2.8:1.8,0,Math.PI*2);cx.fill()}
      cx.strokeStyle='rgba(183,53,36,'+(cohortP>.88?.88:.18)+')';cx.beginPath();cx.moveTo(Cx,Cy+R*.14);cx.lineTo(Cx,Cy+R*.56);cx.stroke();cx.fillStyle='rgba(183,53,36,'+(cohortP>.88?.95:.25)+')';cx.beginPath();cx.arc(Cx,Cy+R*.64,3.2,0,Math.PI*2);cx.fill();
    }
    function applyCohort(p){cohortP=clamp(p,0,1);var idx=Math.min(5,Math.floor(cohortP*6.05));roles.forEach(function(el,i){el.classList.toggle('is-active',cohortP>.91||i===idx)});drawCohort()}
    if(cohort&&window.innerWidth>900&&hasGsap&&!reduce)ST.create({trigger:cohort,start:'top top',end:'bottom bottom',scrub:.55,onUpdate:function(self){applyCohort(self.progress)}});else applyCohort(reduce?1:.96);
    window.addEventListener('resize',drawCohort,{passive:true});
  }

  /* Small entrances only; the scientific choreography remains scroll-bound. */
  if(hasGsap&&!reduce){
    [].slice.call(doc.querySelectorAll('.va-intro-grid,.va-proof-head,.va-findings-head,.va-findings-grid article,.va-journal-head,.va-latest,.va-next>div')).forEach(function(el){gs.from(el,{y:30,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}})});
    [].slice.call(doc.querySelectorAll('.va-journal-list li')).forEach(function(el){ST.create({trigger:el,start:'top 84%',once:true,onEnter:function(){el.classList.add('is-visible')}})});
  }else [].slice.call(doc.querySelectorAll('.va-journal-list li')).forEach(function(el){el.classList.add('is-visible')});

  function refresh(){updateProgress();if(film&&lastFrame>=0)drawHero(lastFrame);if(hasGsap)ST.refresh()}
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(refresh);window.addEventListener('load',refresh,{once:true});window.addEventListener('resize',refresh,{passive:true});
})();
