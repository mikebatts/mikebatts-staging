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

  /* Global reading progress */
  var progressEl=doc.querySelector('.va-progress span');
  function updateProgress(){
    var max=Math.max(1,doc.documentElement.scrollHeight-window.innerHeight);
    if(progressEl)progressEl.style.transform='scaleY('+clamp(window.scrollY/max,0,1)+')';
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  updateProgress();

  /* Hero film: precise scroll seeking with poster and iOS priming fallback. */
  var hero=doc.querySelector('[data-hero]');
  var video=doc.querySelector('.va-film-video');
  var intro=doc.querySelector('[data-hero-intro]');
  var scan=doc.querySelector('.va-scan');
  var depth=doc.querySelector('.va-depth-grid');
  var scenes=[].slice.call(doc.querySelectorAll('[data-scene]'));
  var rail=[].slice.call(doc.querySelectorAll('.va-hero-rail span'));
  var desiredTime=0,currentTime=0,videoReady=false,heroProgress=0,activeScene=-1;

  function setScene(index){
    index=clamp(index,0,scenes.length-1);
    if(index===activeScene)return;
    activeScene=index;
    scenes.forEach(function(el,i){
      el.classList.toggle('is-active',i===index);
      if(hasGsap&&!reduce){
        gs.to(el,{opacity:i===index?1:0,y:i===index?0:(i<index?-18:22),duration:.65,ease:'power3.out',overwrite:true});
      }
    });
    rail.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
  }

  function applyHero(p){
    heroProgress=clamp(p,0,1);
    setScene(Math.min(3,Math.floor(heroProgress*4.03)));
    if(intro){
      var introOut=clamp((heroProgress-.02)/.22,0,1);
      intro.style.opacity=String(1-introOut);
      intro.style.transform='translate3d(0,'+(-34*introOut)+'px,0)';
    }
    if(scan){
      var scanIn=clamp((heroProgress-.15)/.12,0,1);
      var scanOut=1-clamp((heroProgress-.88)/.1,0,1);
      scan.style.opacity=String(scanIn*scanOut);
      scan.style.transform='translateY('+lerp(-52,54,clamp((heroProgress-.14)/.72,0,1))+'%)';
    }
    if(depth){
      var dIn=clamp((heroProgress-.42)/.18,0,1);
      var dOut=1-clamp((heroProgress-.91)/.08,0,1);
      depth.style.opacity=String(dIn*dOut*.68);
      depth.style.transform='scale('+(1+heroProgress*.025)+')';
    }
    if(videoReady&&!reduce){desiredTime=heroProgress*Math.max(.1,video.duration-.04)}
  }

  function seekLoop(){
    if(videoReady&&!reduce){
      currentTime=lerp(currentTime,desiredTime,.18);
      if(Math.abs(video.currentTime-currentTime)>.018){
        try{video.currentTime=currentTime}catch(e){}
      }
    }
    window.requestAnimationFrame(seekLoop);
  }

  if(video){
    video.addEventListener('loadedmetadata',function(){
      videoReady=isFinite(video.duration)&&video.duration>0;
      if(videoReady){
        currentTime=desiredTime=0.01;
        video.currentTime=.01;
      }
    });
    var revealVideo=function(){
      if(videoReady&&video.readyState>=2)video.classList.add('is-ready');
    };
    video.addEventListener('loadeddata',revealVideo);
    video.addEventListener('canplay',revealVideo);
    video.addEventListener('error',function(){videoReady=false;video.classList.remove('is-ready')});
    var prime=function(){
      if(!videoReady)return;
      var play=video.play();
      if(play&&play.then)play.then(function(){video.pause()}).catch(function(){});
      window.removeEventListener('touchstart',prime);
      window.removeEventListener('pointerdown',prime);
    };
    window.addEventListener('touchstart',prime,{passive:true,once:true});
    window.addEventListener('pointerdown',prime,{passive:true,once:true});
  }
  seekLoop();

  if(hero){
    if(hasGsap&&!reduce){
      ST.create({trigger:hero,start:'top top',end:'bottom bottom',scrub:.65,onUpdate:function(self){applyHero(self.progress)}});
    }else{
      var heroScroll=function(){
        var rect=hero.getBoundingClientRect();
        var distance=Math.max(1,hero.offsetHeight-window.innerHeight);
        applyHero(clamp(-rect.top/distance,0,1));
      };
      window.addEventListener('scroll',heroScroll,{passive:true});heroScroll();
    }
  }
  setScene(0);

  /* Quiet ash field: deterministic, low-cost particles. */
  function seeded(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}}
  var ash=doc.querySelector('.va-ash');
  if(ash&&!reduce){
    var ax=ash.getContext('2d');
    var ar=seeded(79),parts=[];
    function resizeAsh(){
      var d=Math.min(1.5,window.devicePixelRatio||1),w=ash.clientWidth,h=ash.clientHeight;
      ash.width=Math.round(w*d);ash.height=Math.round(h*d);ax.setTransform(d,0,0,d,0,0);
      parts=[];var count=window.innerWidth<700?20:54;
      for(var i=0;i<count;i++)parts.push({x:ar()*w,y:ar()*h,r:.35+ar()*1.2,s:.08+ar()*.22,a:.08+ar()*.3,dr:(ar()-.5)*.08});
    }
    function drawAsh(){
      var w=ash.clientWidth,h=ash.clientHeight;ax.clearRect(0,0,w,h);ax.fillStyle='#fff';
      parts.forEach(function(p){p.y-=p.s;p.x+=p.dr;if(p.y<-5){p.y=h+5;p.x=ar()*w}ax.globalAlpha=p.a;ax.beginPath();ax.arc(p.x,p.y,p.r,0,Math.PI*2);ax.fill()});
      ax.globalAlpha=1;requestAnimationFrame(drawAsh);
    }
    resizeAsh();drawAsh();window.addEventListener('resize',resizeAsh,{passive:true});
  }

  /* Three-step virtual unwrapping. */
  var process=doc.querySelector('[data-process]');
  var processSteps=[].slice.call(doc.querySelectorAll('[data-process-step]'));
  var volume=doc.querySelector('.va-volume');
  var surface=doc.querySelector('.va-surface');
  var letter=doc.querySelector('.va-letter');
  var processCount=doc.querySelector('.va-process-count span');
  function setProcess(index){
    processSteps.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
    if(processCount)processCount.textContent='0'+(index+1);
    if(!gs||reduce){
      if(volume)volume.style.opacity=index===0?'1':'0';
      if(surface)surface.style.opacity=index===1?'1':'0';
      if(letter)letter.style.opacity=index===2?'1':'0';
      return;
    }
    gs.to(volume,{opacity:index===0?1:0,scale:index===0?1:.76,rotateZ:index===0?-8:-16,duration:.8,ease:'power3.out',overwrite:true});
    gs.to(surface,{opacity:index===1?1:0,scale:index===1?1:.84,rotate:index===1?0:-5,duration:.8,ease:'power3.out',overwrite:true});
    gs.to(letter,{opacity:index===2?1:0,scale:index===2?1:.64,filter:index===2?'blur(0px)':'blur(12px)',duration:.9,ease:'power3.out',overwrite:true});
  }
  processSteps.forEach(function(step,i){
    if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){setProcess(i)},onEnterBack:function(){setProcess(i)}});
  });
  setProcess(0);

  /* False-signal field: glyph-like clusters resolve into horizontal fibers. */
  var falseSection=doc.querySelector('.va-turn');
  var signal=doc.querySelector('.va-signal-canvas');
  var falseProgress=0;
  if(signal){
    var sx=signal.getContext('2d'),sr=seeded(1667),fibers=[],marks=[];
    function resizeSignal(){
      var d=Math.min(1.5,window.devicePixelRatio||1),w=signal.clientWidth,h=signal.clientHeight;
      signal.width=Math.round(w*d);signal.height=Math.round(h*d);sx.setTransform(d,0,0,d,0,0);
      fibers=[];marks=[];
      for(var i=0;i<86;i++)fibers.push({y:sr()*h,amp:3+sr()*22,f:1.3+sr()*3.8,phase:sr()*6.28,a:.025+sr()*.15});
      for(var j=0;j<120;j++)marks.push({x:.18+sr()*.7,y:.13+sr()*.72,r:.7+sr()*2.1,a:.12+sr()*.55});
    }
    function drawSignal(){
      var w=signal.clientWidth,h=signal.clientHeight,p=falseProgress;
      sx.clearRect(0,0,w,h);sx.lineWidth=.7;
      fibers.forEach(function(f,idx){
        sx.strokeStyle='rgba(242,241,236,'+(f.a*lerp(.2,1,p))+')';sx.beginPath();
        for(var x=-20;x<w+20;x+=14){
          var yy=f.y+Math.sin(x/w*f.f*6.28+f.phase)*f.amp*(.7+p*.3)+(idx%3-1)*p*7;
          if(x<0)sx.moveTo(x,yy);else sx.lineTo(x,yy);
        }sx.stroke();
      });
      sx.fillStyle='#fff';
      marks.forEach(function(m){
        var spread=1-p*.72,x=m.x*w+(m.y-.5)*spread*26,y=m.y*h;
        sx.globalAlpha=m.a*(1-p*.86);sx.beginPath();sx.arc(x,y,m.r*(1-p*.35),0,Math.PI*2);sx.fill();
      });sx.globalAlpha=1;
      requestAnimationFrame(drawSignal);
    }
    resizeSignal();drawSignal();window.addEventListener('resize',resizeSignal,{passive:true});
  }
  if(falseSection){
    if(hasGsap&&!reduce){
      ST.create({trigger:falseSection,start:'top top',end:'bottom bottom',scrub:.5,onUpdate:function(self){falseProgress=self.progress;var word=doc.querySelector('.va-signal-word');if(word){word.style.opacity=String(1-clamp((self.progress-.35)/.36,0,1));word.style.filter='blur('+(self.progress*18)+'px)'}}});
    }else falseProgress=1;
  }

  /* Evidence stack, one active claim at a time. */
  var evidence=doc.querySelector('[data-evidence]');
  var evidenceSteps=[].slice.call(doc.querySelectorAll('[data-evidence-step]'));
  var slabs=[doc.querySelector('.va-slab-published'),doc.querySelector('.va-slab-surface'),doc.querySelector('.va-slab-volume')];
  var seal=doc.querySelector('.va-evidence-seal');
  var evidenceLine=doc.querySelector('.va-evidence-line span');
  function setEvidence(index){
    evidenceSteps.forEach(function(el,i){el.classList.toggle('is-active',i===index)});
    slabs.forEach(function(el,i){if(!el)return;var on=i<=Math.min(index,2);if(gs&&!reduce)gs.to(el,{opacity:on?1:.12,y:on?0:18,duration:.7,ease:'power3.out',overwrite:true});else el.style.opacity=on?'1':'.12'});
    if(seal){if(gs&&!reduce)gs.to(seal,{opacity:index===3?1:0,y:index===3?0:10,duration:.5,overwrite:true});else seal.style.opacity=index===3?'1':'0'}
    if(evidenceLine)evidenceLine.style.transform='scaleX('+((index+1)/4)+')';
  }
  evidenceSteps.forEach(function(step,i){if(hasGsap&&!reduce)ST.create({trigger:step,start:'top 58%',end:'bottom 42%',onEnter:function(){setEvidence(i)},onEnterBack:function(){setEvidence(i)}})});
  setEvidence(0);

  /* Section entrances—short, once, and never on the core scrub choreography. */
  if(hasGsap&&!reduce){
    var revealTargets=[].slice.call(doc.querySelectorAll('.va-intro-grid,.va-proof-head,.va-results .va-wrap,.va-cohort-head,.va-live-head,.va-results-track article,.va-ledger article,.va-cohort-system>span'));
    revealTargets.forEach(function(el){
      gs.from(el,{y:34,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    });
  }

  function refresh(){updateProgress();if(hasGsap)ST.refresh()}
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(refresh);
  window.addEventListener('load',refresh,{once:true});
})();
