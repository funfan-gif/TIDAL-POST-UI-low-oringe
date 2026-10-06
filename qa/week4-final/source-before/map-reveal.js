"use strict";
// Native timelines only; the route geometry remains at its final scale throughout.
window.TidalMapReveal = (() => {
  const DURATION = 5500;
  const UNROLL_START = 500;
  const UNROLL_DURATION = 4500;
  // A gentle, balanced curve keeps the paper visibly unfolding across the whole pass.
  const ease = "cubic-bezier(.4,0,.6,1)";
  function captureMailbag() {
    const clone = document.querySelector(".prototype-frame").cloneNode(true);
    clone.querySelectorAll('.screen:not([data-screen="mailbag"]),.sailing-overlay,.debug-panel,.toast,.screen-flash').forEach(el => el.remove());
    clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    clone.inert = true;
    const wrap = document.createElement("div"); wrap.className = "map-continuity"; wrap.setAttribute("aria-hidden", "true"); wrap.append(clone);
    return wrap;
  }
  function create(root, route, onPhase) {
    const stage=root.querySelector(".game-stage");
    let animations=[],temporary=[],master=null,active=false,mode="none",finishedAt=0;
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    function finish({focus=true}={}) {
      if (!active) return;
      active=false; finishedAt=performance.now();
      master.onfinish=null;
      animations.forEach(a=>a.cancel()); animations=[]; master=null;
      temporary.forEach(el=>el.remove()); temporary=[];
      root.classList.remove("is-map-revealing"); root.dataset.mapPhase="MAP_READY";
      route.setEnabled(true); onPhase("MAP_READY");
      if(focus && !root.hidden)root.querySelector("#waypoint-1").focus({preventScroll:true});
    }
    function skip(event) {
      if(!active || (master.currentTime||0)<200)return;
      if(event.type==="keydown" && !["Enter"," ","Escape"].includes(event.key))return;
      event.preventDefault(); event.stopImmediatePropagation(); finish();
    }
    document.addEventListener("pointerdown",skip,true);
    document.addEventListener("keydown",skip,true);
    reduced.addEventListener("change",()=>{if(reduced.matches&&active)finish();});
    function start({full=false,continuity=null,immediate=false}={}) {
      if(active)finish({focus:false});
      if(immediate){root.dataset.mapPhase="MAP_READY";route.setEnabled(true);onPhase("MAP_READY");continuity?.remove();return;}
      active=true;mode=reduced.matches?"reduced":full?"full":"quick";
      const duration=mode==="full"?DURATION:mode==="reduced"?150:180;
      route.setEnabled(false); root.classList.add("is-map-revealing");root.dataset.mapPhase="MAP_REVEALING";onPhase("MAP_REVEALING");
      const clock=document.createElement("i");clock.className="map-reveal-clock";clock.setAttribute("aria-hidden","true");root.append(clock);temporary.push(clock);
      const epoch=document.timeline.currentTime;
      function animate(el,frames,options){const a=el.animate(frames,{fill:"both",...options});a.startTime=epoch;animations.push(a);return a;}
      master=animate(clock,[{opacity:0},{opacity:0}],{duration});master.onfinish=()=>finish();
      if(mode!=="full"){
        continuity?.remove();animate(stage,[{opacity:0},{opacity:1}],{duration,easing:"ease-out"});return;
      }
      if(continuity){document.body.append(continuity);temporary.push(continuity);animate(continuity,[{opacity:1,filter:"brightness(1)"},{opacity:0,filter:"brightness(.85)"}],{duration:150,easing:"ease-out"});}
      const origin=document.createElement("div");origin.className="map-reveal-origin";origin.setAttribute("aria-hidden","true");
      origin.innerHTML='<div class="paper-roll-carrier"><i class="paper-roll-shadow"></i><i class="paper-roll-crease"></i><div class="paper-roll"><i class="paper-roll-cap top"></i><i class="paper-roll-cap bottom"></i><span class="paper-roll-seal">TP-042</span></div></div>';
      stage.append(origin);temporary.push(origin);
      const carrier=origin.firstElementChild,roll=origin.querySelector(".paper-roll");
      animate(carrier,[{transform:"translate3d(0,0,0)"},{transform:"translate3d(1400px,0,0)"}],{delay:UNROLL_START,duration:UNROLL_DURATION,easing:ease});
      animate(roll,[{opacity:0,transform:"translateY(34px) rotateY(7deg)"},{opacity:1,transform:"translateY(0) rotateY(4deg)"}],{delay:150,duration:350,easing:"ease-out"});
      animate(origin,[{opacity:1},{opacity:0}],{delay:5000,duration:200,easing:"ease-out"});
      animate(origin.querySelector(".paper-roll-shadow"),[{transform:"scaleX(1)",opacity:1},{transform:"scaleX(.12)",opacity:0}],{delay:5000,duration:200,easing:"ease-out"});
      animate(origin.querySelector(".paper-roll-seal"),[{opacity:1,transform:"rotate(-3deg)"},{opacity:0,transform:"translateY(13px) rotate(-18deg)"}],{delay:200,duration:300,easing:"ease-out"});
      animate(root.querySelector(".chart-paper"),[{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)"}],{delay:UNROLL_START,duration:UNROLL_DURATION,easing:ease});
      for(const el of root.querySelectorAll("#route-underlay,#route-segments,#route-direction-marks,#waypoints,.port-marker,.destination-marker"))animate(el,[{opacity:0},{opacity:1}],{delay:5050,duration:180,easing:"ease-out"});
      for(const el of root.querySelectorAll("#chart text,.chart-instruction"))animate(el,[{opacity:0},{opacity:1}],{delay:5150,duration:180,easing:"ease-out"});
      animate(root.querySelector(".desk-heading"),[{opacity:0},{opacity:1}],{delay:150,duration:200,easing:"ease-out"});
      animate(root.querySelector(".ledger"),[{opacity:0,translate:"16px 0"},{opacity:1,translate:"0px 0"}],{delay:5250,duration:230,easing:"ease-out"});
      const button=document.createElement("button");button.type="button";button.className="map-reveal-skip";button.textContent="跳过摊图 · Enter";button.setAttribute("aria-label","跳过航海图摊开动画");root.append(button);temporary.push(button);
      animate(button,[{opacity:0},{opacity:1}],{delay:200,duration:80});button.focus({preventScroll:true});
    }
    return {start,finish,getState:()=>({active,mode,elapsed:master?.currentTime||0,duration:mode==="full"?DURATION:mode==="reduced"?150:180,finishedAt})};
  }
  return {create,captureMailbag};
})();
