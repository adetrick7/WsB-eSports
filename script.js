const menu=document.querySelector(".menu");const nav=document.querySelector("#navlinks");menu.addEventListener("click",()=>nav.classList.toggle("open"));document.querySelectorAll("#navlinks a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

// Player bio modal
(function(){
  const modal=document.getElementById("bioModal");
  const photo=document.getElementById("bioPhoto");
  const role=document.getElementById("bioRole");
  const name=document.getElementById("bioName");
  const text=document.getElementById("bioText");
  const gif=document.getElementById("bioGif");
  const tiktok=document.getElementById("bioTiktok");
  const cards=document.querySelectorAll(".player-card");
  if(!modal||!cards.length)return;

  function openBio(card){
    const nameEl=card.querySelector(".player-name h3");
    const bg=card.style.getPropertyValue("--player-photo");
    photo.style.backgroundImage=bg||"none";
    role.textContent=card.dataset.role||"";
    name.textContent=nameEl?nameEl.textContent.trim():"";
    const hasGif=card.dataset.bioGif==="tenor-jetpack-cat";
    text.textContent=card.dataset.bio||(hasGif?"":"Bio coming soon.");
    text.hidden=hasGif&&!card.dataset.bio;
    if(gif)gif.hidden=!hasGif;
    const link=card.dataset.tiktok;
    if(link){tiktok.href=link;tiktok.style.display="inline-flex";}
    else{tiktok.style.display="none";}
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }
  function closeBio(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }
  cards.forEach(card=>{
    card.setAttribute("tabindex","0");
    card.setAttribute("role","button");
    card.addEventListener("click",()=>openBio(card));
    card.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){e.preventDefault();openBio(card);}
    });
  });
  modal.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",closeBio));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeBio();});
})();

// Join popup
(function(){
  const joinModal=document.getElementById("joinModal");
  const navJoinLink=document.getElementById("navJoinLink");
  if(!joinModal||!navJoinLink)return;

  function openJoin(){
    joinModal.classList.add("open");
    joinModal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }
  function closeJoin(){
    joinModal.classList.remove("open");
    joinModal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }
  navJoinLink.addEventListener("click",e=>{
    e.preventDefault();
    openJoin();
  });
  joinModal.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",closeJoin));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeJoin();});
})();

// TikTok clip carousel
(function(){
  const carousel=document.getElementById("clipCarousel");
  if(!carousel)return;
  const slides=Array.from(carousel.querySelectorAll(".clip-slide"));
  const dots=Array.from(carousel.querySelectorAll(".clip-dot"));
  const prevBtn=carousel.querySelector(".clip-prev");
  const nextBtn=carousel.querySelector(".clip-next");
  let index=0;
  let timer=null;
  const DELAY=7000;

  function show(i){
    index=(i+slides.length)%slides.length;
    slides.forEach((s,n)=>s.classList.toggle("active",n===index));
    dots.forEach((d,n)=>d.classList.toggle("active",n===index));
  }
  function next(){show(index+1);}
  function prev(){show(index-1);}
  function start(){timer=setInterval(next,DELAY);}
  function stop(){clearInterval(timer);}
  function restart(){stop();start();}

  nextBtn.addEventListener("click",()=>{next();restart();});
  prevBtn.addEventListener("click",()=>{prev();restart();});
  dots.forEach((d,n)=>d.addEventListener("click",()=>{show(n);restart();}));
  carousel.addEventListener("mouseenter",stop);
  carousel.addEventListener("mouseleave",start);

  show(0);
  start();
})();


// Hidden Minecraft Easter egg on WSB_Ingraham's card
(function(){
  const avatarBtn=document.getElementById("ingrahamAvatarBtn");
  const peek=document.getElementById("mcPeek");
  const bubble=document.getElementById("mcBubble");
  const peekImg=document.getElementById("mcPeekImg");
  const creeper=document.getElementById("mcCreeper");
  const achievement=document.getElementById("mcAchievement");
  if(!avatarBtn||!peek||!bubble)return;

  const SESSION_KEY="wsbMcTriggerCount";
  const ACHIEVEMENT_KEY="wsbMcAchievementShown";
  const reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RANDOM_MESSAGES=["go away","wrong game","where diamonds","fortnite?","need wood","bro this is not hypixel","0.07 kd is crazy","Dirt 1 \uD83D\uDC80"];

  let hideTimer=null;
  let wobbleTimer=null;
  let active=false;

  function getCount(){
    try{return parseInt(sessionStorage.getItem(SESSION_KEY)||"0",10);}catch(e){return 0;}
  }
  function setCount(n){
    try{sessionStorage.setItem(SESSION_KEY,String(n));}catch(e){}
  }
  function achievementShown(){
    try{return sessionStorage.getItem(ACHIEVEMENT_KEY)==="1";}catch(e){return false;}
  }
  function markAchievementShown(){
    try{sessionStorage.setItem(ACHIEVEMENT_KEY,"1");}catch(e){}
  }

  // Tiny synthesized 8-bit-style blip — no external audio file needed.
  // Only ever called from within the click handler below, so it's always
  // tied to a real user gesture and never autoplays.
  function playBlip(){
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)return;
      const ctx=new Ctx();
      const o=ctx.createOscillator();
      const g=ctx.createGain();
      o.type="square";
      o.frequency.value=660;
      g.gain.value=0.02;
      o.connect(g);
      g.connect(ctx.destination);
      const now=ctx.currentTime;
      o.frequency.exponentialRampToValueAtTime(880,now+0.08);
      g.gain.exponentialRampToValueAtTime(0.0001,now+0.16);
      o.start(now);
      o.stop(now+0.18);
      o.onended=function(){ctx.close();};
    }catch(e){}
  }

  function showAchievement(){
    if(!achievement||achievementShown())return;
    markAchievementShown();
    achievement.classList.add("show");
    achievement.setAttribute("aria-hidden","false");
    setTimeout(function(){
      achievement.classList.remove("show");
      achievement.setAttribute("aria-hidden","true");
    },3200);
  }

  function clearTimers(){
    clearTimeout(hideTimer);
    clearTimeout(wobbleTimer);
  }

  function onMouseMove(e){
    if(!active)return;
    const isCreeper=peek.classList.contains("creeper-mode");
    const target=isCreeper?creeper:peekImg;
    if(!target)return;
    const rect=target.getBoundingClientRect();
    const cx=rect.left+rect.width/2;
    const cy=rect.top+rect.height/2;
    const dist=Math.hypot(e.clientX-cx,e.clientY-cy);
    if(dist<Math.max(rect.width,rect.height)*1.6){
      retreat(true);
    }
  }

  function retreat(fast){
    clearTimers();
    active=false;
    document.removeEventListener("mousemove",onMouseMove);
    if(fast)peek.classList.add("fast-retreat");
    peek.classList.remove("active","wobble");
    setTimeout(function(){
      peek.classList.remove("fast-retreat","silent","creeper-mode");
    },260);
  }

  function trigger(){
    clearTimers();
    peek.classList.remove("wobble","fast-retreat","silent","creeper-mode");

    const count=getCount()+1;
    setCount(count);

    const isCreeper=Math.random()<0.015;

    if(isCreeper){
      peek.classList.add("creeper-mode");
      bubble.textContent="";
    }else if(count===1){
      bubble.textContent="sup?";
    }else if(count===2){
      bubble.textContent="you again?";
    }else if(count===3){
      bubble.textContent="bro";
    }else if(count===4){
      bubble.textContent="";
      peek.classList.add("silent");
    }else{
      bubble.textContent=RANDOM_MESSAGES[Math.floor(Math.random()*RANDOM_MESSAGES.length)];
    }

    active=true;
    peek.classList.add("active");
    playBlip();

    if(!reduceMotion){
      wobbleTimer=setTimeout(function(){
        if(active)peek.classList.add("wobble");
      },480);
    }

    document.addEventListener("mousemove",onMouseMove);

    const duration=isCreeper?800:(reduceMotion?1400:3000);
    hideTimer=setTimeout(function(){
      retreat(false);
    },duration);

    if(count===5)showAchievement();
  }

  avatarBtn.addEventListener("click",function(){
    trigger();
  });

  // Clicking the character itself while he's out: cut the message and bail immediately
  function onCharacterClick(e){
    e.stopPropagation();
    bubble.textContent="";
    retreat(true);
  }
  if(peekImg)peekImg.addEventListener("click",onCharacterClick);
  if(creeper)creeper.addEventListener("click",onCharacterClick);
})();


// Saved Fortnite stats snapshot (Members page)
// The server refreshes this file regularly, so the page loads one saved file instead
// of making a separate live API request for every member card.
(function(){
  const cards=document.querySelectorAll("[data-fn-user]");
  const refreshNote=document.getElementById("membersRefreshNote");
  if(!cards.length)return;

  function fmtInt(n){return Math.round(n).toLocaleString("en-US");}

  function formatPacific(timestamp){
    return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"America/Los_Angeles",timeZoneName:"short"}).format(new Date(timestamp));
  }

  function setSyncIssue(card,hasIssue){
    const existing=card.querySelector(".member-sync-status");
    if(!hasIssue){
      if(existing)existing.remove();
      card.classList.remove("sync-issue");
      return;
    }
    card.classList.add("sync-issue");
    if(existing)return;
    const indicator=document.createElement("span");
    indicator.className="member-sync-status";
    indicator.setAttribute("role","img");
    indicator.setAttribute("aria-label","Stats sync needs attention");
    indicator.title="Stats sync needs attention";
    card.appendChild(indicator);
  }

  function setProfileLink(card,member){
    if(!member||card.dataset.profileLinkReady)return;
    card.dataset.profileLinkReady="true";
    card.classList.add("member-card-link");
    card.setAttribute("role","link");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label","Open "+member.displayName+" detailed stats");
    function openProfile(){window.location.href="stats/"+encodeURIComponent(member.id)+"/";}
    card.addEventListener("click",openProfile);
    card.addEventListener("keydown",function(event){
      if(event.key==="Enter"||event.key===" "){event.preventDefault();openProfile();}
    });
  }

  function applyStats(card,stats){
    const map={
      kd:v=>v.toFixed(2),
      winrate:v=>v.toFixed(1)+"%",
      wins:v=>fmtInt(v),
      kills:v=>fmtInt(v),
      matches:v=>fmtInt(v)
    };
    Object.keys(map).forEach(function(key){
      if(stats[key]===undefined||isNaN(stats[key]))return;
      const el=card.querySelector('[data-stat="'+key+'"]');
      if(el)el.textContent=map[key](stats[key]);
    });
  }

  Promise.all([
    fetch("data/latest.json",{cache:"no-store"}).then(function(res){return res.ok?res.json():null;}),
    fetch("data/roster.json",{cache:"no-store"}).then(function(res){return res.ok?res.json():[];})
  ]).then(function(results){
    const snapshot=results[0];
    const roster=Array.isArray(results[1])?results[1]:[];
    const rosterByUsername=new Map(roster.map(function(member){return [member.username,member];}));
    cards.forEach(function(card){
      setProfileLink(card,rosterByUsername.get(card.getAttribute("data-fn-user")));
    });
    if(!snapshot||!snapshot.players)return;
    if(refreshNote&&snapshot.fetchedAt){
      refreshNote.textContent="Last updated "+formatPacific(snapshot.fetchedAt)+". Refreshes hourly on the hour.";
    }
    const byUsername=new Map(Object.values(snapshot.players).map(function(player){return [player.username,player];}));
    cards.forEach(function(card){
      const stats=byUsername.get(card.getAttribute("data-fn-user"));
      setSyncIssue(card,!stats);
      if(stats)applyStats(card,stats);
    });
  }).catch(function(){
    // Keep the simple roster view if saved data is unavailable.
  });
})();


// Spooky Surprise theme toggle — persists across pages via localStorage
(function(){
  const btn=document.getElementById("spookyToggle");
  if(!btn)return;

  const KEY="wsbHalloweenTheme";

  function apply(on){
    document.body.classList.toggle("halloween-theme",on);
    btn.setAttribute("aria-pressed",on?"true":"false");
    btn.textContent=on?"🎃 Back to Normal":"🎃 Spooky Surprise";
  }

  let on=false;
  try{on=localStorage.getItem(KEY)==="1";}catch(e){}
  apply(on);

  btn.addEventListener("click",function(){
    on=!on;
    try{localStorage.setItem(KEY,on?"1":"0");}catch(e){}
    apply(on);
  });
})();


// Leaderboards page — reads saved hourly JSON snapshots written by GitHub Actions
(function(){
  const pastDayGrid=document.getElementById("lbPastDayGrid");
  const pastWeekGrid=document.getElementById("lbPastWeekGrid");
  const lifetimeGrid=document.getElementById("lbLifetimeGrid");
  const lifetimeRefreshNote=document.getElementById("lbLifetimeRefreshNote");
  if(!pastDayGrid||!pastWeekGrid||!lifetimeGrid)return;

  const DAY_MS=24*60*60*1000;
  const WEEK_MS=7*DAY_MS;
  const BASELINE_TOLERANCE_MS=6*60*60*1000;

  function fmtInt(n){return Math.round(n).toLocaleString("en-US");}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];});}
  function medalRank(i){return i+1;}

  function buildCategory(title,rows,valueFmt){
    if(!rows.length)return "";
    let html='<div class="lb-category"><h3>'+title+"</h3>";
    rows.slice(0,5).forEach(function(row,i){
      html+='<div class="lb-row"><div class="lb-rank">'+medalRank(i)+"</div>"
        +(row.id?'<a class="lb-name" href="stats/'+encodeURIComponent(row.id)+'/" aria-label="Open '+escapeHtml(row.name)+' stats">'+escapeHtml(row.name)+'</a>':'<div class="lb-name">'+escapeHtml(row.name)+'</div>')
        +'<div class="lb-value">'+valueFmt(row.value)+"</div></div>";
    });
    return html+="</div>";
  }

  function topBy(entries,key,n){
    return entries.filter(function(e){return typeof e[key]==="number"&&!isNaN(e[key]);})
      .sort(function(a,b){return b[key]-a[key];})
      .slice(0,n||5)
      .map(function(e){return {id:e.id,name:e.displayName,value:e[key]};});
  }

  function formatPacific(value){
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value));
  }

  function findBaseline(snapshots,targetTime){
    return snapshots
      .filter(function(snapshot){return snapshot&&snapshot.players&&Number.isFinite(Date.parse(snapshot.fetchedAt));})
      .sort(function(a,b){return Math.abs(Date.parse(a.fetchedAt)-targetTime)-Math.abs(Date.parse(b.fetchedAt)-targetTime);})
      .find(function(snapshot){return Math.abs(Date.parse(snapshot.fetchedAt)-targetTime)<=BASELINE_TOLERANCE_MS;});
  }

  function buildDeltaEntries(latest,baseline){
    const entries=[];
    Object.keys(latest.players).forEach(function(id){
      const cur=latest.players[id];
      const prev=baseline.players[id];
      if(!prev)return;
      if(prev.username&&cur.username&&prev.username!==cur.username)return;
      const deltaKills=cur.kills-prev.kills;
      const deltaWins=cur.wins-prev.wins;
      const deltaMatches=cur.matches-prev.matches;
      if(deltaKills<0||deltaWins<0||deltaMatches<0)return;
      entries.push({id:id,displayName:cur.displayName,deltaKills:deltaKills,deltaWins:deltaWins,deltaMatches:deltaMatches});
    });
    return entries;
  }

  function renderPeriod(grid,latest,baseline,waitingMessage,periodLabel){
    if(!baseline||!baseline.players||!Object.keys(baseline.players).length){
      grid.innerHTML='<p class="lb-empty">'+waitingMessage+"</p>";
      return;
    }
    const entries=buildDeltaEntries(latest,baseline);
    let html="";
    html+=buildCategory("Most Kills ("+periodLabel+")",topBy(entries,"deltaKills"),fmtInt);
    html+=buildCategory("Most Wins ("+periodLabel+")",topBy(entries,"deltaWins"),fmtInt);
    html+=buildCategory("Most Matches ("+periodLabel+")",topBy(entries,"deltaMatches"),fmtInt);
    grid.innerHTML=html||'<p class="lb-empty">No player activity recorded yet.</p>';
  }

  Promise.all([
    fetch("data/latest.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch("data/history.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch("data/roster.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
  ]).then(function(results){
    const latest=results[0];
    const history=results[1];
    const roster=Array.isArray(results[2])?results[2]:[];
    if(!latest||!latest.players||!Object.keys(latest.players).length)return;
    const activeIds=new Set(roster.map(function(member){return member.id;}));
    const activePlayers=Object.fromEntries(Object.entries(latest.players).filter(function(entry){return activeIds.has(entry[0]);}));
    const activeLatest=Object.assign({},latest,{players:activePlayers});
    if(!Object.keys(activeLatest.players).length)return;
    const latestTime=Date.parse(latest.fetchedAt);
    const snapshots=history&&Array.isArray(history.snapshots)?history.snapshots:[];

    if(lifetimeRefreshNote&&latest.fetchedAt){
      lifetimeRefreshNote.textContent="Last updated "+formatPacific(latest.fetchedAt)+". Refreshes hourly on the hour.";
    }

    const lifetimeEntries=Object.entries(activeLatest.players).map(function(entry){return Object.assign({id:entry[0]},entry[1]);});
    let lifetimeHtml="";
    lifetimeHtml+=buildCategory("Best K/D",topBy(lifetimeEntries,"kd"),function(v){return v.toFixed(2);});
    lifetimeHtml+=buildCategory("Most Kills (Lifetime)",topBy(lifetimeEntries,"kills"),fmtInt);
    lifetimeHtml+=buildCategory("Most Wins (Lifetime)",topBy(lifetimeEntries,"wins"),fmtInt);
    lifetimeGrid.innerHTML=lifetimeHtml||lifetimeGrid.innerHTML;

    renderPeriod(pastDayGrid,activeLatest,findBaseline(snapshots,latestTime-DAY_MS),"24-hour stats will be ready tomorrow.","24 Hours");
    renderPeriod(pastWeekGrid,activeLatest,findBaseline(snapshots,latestTime-WEEK_MS),"Weekly stats will be ready next week.","7 Days");
  });
})();


// Live countdown timers (Announcements + Events pages)
(function(){
  const widgets = document.querySelectorAll("[data-countdown-target]");
  if(!widgets.length) return;

  function update(){
    widgets.forEach(function(widget){
      const target = new Date(widget.getAttribute("data-countdown-target")).getTime();
      const now = Date.now();
      let diff = target - now;

      const daysEl = widget.querySelector('[data-cd="days"]');
      const hoursEl = widget.querySelector('[data-cd="hours"]');
      const minutesEl = widget.querySelector('[data-cd="minutes"]');
      const secondsEl = widget.querySelector('[data-cd="seconds"]');

      if(diff <= 0){
        if(daysEl) daysEl.textContent = "0";
        if(hoursEl) hoursEl.textContent = "0";
        if(minutesEl) minutesEl.textContent = "0";
        if(secondsEl) secondsEl.textContent = "0";
        return;
      }

      const days = Math.floor(diff / 86400000);
      diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours * 3600000;
      const minutes = Math.floor(diff / 60000);
      diff -= minutes * 60000;
      const seconds = Math.floor(diff / 1000);

      if(daysEl) daysEl.textContent = days;
      if(hoursEl) hoursEl.textContent = hours;
      if(minutesEl) minutesEl.textContent = minutes;
      if(secondsEl) secondsEl.textContent = seconds;
    });
  }

  update();
  setInterval(update, 1000);
})();


// FAQ accordion (Questions page)
(function(){
  const items = document.querySelectorAll(".faq-item");
  if(!items.length) return;

  items.forEach(function(item){
    const btn = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if(!btn || !answer) return;

    btn.addEventListener("click", function(){
      const isOpen = item.classList.contains("open");
      item.classList.toggle("open", !isOpen);
      answer.style.maxHeight = isOpen ? "0" : answer.scrollHeight + "px";
    });
  });
})();


// Stats page — detailed member profile view
(function(){
  const overview=document.getElementById("statsOverview");
  const highlights=document.getElementById("statsHighlights");
  const directory=document.getElementById("statsDirectory");
  const refreshNote=document.getElementById("statsRefreshNote");
  const directoryNote=document.getElementById("statsDirectoryNote");
  if(!overview||!highlights||!directory)return;

  const avatarAssets={
    lizzie:"lizzie.png",lazy:"lazyfinalboss.png",zumiez:"zumiez.jpg",jen:"jen.jpg",
    barrelroll:"barrelroll.jpg",botlupitaa:"lupitaa.jpg",buck:"buck.jpg",dubs:"dubs.jpg",ttbobbyfn:"ttbobby.jpg",elusion:"elusion.png",natii:"natii.png"
  };

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];});
  }
  function fmtInt(value){return Math.round(value||0).toLocaleString("en-US");}
  function fmtDecimal(value){return Number(value||0).toFixed(2);}
  function fmtPercent(value){return Number(value||0).toFixed(1)+"%";}
  function formatPacific(value){
    return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value));
  }
  function leader(entries,key){
    return entries.reduce(function(best,entry){return !best||entry.stats[key]>best.stats[key]?entry:best;},null);
  }
  function highlight(label,entry,value){
    if(!entry)return "";
    return '<div class="stats-highlight"><span>'+label+'</span><strong>'+escapeHtml(entry.member.displayName)+'</strong><b>'+value+'</b></div>';
  }
  function initials(name){
    return name.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"W";
  }

  Promise.all([
    fetch("data/roster.json",{cache:"no-store"}).then(function(response){return response.ok?response.json():[];}).catch(function(){return [];}),
    fetch("data/latest.json",{cache:"no-store"}).then(function(response){return response.ok?response.json():null;}).catch(function(){return null;})
  ]).then(function(results){
    const roster=Array.isArray(results[0])?results[0]:[];
    const snapshot=results[1];
    const players=snapshot&&snapshot.players?snapshot.players:{};
    const entries=roster.map(function(member){return {member:member,stats:players[member.id]||null};});
    const synced=entries.filter(function(entry){return entry.stats;});

    if(refreshNote&&snapshot&&snapshot.fetchedAt){
      refreshNote.textContent="Last updated "+formatPacific(snapshot.fetchedAt)+". Refreshes hourly on the hour.";
    }
    if(directoryNote){
      directoryNote.textContent=synced.length+" of "+roster.length+" linked profiles synced.";
    }

    const total=function(key){return synced.reduce(function(sum,entry){return sum+(Number(entry.stats[key])||0);},0);};
    const summary=[
      ["LINKED PROFILES",synced.length+" / "+roster.length],
      ["TOTAL WINS",fmtInt(total("wins"))],
      ["TOTAL KILLS",fmtInt(total("kills"))],
      ["TOTAL MATCHES",fmtInt(total("matches"))]
    ];
    overview.innerHTML=summary.map(function(item){return '<div class="stats-summary-card"><span>'+item[0]+'</span><strong>'+item[1]+'</strong></div>';}).join("");

    const topKd=leader(synced,"kd");
    const topWinRate=leader(synced,"winrate");
    const topKills=leader(synced,"kills");
    const topWins=leader(synced,"wins");
    highlights.innerHTML=
      highlight("BEST K/D",topKd,topKd?fmtDecimal(topKd.stats.kd):"—")+
      highlight("BEST WIN RATE",topWinRate,topWinRate?fmtPercent(topWinRate.stats.winrate):"—")+
      highlight("MOST KILLS",topKills,topKills?fmtInt(topKills.stats.kills):"—")+
      highlight("MOST WINS",topWins,topWins?fmtInt(topWins.stats.wins):"—");

    const leaderIds=new Map([[topKd,"Top K/D"],[topWinRate,"Best Win Rate"],[topKills,"Most Kills"],[topWins,"Most Wins"]].filter(function(pair){return pair[0];}).map(function(pair){return [pair[0].member.id,pair[1]];}));
    const searchInput=document.getElementById("statsSearch");
    const sortInput=document.getElementById("statsSort");

    function metricValue(entry,key){
      if(!entry.stats)return null;
      if(key==="killsPerMatch")return entry.stats.matches?entry.stats.kills/entry.stats.matches:0;
      return Number(entry.stats[key])||0;
    }

    function playerCard(entry){
      const member=entry.member;
      const stats=entry.stats;
      const asset=avatarAssets[member.id];
      const avatar=asset
        ? '<div class="stats-avatar" style="background-image:url('+asset+')"></div>'
        : '<div class="stats-avatar stats-avatar-initial">'+initials(member.displayName)+'</div>';
      const badge=leaderIds.get(member.id)?'<span class="stats-badge">'+leaderIds.get(member.id)+'</span>':"";
      if(!stats){
        return '<a class="stats-player stats-player-issue" href="stats/'+encodeURIComponent(member.id)+'/" aria-label="Open '+escapeHtml(member.displayName)+' stats">'+avatar+'<div class="stats-player-head"><div><h3>'+escapeHtml(member.displayName)+'</h3><p>'+escapeHtml(member.username)+'</p></div><span class="stats-sync-state"><i></i>Needs attention</span></div><p class="stats-issue-copy">This linked profile did not return data in the latest refresh. Check the Fortnite name and profile privacy.</p></a>';
      }
      const killsPerMatch=stats.matches?stats.kills/stats.matches:0;
      return '<a class="stats-player" href="stats/'+encodeURIComponent(member.id)+'/" aria-label="Open '+escapeHtml(member.displayName)+' stats">'+avatar+'<div class="stats-player-head"><div><h3>'+escapeHtml(member.displayName)+'</h3><p>'+escapeHtml(stats.username||member.username)+'</p></div><span class="stats-sync-state stats-sync-ok"><i></i>Synced</span></div>'+badge+'<div class="stats-metrics">'
        +'<div><span>K/D</span><b>'+fmtDecimal(stats.kd)+'</b></div>'
        +'<div><span>WIN RATE</span><b>'+fmtPercent(stats.winrate)+'</b></div>'
        +'<div><span>WINS</span><b>'+fmtInt(stats.wins)+'</b></div>'
        +'<div><span>KILLS</span><b>'+fmtInt(stats.kills)+'</b></div>'
        +'<div><span>MATCHES</span><b>'+fmtInt(stats.matches)+'</b></div>'
        +'<div><span>KILLS / MATCH</span><b>'+fmtDecimal(killsPerMatch)+'</b></div>'
        +'</div></a>';
    }

    function renderDirectory(){
      const search=(searchInput&&searchInput.value||"").trim().toLocaleLowerCase();
      const sort=sortInput?sortInput.value:"roster";
      const filtered=entries.filter(function(entry){
        const searchable=(entry.member.displayName+" "+entry.member.username).toLocaleLowerCase();
        return !search||searchable.includes(search);
      });
      if(sort==="name"){
        filtered.sort(function(a,b){return a.member.displayName.localeCompare(b.member.displayName);});
      }else if(sort==="issue"){
        filtered.sort(function(a,b){return Number(Boolean(a.stats))-Number(Boolean(b.stats));});
      }else if(sort!=="roster"){
        filtered.sort(function(a,b){
          const aValue=metricValue(a,sort);
          const bValue=metricValue(b,sort);
          if(aValue===null)return 1;
          if(bValue===null)return -1;
          return bValue-aValue||a.member.displayName.localeCompare(b.member.displayName);
        });
      }
      if(directoryNote)directoryNote.textContent=filtered.length+" of "+roster.length+" profiles shown.";
      directory.innerHTML=filtered.map(playerCard).join("")||'<p class="lb-empty">No players match your search.</p>';
    }

    if(searchInput)searchInput.addEventListener("input",renderDirectory);
    if(sortInput)sortInput.addEventListener("change",renderDirectory);
    renderDirectory();
  });
})();


// Player Stats detail pages
(function(){
  const detail=document.getElementById("playerDetail");
  const memberId=document.body.dataset.memberId;
  const root=document.body.dataset.siteRoot||"";
  if(!detail||!memberId)return;

  const avatarAssets={
    lizzie:"lizzie.png",lazy:"lazyfinalboss.png",zumiez:"zumiez.jpg",jen:"jen.jpg",
    barrelroll:"barrelroll.jpg",botlupitaa:"lupitaa.jpg",buck:"buck.jpg",dubs:"dubs.jpg",ttbobbyfn:"ttbobby.jpg",elusion:"elusion.png",natii:"natii.png"
  };
  const streamProfiles={
    lizzie:{platform:"TikTok",url:"https://www.tiktok.com/@ok.lizzlee"},
    jen:{platform:"TikTok",url:"https://www.tiktok.com/@jenclipsmen"}
  };
  const DAY_MS=24*60*60*1000;
  const WEEK_MS=7*DAY_MS;
  const BASELINE_TOLERANCE_MS=6*60*60*1000;
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character];});}
  function fmtInt(value){return Math.round(value||0).toLocaleString("en-US");}
  function fmtDecimal(value){return Number(value||0).toFixed(2);}
  function fmtPercent(value){return Number(value||0).toFixed(1)+"%";}
  function formatPacific(value){return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value));}
  function fitProfileName(){
    const name=detail.querySelector(".profile-hero-card h1");
    if(!name)return;
    name.style.fontSize="";
    name.style.whiteSpace="nowrap";
    const minimum=window.innerWidth<=650?24:30;
    let size=parseFloat(window.getComputedStyle(name).fontSize);
    while(name.scrollWidth>name.clientWidth&&size>minimum){
      size-=1;
      name.style.fontSize=size+"px";
    }
  }
  window.addEventListener("resize",fitProfileName);

  function setupComparison(synced,currentMember,currentStats){
    const toggle=document.getElementById("profileCompareToggle");
    const controls=document.getElementById("profileCompareControls");
    const select=document.getElementById("profileCompareSelect");
    const result=document.getElementById("profileCompareResult");
    if(!toggle||!controls||!select||!result)return;
    const candidates=synced.filter(function(entry){return entry.id!==currentMember.id;}).sort(function(a,b){return a.member.displayName.localeCompare(b.member.displayName);});
    select.innerHTML='<option value="">Choose a member</option>'+candidates.map(function(entry){return '<option value="'+escapeHtml(entry.id)+'">'+escapeHtml(entry.member.displayName)+'</option>';}).join("");
    toggle.addEventListener("click",function(){
      const opening=controls.hidden;
      controls.hidden=!opening;
      toggle.setAttribute("aria-expanded",opening?"true":"false");
    });
    function valueClass(current,other){
      if(current===other)return "";
      return current>other?"profile-compare-winner":"profile-compare-lower";
    }
    function row(label,current,other,formatter){
      return '<div class="profile-compare-row"><b class="'+valueClass(current,other)+'">'+formatter(current)+'</b><span>'+label+'</span><b class="'+valueClass(other,current)+'">'+formatter(other)+'</b></div>';
    }
    function render(otherEntry){
      const other=otherEntry.stats;
      const currentKpm=currentStats.matches?currentStats.kills/currentStats.matches:0;
      const otherKpm=other.matches?other.kills/other.matches:0;
      result.innerHTML='<div class="profile-compare-matchup"><div><span>VIEWING</span><strong>'+escapeHtml(currentMember.displayName)+'</strong></div><i>VS</i><div><span>COMPARING</span><strong>'+escapeHtml(otherEntry.member.displayName)+'</strong></div></div><div class="profile-compare-rows">'
        +row("K/D",currentStats.kd,other.kd,fmtDecimal)
        +row("WIN RATE",currentStats.winrate,other.winrate,fmtPercent)
        +row("WINS",currentStats.wins,other.wins,fmtInt)
        +row("KILLS",currentStats.kills,other.kills,fmtInt)
        +row("MATCHES",currentStats.matches,other.matches,fmtInt)
        +row("KILLS / MATCH",currentKpm,otherKpm,fmtDecimal)
        +'</div><p class="profile-compare-key"><b>Brighter number</b> has the higher value for that stat.</p>';
    }
    select.addEventListener("change",function(){
      const selected=candidates.find(function(entry){return entry.id===select.value;});
      result.innerHTML=selected?"":'<p class="profile-empty">Choose a synced member to compare their stats.</p>';
      if(selected)render(selected);
    });
    result.innerHTML='<p class="profile-empty">Choose a synced member to compare their stats.</p>';
  }

  function findBaseline(snapshots,targetTime){
    return snapshots.filter(function(snapshot){return snapshot&&snapshot.players&&Number.isFinite(Date.parse(snapshot.fetchedAt));})
      .sort(function(a,b){return Math.abs(Date.parse(a.fetchedAt)-targetTime)-Math.abs(Date.parse(b.fetchedAt)-targetTime);})
      .find(function(snapshot){return Math.abs(Date.parse(snapshot.fetchedAt)-targetTime)<=BASELINE_TOLERANCE_MS;});
  }
  function activity(latest,baseline,id,label,emptyText){
    const previous=baseline&&baseline.players?baseline.players[id]:null;
    const current=latest.players[id];
    if(!previous||!current)return '<section class="profile-panel"><p class="label">'+label+'</p><p class="profile-empty">'+emptyText+"</p></section>";
    const kills=current.kills-previous.kills;
    const wins=current.wins-previous.wins;
    const matches=current.matches-previous.matches;
    if(kills<0||wins<0||matches<0)return '<section class="profile-panel"><p class="label">'+label+'</p><p class="profile-empty">New activity data will appear after the next refresh.</p></section>';
    return '<section class="profile-panel"><p class="label">'+label+'</p><div class="profile-activity-stats"><div><span>KILLS</span><b>'+fmtInt(kills)+'</b></div><div><span>WINS</span><b>'+fmtInt(wins)+'</b></div><div><span>MATCHES</span><b>'+fmtInt(matches)+'</b></div></div></section>';
  }

  Promise.all([
    fetch(root+"data/roster.json",{cache:"no-store"}).then(function(response){return response.ok?response.json():[];}).catch(function(){return [];}),
    fetch(root+"data/latest.json",{cache:"no-store"}).then(function(response){return response.ok?response.json():null;}).catch(function(){return null;}),
    fetch(root+"data/history.json",{cache:"no-store"}).then(function(response){return response.ok?response.json():null;}).catch(function(){return null;})
  ]).then(function(results){
    const roster=Array.isArray(results[0])?results[0]:[];
    const latest=results[1];
    const history=results[2];
    const member=roster.find(function(item){return item.id===memberId;});
    if(!member){detail.innerHTML='<p class="lb-empty">This player profile could not be found.</p>';return;}
    const stats=latest&&latest.players?latest.players[member.id]:null;
    const asset=avatarAssets[member.id];
    const avatar=asset?'<div class="profile-avatar" style="background-image:url('+escapeHtml(root+asset)+')"></div>':'<div class="profile-avatar profile-avatar-initial">'+escapeHtml(member.displayName.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"W")+'</div>';
    const status=stats?'<span class="stats-sync-state stats-sync-ok"><i></i>Synced</span>':'<span class="stats-sync-state"><i></i>Needs attention</span>';
    const stream=streamProfiles[member.id];
    const streamLink=stream?'<a class="profile-stream-link" href="'+escapeHtml(stream.url)+'" target="_blank" rel="noopener"><i></i>'+escapeHtml(stream.platform).toUpperCase()+' STREAMER<span>VIEW PROFILE ↗</span></a>':'';
    let html='<a class="profile-back" href="'+root+'stats.html">← BACK TO ALL STATS</a><section class="profile-hero-card">'+avatar+'<div><p class="label">FORTNITE MEMBER PROFILE</p><h1>'+escapeHtml(member.displayName)+'</h1><p class="profile-username">'+escapeHtml((stats&&stats.username)||member.username)+'</p>'+status+streamLink+'</div></section>';
    if(!stats){
      detail.innerHTML=html+'<section class="profile-panel profile-panel-wide"><p class="label">PROFILE STATUS</p><h2>STATS NEED ATTENTION</h2><p class="profile-empty">This linked Fortnite profile did not return data in the latest refresh. Check the player name and make sure Public Game Stats are enabled.</p></section>';
      requestAnimationFrame(fitProfileName);
      return;
    }
    const rosterById=new Map(roster.map(function(entry){return [entry.id,entry];}));
    const synced=Object.keys(latest.players).map(function(id){
      const syncedMember=rosterById.get(id)||{id:id,displayName:latest.players[id].displayName||id};
      return {id:id,member:syncedMember,stats:latest.players[id]};
    });
    function rank(key){return synced.slice().sort(function(a,b){return b.stats[key]-a.stats[key];}).findIndex(function(entry){return entry.id===member.id;})+1;}
    const killsPerMatch=stats.matches?stats.kills/stats.matches:0;
    html+='<div class="profile-performance">'
      +'<div class="profile-stat-card"><span>K/D</span><b>'+fmtDecimal(stats.kd)+'</b></div>'
      +'<div class="profile-stat-card"><span>WIN RATE</span><b>'+fmtPercent(stats.winrate)+'</b></div>'
      +'<div class="profile-stat-card"><span>WINS</span><b>'+fmtInt(stats.wins)+'</b></div>'
      +'<div class="profile-stat-card"><span>KILLS</span><b>'+fmtInt(stats.kills)+'</b></div>'
      +'<div class="profile-stat-card"><span>MATCHES</span><b>'+fmtInt(stats.matches)+'</b></div>'
      +'<div class="profile-stat-card"><span>KILLS / MATCH</span><b>'+fmtDecimal(killsPerMatch)+'</b></div>'
      +'</div>';
    html+='<section class="profile-panel profile-compare-panel"><button type="button" class="profile-compare-toggle" id="profileCompareToggle" aria-expanded="false"><span>COMPARE WITH ANOTHER MEMBER</span><b>↔</b></button><div class="profile-compare-controls" id="profileCompareControls" hidden><label>SELECT A SYNCED MEMBER<select id="profileCompareSelect"></select></label><div id="profileCompareResult"></div></div></section>';
    html+='<section class="profile-panel"><p class="label">TEAM STANDING</p><div class="profile-ranks">'
      +'<div><span>K/D RANK</span><b>#'+rank("kd")+'</b></div>'
      +'<div><span>WIN RATE RANK</span><b>#'+rank("winrate")+'</b></div>'
      +'<div><span>WINS RANK</span><b>#'+rank("wins")+'</b></div>'
      +'<div><span>KILLS RANK</span><b>#'+rank("kills")+'</b></div>'
      +'<div><span>MATCHES RANK</span><b>#'+rank("matches")+'</b></div>'
      +'</div></section>';
    const snapshots=history&&Array.isArray(history.snapshots)?history.snapshots:[];
    const latestTime=Date.parse(latest.fetchedAt);
    html+='<div class="profile-activity-grid">'
      +activity(latest,findBaseline(snapshots,latestTime-DAY_MS),member.id,"PAST 24 HOURS","24-hour stats will be ready tomorrow.")
      +activity(latest,findBaseline(snapshots,latestTime-WEEK_MS),member.id,"PAST 7 DAYS","Weekly stats will be ready next week.")
      +'</div><p class="profile-data-note">Last updated '+formatPacific(latest.fetchedAt)+'. Refreshes hourly on the hour.</p>';
    detail.innerHTML=html;
    setupComparison(synced,member,stats);
    requestAnimationFrame(fitProfileName);
  });
})();
