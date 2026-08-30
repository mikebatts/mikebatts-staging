(function(){
  'use strict';

  var doc=document;
  var root=doc.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gs=window.gsap;
  var ST=window.ScrollTrigger;
  var hasGsap=!!(gs&&ST);
  if(hasGsap){try{gs.registerPlugin(ST)}catch(e){hasGsap=false}}
  if(hasGsap&&!reduce)root.classList.add('va-motion-ready');

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function lerp(a,b,t){return a+(b-a)*t}
  function seeded(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}}
  function fitCanvas(canvas){
    var d=Math.min(1.5,window.devicePixelRatio||1),w=canvas.clientWidth,h=canvas.clientHeight;
    if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d)}
    return {d:d,w:w,h:h};
  }

  /* Global progress. */
  var progressEl=doc.querySelector('.va-progress span');
  function updateProgress(){
    var max=Math.max(1,doc.documentElement.scrollHeight-window.innerHeight);
    if(progressEl)progressEl.style.transform='scaleY('+clamp(window.scrollY/max,0,1)+')';
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  updateProgress();

  /* Prime scroll-seek videos for iOS, then reveal only after a decoded frame. */
  var allVideos=[].slice.call(doc.querySelectorAll('video'));
  allVideos.forEach(function(video){
    video.addEventListener('loadeddata',function(){video.classList.add('is-ready')});
    video.addEventListener('canplay',function(){video.classList.add('is-ready')});
    video.addEventListener('error',function(){video.classList.remove('is-ready')});
  });
  function primeVideos(){
    allVideos.forEach(function(video){
      if(video.readyState<1)return;
      var play=video.play();
      if(play&&play.then)play.then(function(){video.pause()}).catch(function(){});
    });
  }
  window.addEventListener('touchstart',primeVideos,{passive:true,once:true});
  window.addEventListener('pointerdown',primeVideos,{passive:true,once:true});

  /* Hero: one frame-accurate scroll-seek world. */
  var hero=doc.querySelector('[data-hero]');
  var heroVideo=doc.querySelector('.va-film-video');
  var heroIntro=doc.querySelector('[data-hero-intro]');
  var heroScan=doc.querySelector('.va-scan');
  var heroDepth=doc.querySelector('.va-depth-grid');
  var heroScenes=[].slice.call(doc.querySelectorAll('[data-scene]'));
  var heroRail=[].slice.call(doc.querySelectorAll('.va-hero-rail span'));
  var heroDesired=0,heroCurrent=0,heroReady=false,heroScene=-1;

  function setHeroScene(index){
    index=clamp(index,0,heroScenes.length-1);
    if(index===heroScene)return;
    heroScene=index;
    heroScenes.forEach(function(el,i){
      el.classList.toggle('is-active',i===index);
      if(hasGsap&&!reduce)gs.to(el,{opacity:i===index?1:0,y:i===index?0:(i<index?-18:22),duration:.65,ease:'power3.out',overwrite:true});
    });
    heroRail.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
  }
  function applyHero(p){
    p=clamp(p,0,1);
    setHeroScene(Math.min(3,Math.floor(p*4.03)));
    if(heroIntro){
      var out=clamp((p-.025)/.2,0,1);
      heroIntro.style.opacity=String(1-out);
      heroIntro.style.transform='translate3d(0,'+(-34*out)+'px,0)';
    }
    if(heroScan){
      var scanIn=clamp((p-.12)/.12,0,1),scanOut=1-clamp((p-.91)/.07,0,1);
      heroScan.style.opacity=String(scanIn*scanOut);
      heroScan.style.transform='translateY('+lerp(-55,58,clamp((p-.12)/.78,0,1))+'%)';
    }
    if(heroDepth){
      var dIn=clamp((p-.36)/.18,0,1),dOut=1-clamp((p-.92)/.06,0,1);
      heroDepth.style.opacity=String(dIn*dOut*.62);
      heroDepth.style.transform='scale('+(1+p*.025)+')';
    }
    if(heroReady&&!reduce)heroDesired=p*Math.max(.1,heroVideo.duration-.04);
  }
  function prepareHeroVideo(){heroReady=isFinite(heroVideo.duration)&&heroVideo.duration>0;if(heroReady){heroCurrent=heroDesired=.01;try{heroVideo.currentTime=.01}catch(e){}}}
  if(heroVideo){
    heroVideo.addEventListener('loadedmetadata',prepareHeroVideo);
    if(heroVideo.readyState>=1)prepareHeroVideo();
  }
  function heroSeek(){
    if(heroReady&&!reduce){heroCurrent=lerp(heroCurrent,heroDesired,.18);if(Math.abs(heroVideo.currentTime-heroCurrent)>.018){try{heroVideo.currentTime=heroCurrent}catch(e){}}}
    requestAnimationFrame(heroSeek);
  }
  heroSeek();
  if(hero){
    if(hasGsap&&!reduce)ST.create({trigger:hero,start:'top top',end:'bottom bottom',scrub:.65,onUpdate:function(self){applyHero(self.progress)}});
    else{
      var heroScroll=function(){var r=hero.getBoundingClientRect(),d=Math.max(1,hero.offsetHeight-window.innerHeight);applyHero(clamp(-r.top/d,0,1))};
      window.addEventListener('scroll',heroScroll,{passive:true});heroScroll();
    }
  }
  setHeroScene(0);

  /* Quiet ash over the establishing world. */
  var ash=doc.querySelector('.va-ash');
  if(ash&&!reduce){
    var ax=ash.getContext('2d'),ar=seeded(79),parts=[],ashVisible=true;
    function resizeAsh(){
      var d=Math.min(1.5,window.devicePixelRatio||1),w=ash.clientWidth,h=ash.clientHeight;
      ash.width=Math.round(w*d);ash.height=Math.round(h*d);ax.setTransform(d,0,0,d,0,0);parts=[];
      var count=window.innerWidth<700?18:48;
      for(var i=0;i<count;i++)parts.push({x:ar()*w,y:ar()*h,r:.35+ar()*1.1,s:.07+ar()*.2,a:.06+ar()*.2,dr:(ar()-.5)*.07});
    }
    function drawAsh(){
      if(ashVisible){var w=ash.clientWidth,h=ash.clientHeight;ax.clearRect(0,0,w,h);ax.fillStyle='#fff';parts.forEach(function(p){p.y-=p.s;p.x+=p.dr;if(p.y<-5){p.y=h+5;p.x=ar()*w}ax.globalAlpha=p.a;ax.beginPath();ax.arc(p.x,p.y,p.r,0,Math.PI*2);ax.fill()});ax.globalAlpha=1}
      requestAnimationFrame(drawAsh);
    }
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){ashVisible=e[0].isIntersecting}).observe(ash);
    resizeAsh();drawAsh();window.addEventListener('resize',resizeAsh,{passive:true});
  }

  /* Scan → Separate → Flatten → Read. Adapted into the approved visual system. */
  var sequence=doc.querySelector('[data-sequence]');
  if(sequence){
    var seqCanvas=sequence.querySelector('.va-sequence-canvas');
    var seqCtx=seqCanvas&&seqCanvas.getContext('2d');
    var seqSteps=[].slice.call(sequence.querySelectorAll('[data-sequence-step]'));
    var seqName=sequence.querySelector('[data-sequence-name]');
    var seqIndex=sequence.querySelector('[data-sequence-index]');
    var seqMeta={
      scan:{i:0,name:'Scan',morph:0,explode:0,mark:0,hi:.5,scan:1},
      separate:{i:1,name:'Separate',morph:0,explode:1,mark:0,hi:1,scan:0},
      flatten:{i:2,name:'Flatten',morph:1,explode:0,mark:0,hi:1,scan:0},
      read:{i:3,name:'Read',morph:1,explode:0,mark:1,hi:1,scan:0}
    };
    var seqCur={morph:0,explode:0,mark:0,hi:.5,scan:1},seqTarget=seqMeta.scan,seqActive='scan';
    var seqRand=seeded(1447),seqMarks=[];
    for(var sm=0;sm<32;sm++)seqMarks.push({x:seqRand(),y:(seqRand()-.5),on:seqRand()>.68});
    function setSequence(key){
      seqActive=key;seqTarget=seqMeta[key]||seqMeta.scan;
      seqSteps.forEach(function(step){step.classList.toggle('is-active',step.getAttribute('data-sequence-step')===key)});
      if(seqName)seqName.textContent=seqTarget.name;
      if(seqIndex)seqIndex.textContent='0'+(seqTarget.i+1);
      if(reduce){Object.keys(seqCur).forEach(function(k){seqCur[k]=seqTarget[k]});drawSequence(0)}
    }
    function drawSequence(t){
      if(!seqCtx)return;
      var f=fitCanvas(seqCanvas),W=seqCanvas.width,H=seqCanvas.height,d=f.d,cx=W/2,cy=H/2,R=Math.min(W,H)*.39,L=15,samples=112;
      seqCtx.clearRect(0,0,W,H);
      for(var i=0;i<L;i++){
        var frac=(i+1)/L,rad=R*frac+seqCur.explode*(i-L/2)*(R*.026),yFlat=cy+(i-(L-1)/2)*(R*2/L),highlight=i===7;
        seqCtx.beginPath();
        for(var s=0;s<=samples;s++){
          var th=-Math.PI+(s/samples)*Math.PI*2;
          var x=lerp(cx+Math.cos(th)*rad,cx+(th/Math.PI)*(R*1.03),seqCur.morph);
          var y=lerp(cy+Math.sin(th)*rad,yFlat,seqCur.morph);
          if(s===0)seqCtx.moveTo(x,y);else seqCtx.lineTo(x,y);
        }
        var a=.08+.12*(1-Math.abs(i-L/2)/(L/2));
        if(highlight){seqCtx.strokeStyle='rgba(200,90,50,'+(.36+.56*seqCur.hi)+')';seqCtx.lineWidth=1.7*d;seqCtx.shadowColor='rgba(200,90,50,.62)';seqCtx.shadowBlur=10*d*seqCur.hi}
        else{seqCtx.strokeStyle='rgba(243,241,235,'+a+')';seqCtx.lineWidth=1*d;seqCtx.shadowBlur=0}
        seqCtx.stroke();seqCtx.shadowBlur=0;
      }
      if(seqCur.scan>.01){
        var sy=cy+Math.sin((t||0)*.0015)*R*.88;if(reduce)sy=cy-R*.32;
        var grad=seqCtx.createLinearGradient(cx-R,sy,cx+R,sy);grad.addColorStop(0,'rgba(200,90,50,0)');grad.addColorStop(.5,'rgba(200,90,50,'+(.8*seqCur.scan)+')');grad.addColorStop(1,'rgba(200,90,50,0)');
        seqCtx.strokeStyle=grad;seqCtx.lineWidth=1.5*d;seqCtx.beginPath();seqCtx.moveTo(cx-R*1.08,sy);seqCtx.lineTo(cx+R*1.08,sy);seqCtx.stroke();
      }
      if(seqCur.mark>.01){
        seqMarks.forEach(function(m){var x=cx+(m.x*2-1)*R*.94,y=cy+m.y*R*.5,a=seqCur.mark*(m.on ? .95 : .28);seqCtx.fillStyle=m.on?'rgba(200,90,50,'+a+')':'rgba(243,241,235,'+a+')';var size=(m.on?2.7:1.5)*d;seqCtx.fillRect(x-size/2,y-size/2,size,size)});
      }
    }
    seqSteps.forEach(function(step){
      var key=step.getAttribute('data-sequence-step');
      if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){setSequence(key)},onEnterBack:function(){setSequence(key)}});
      else if(!reduce&&'IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setSequence(key)})},{rootMargin:'-45% 0px -45% 0px'}).observe(step);
    });
    setSequence(reduce?'read':'scan');
    var seqVisible=true,last=0;
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){seqVisible=e[0].isIntersecting}).observe(seqCanvas);
    function sequenceLoop(t){
      if(seqVisible){seqCur.morph=lerp(seqCur.morph,seqTarget.morph,.08);seqCur.explode=lerp(seqCur.explode,seqTarget.explode,.08);seqCur.mark=lerp(seqCur.mark,seqTarget.mark,.08);seqCur.hi=lerp(seqCur.hi,seqTarget.hi,.1);seqCur.scan=lerp(seqCur.scan,seqTarget.scan,.08);drawSequence(t-last)}
      last=t;requestAnimationFrame(sequenceLoop);
    }
    if(!reduce)requestAnimationFrame(sequenceLoop);
  }

  /* False signal film: model confidence gives way to the material itself. */
  var falseSection=doc.querySelector('[data-false]');
  var falseVideo=doc.querySelector('.va-false-video');
  var falseReveal=doc.querySelector('.va-false-reveal');
  var falseScan=doc.querySelector('.va-false-scan');
  var falseStates=[].slice.call(doc.querySelectorAll('.va-false-state span'));
  var falseReady=false,falseDesired=0,falseCurrent=0;
  function prepareFalseVideo(){falseReady=isFinite(falseVideo.duration)&&falseVideo.duration>0;if(falseReady){falseCurrent=falseDesired=.01;try{falseVideo.currentTime=.01}catch(e){}}}
  if(falseVideo){falseVideo.addEventListener('loadedmetadata',prepareFalseVideo);if(falseVideo.readyState>=1)prepareFalseVideo()}
  function applyFalse(p){
    p=clamp(p,0,1);
    if(falseReady&&!reduce)falseDesired=p*Math.max(.1,falseVideo.duration-.04);
    if(falseReveal){var r=clamp((p-.52)/.34,0,1);falseReveal.style.opacity=String(r*.82);falseReveal.style.transform='scale('+(1.12-r*.07)+')'}
    if(falseScan)falseScan.style.opacity=String(clamp((p-.25)/.35,0,1)*(1-clamp((p-.78)/.18,0,1))*.7);
    var idx=p<.34?0:(p<.7?1:2);falseStates.forEach(function(el,i){el.classList.toggle('is-active',i===idx)});
  }
  function falseSeek(){if(falseReady&&!reduce){falseCurrent=lerp(falseCurrent,falseDesired,.16);if(Math.abs(falseVideo.currentTime-falseCurrent)>.018){try{falseVideo.currentTime=falseCurrent}catch(e){}}}requestAnimationFrame(falseSeek)}
  falseSeek();
  if(falseSection){
    if(hasGsap&&!reduce)ST.create({trigger:falseSection,start:'top top',end:'bottom bottom',scrub:.6,onUpdate:function(self){applyFalse(self.progress)}});
    else applyFalse(reduce?1:0);
  }

  /* Proof chain: published page → exact surface → CT geometry → verdict. */
  var traceSteps=[].slice.call(doc.querySelectorAll('[data-trace-step]'));
  var tracePublished=doc.querySelector('.va-trace-published');
  var traceSurface=doc.querySelector('.va-trace-surface');
  var traceMap=doc.querySelector('.va-trace-map');
  var traceVolume=doc.querySelector('.va-trace-volume');
  var traceVerdict=doc.querySelector('.va-trace-verdict');
  var traceLine=doc.querySelector('.va-trace-line span');
  function setTrace(index){
    traceSteps.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
    var states=[
      [1,0,0,0,0],
      [.08,1,0,0,0],
      [0,.14,.42,1,0],
      [0,.08,.18,.48,1]
    ][index]||[1,0,0,0,0];
    var els=[tracePublished,traceSurface,traceMap,traceVolume,traceVerdict];
    els.forEach(function(el,i){if(!el)return;if(gs&&!reduce)gs.to(el,{opacity:states[i],y:states[i]?0:18,duration:.72,ease:'power3.out',overwrite:true});else el.style.opacity=states[i]});
    if(traceLine)traceLine.style.transform='scaleX('+((index+1)/4)+')';
  }
  traceSteps.forEach(function(step,i){if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){setTrace(i)},onEnterBack:function(){setTrace(i)}})});
  setTrace(reduce?3:0);

  /* Cohort: six independent stations, one human gate. */
  var cohort=doc.querySelector('[data-cohort]');
  var cohortVideo=doc.querySelector('.va-cohort-video');
  var roles=[].slice.call(doc.querySelectorAll('[data-role]'));
  var cohortReady=false,cohortDesired=0,cohortCurrent=0;
  function prepareCohortVideo(){cohortReady=isFinite(cohortVideo.duration)&&cohortVideo.duration>0;if(cohortReady){cohortCurrent=cohortDesired=.01;try{cohortVideo.currentTime=.01}catch(e){}}}
  if(cohortVideo){cohortVideo.addEventListener('loadedmetadata',prepareCohortVideo);if(cohortVideo.readyState>=1)prepareCohortVideo()}
  function applyCohort(p){
    p=clamp(p,0,1);if(cohortReady&&!reduce)cohortDesired=p*Math.max(.1,cohortVideo.duration-.04);
    var idx=Math.min(5,Math.floor(p*6.05));roles.forEach(function(el,i){el.classList.toggle('is-active',p>.91||i===idx)});
  }
  function cohortSeek(){if(cohortReady&&!reduce){cohortCurrent=lerp(cohortCurrent,cohortDesired,.16);if(Math.abs(cohortVideo.currentTime-cohortCurrent)>.018){try{cohortVideo.currentTime=cohortCurrent}catch(e){}}}requestAnimationFrame(cohortSeek)}
  cohortSeek();
  if(cohort&&window.innerWidth>900){
    if(hasGsap&&!reduce)ST.create({trigger:cohort,start:'top top',end:'bottom bottom',scrub:.6,onUpdate:function(self){applyCohort(self.progress)}});
    else applyCohort(reduce?1:0);
  }else roles.forEach(function(el){el.classList.add('is-active')});

  /* Short entrances, never applied to core scrub choreography. */
  if(hasGsap&&!reduce){
    var reveals=[].slice.call(doc.querySelectorAll('.va-intro-grid,.va-proof-head,.va-findings-head,.va-findings-grid article,.va-journal-head,.va-latest,.va-next>div'));
    reveals.forEach(function(el){gs.from(el,{y:32,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}})});
    [].slice.call(doc.querySelectorAll('.va-journal-list li')).forEach(function(el){ST.create({trigger:el,start:'top 84%',once:true,onEnter:function(){el.classList.add('is-visible')}})});
  }else [].slice.call(doc.querySelectorAll('.va-journal-list li')).forEach(function(el){el.classList.add('is-visible')});

  function refresh(){updateProgress();if(hasGsap)ST.refresh()}
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(refresh);
  window.addEventListener('load',refresh,{once:true});
})();
